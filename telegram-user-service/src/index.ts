import express from 'express';
import multer from 'multer';

import { cancelLogin, startLogin, submitCode, submitPassword } from './auth.js';
import { clientManager } from './clientManager.js';
import { config } from './config.js';
import { ApiError, badRequest, unauthorized } from './errors.js';
import { getAccountInfo, sendMessage } from './messaging.js';
import { sessionStore } from './store.js';

const app = express();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: config.maxUploadBytes,
		files: 1,
	},
});

app.use(express.json());
app.disable('x-powered-by');

function requireAuth(req: express.Request, _res: express.Response, next: express.NextFunction): void {
	const header = req.header('authorization') ?? '';
	const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
	next(token.length > 0 && token === config.serviceToken ? undefined : unauthorized('Invalid service token'));
}

function requireAdminId(req: express.Request): number {
	const raw = req.header('x-admin-id');
	const adminId = Number.parseInt(raw ?? '', 10);
	if (raw === undefined || !Number.isFinite(adminId) || adminId <= 0) {
		throw badRequest('Header x-admin-id is required', 'INVALID_ADMIN');
	}
	return adminId;
}

type Handler = (req: express.Request) => Promise<unknown>;

function handle(handler: Handler) {
	return (req: express.Request, res: express.Response, next: express.NextFunction): void => {
		handler(req).then((data) => res.json(data)).catch(next);
	};
}

app.get('/api/health', (_req, res) => {
	res.json({ ok: true });
});

app.post(
	'/api/connect/start',
	requireAuth,
	handle(async (req) => {
		const adminId = requireAdminId(req);
		const phone = String(req.body?.phone ?? '').trim();
		if (!/^\+?\d{7,15}$/.test(phone)) {
			throw badRequest('Phone number must be between 7 and 15 digits');
		}
		return startLogin(adminId, phone);
	}),
);

app.post(
	'/api/connect/code',
	requireAuth,
	handle(async (req) => {
		const adminId = requireAdminId(req);
		const code = String(req.body?.code ?? '').trim();
		if (!/^\d{3,8}$/.test(code)) {
			throw badRequest('Invalid login code');
		}
		return submitCode(adminId, code);
	}),
);

app.post(
	'/api/connect/password',
	requireAuth,
	handle(async (req) => {
		const adminId = requireAdminId(req);
		const password = String(req.body?.password ?? '');
		if (password.length === 0 || password.length > 128) {
			throw badRequest('Password must be between 1 and 128 characters');
		}
		return submitPassword(adminId, password);
	}),
);

app.post(
	'/api/connect/cancel',
	requireAuth,
	handle(async (req) => {
		const adminId = requireAdminId(req);
		await cancelLogin(adminId);
		return { ok: true };
	}),
);

app.get(
	'/api/status',
	requireAuth,
	handle(async (req) => {
		const adminId = requireAdminId(req);
		const stored = sessionStore.get(adminId);
		const state = clientManager.stateOf(adminId);
		return {
			adminId,
			connected: state.status === 'connected',
			status: state.status,
			lastError: state.lastError,
			hasSession: !!stored,
			account: stored
				? {
						telegramUserId: stored.telegramUserId,
						username: stored.username,
						phone: stored.phoneNumber,
						lastConnectedAt: stored.updatedAt,
					}
				: null,
		};
	}),
);

app.post(
	'/api/disconnect',
	requireAuth,
	handle(async (req) => {
		const adminId = requireAdminId(req);
		await clientManager.disconnect(adminId);
		sessionStore.remove(adminId);
		return { ok: true };
	}),
);

app.post(
	'/api/send',
	requireAuth,
	upload.single('file'),
	handle(async (req) => {
		const adminId = requireAdminId(req);
		const kind = String(req.body?.kind ?? '').toLowerCase() as 'text' | 'photo' | 'voice';
		const target = String(req.body?.target ?? '').trim();
		const caption = String(req.body?.caption ?? '');
		if (target.length === 0) {
			throw badRequest('target is required');
		}
		if (kind === 'text') {
			await sendMessage(adminId, target, 'text', {
				text: String(req.body?.text ?? ''),
			});
			return { ok: true };
		}
		if ((kind === 'photo' || kind === 'voice') && req.file) {
			await sendMessage(adminId, target, kind, {
				text: caption,
				media: {
					buffer: req.file.buffer,
					originalname: req.file.originalname,
				},
			});
			return { ok: true };
		}
		throw badRequest('kind must be text, photo or voice with file');
	}),
);

app.get(
	'/api/me',
	requireAuth,
	handle(async (req) => {
		const adminId = requireAdminId(req);
		const account = await getAccountInfo(adminId);
		const stored = sessionStore.get(adminId);
		return {
			adminId,
			...account,
			storedTelegramUserId: stored?.telegramUserId,
		};
	}),
);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
	if (err instanceof ApiError) {
		res.status(err.status).json({ error: err.code, message: err.message });
		return;
	}
	res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
});

app.listen(config.port, () => {
	console.log(`telegram-user-service listening on :${config.port}`);
});