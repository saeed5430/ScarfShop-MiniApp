import { TelegramClient } from 'telegram';

import { clientManager } from './clientManager.js';
import { badRequest, extractRpcError } from './errors.js';

export type SendKind = 'text' | 'photo' | 'voice';
export interface SendMediaBuffer {
	buffer: Buffer;
	originalname: string;
}

function withName(buffer: Buffer, name: string): Buffer {
	const b = buffer as Buffer & { name: string };
	b.name = name;
	return b;
}

async function send(client: TelegramClient, target: string, message: string): Promise<void> {
	try {
		await client.sendMessage(target, { message, parseMode: 'html' });
	} catch (err) {
		throw badRequest(extractRpcError(err), 'SEND_FAILED');
	}
}

async function sendMedia(
	client: TelegramClient,
	target: string,
	buffer: Buffer,
	fileName: string,
	caption: string,
	voiceNote: boolean,
): Promise<void> {
	try {
		await client.sendFile(target, {
			file: withName(buffer, fileName),
			caption,
			voiceNote,
		});
	} catch (err) {
		throw badRequest(extractRpcError(err), 'SEND_FAILED');
	}
}

const queues = new Map<number, Promise<unknown>>();

function enqueue<T>(adminId: number, task: () => Promise<T>): Promise<T> {
	const previous = queues.get(adminId) ?? Promise.resolve();
	const next = previous.then(task, task);
	queues.set(adminId, next.catch(() => undefined));
	return next;
}

export function sendMessage(adminId: number, target: string, kind: SendKind, payload: {
	text?: string;
	media?: SendMediaBuffer;
}): Promise<void> {
	return enqueue(adminId, async () => {
		const client = await clientManager.ensureConnected(adminId);
		if (kind === 'text') {
			if (!payload.text) {
				throw badRequest('text is required for kind=text', 'INVALID_PAYLOAD');
			}
			await send(client, target, payload.text);
			return;
		}
		if (!payload.media) {
			throw badRequest('media file is required', 'INVALID_PAYLOAD');
		}
		const fileName = kind === 'voice' ? 'voice.ogg' : payload.media.originalname;
		await sendMedia(client, target, payload.media.buffer, fileName, payload.text ?? '', kind === 'voice');
	});
}

export async function getAccountInfo(adminId: number): Promise<{
	phone: string;
	username?: string;
	telegramUserId?: string;
}> {
	const client = await clientManager.ensureConnected(adminId);
	try {
		const me = await client.getMe();
		return {
			phone: me.phone ?? '',
			username: me.username,
			telegramUserId: String(me.id),
		};
	} catch (err) {
		throw badRequest(extractRpcError(err), 'GET_ME_FAILED');
	}
}