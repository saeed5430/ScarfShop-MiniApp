import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/StringSession.js';

import { config } from './config.js';
import { sessionStore } from './store.js';
import { conflict, extractRpcError, unauthorized } from './errors.js';

export type ConnectionStatus = 'not_connected' | 'connected' | 'error' | 'revoked';

export interface PendingLogin {
	phoneNumber: string;
	phoneCodeHash: string;
	isCodeViaApp: boolean;
	createdAt: number;
}

export interface LiveState {
	status: ConnectionStatus;
	lastError: string;
	lastUsedAt: number;
}

interface LiveClient extends LiveState {
	client: TelegramClient;
}

export function authenticateAdmin(adminId: number): void {
	if (config.adminIds.length === 0) {
		return;
	}
	if (!config.adminIds.includes(adminId)) {
		throw unauthorized('Admin is not allowed');
	}
}

class ClientManager {
	private readonly live = new Map<number, LiveClient>();
	private readonly pendingLogins = new Map<number, PendingLogin>();

	private getOrCreate(adminId: number): LiveClient {
		let entry = this.live.get(adminId);
		if (!entry) {
			const stored = sessionStore.get(adminId);
			const client = new TelegramClient(
				new StringSession(stored?.session ?? ''),
				config.apiId,
				config.apiHash,
				{
					connectionRetries: 3,
					requestRetries: 3,
					floodSleepThreshold: 60,
					autoReconnect: true,
					deviceModel: 'ScarfMiniApp',
					appVersion: '1.0.0',
					langCode: 'en',
				},
			);
			entry = {
				client,
				status: 'not_connected',
				lastError: '',
				lastUsedAt: Date.now(),
			};
			this.live.set(adminId, entry);
			void client.connect().catch((err: unknown) => {
				const liveEntry = this.live.get(adminId);
				if (liveEntry && liveEntry.client === client) {
					liveEntry.status = 'error';
					liveEntry.lastError = extractRpcError(err);
				}
			});
		}
		entry.lastUsedAt = Date.now();
		return entry;
	}

	getClient(adminId: number): TelegramClient {
		authenticateAdmin(adminId);
		return this.getOrCreate(adminId).client;
	}

	async ensureConnected(adminId: number): Promise<TelegramClient> {
		const entry = this.getOrCreate(adminId);
		await entry.client.connect();
		const authorized = await entry.client.checkAuthorization();
		if (!authorized) {
			this.markStatus(adminId, 'error', 'Session is not authorized');
			throw conflict('Session is not authorized. Reconnect the account.', 'SESSION_NOT_AUTHORIZED');
		}
		this.markStatus(adminId, 'connected');
		return entry.client;
	}

	stateOf(adminId: number): LiveState {
		const entry = this.live.get(adminId);
		if (entry) {
			return {
				status: entry.status,
				lastError: entry.lastError,
				lastUsedAt: entry.lastUsedAt,
			};
		}
		return {
			status: 'not_connected',
			lastError: '',
			lastUsedAt: 0,
		};
	}

	getPendingLogin(adminId: number): PendingLogin {
		const pending = this.pendingLogins.get(adminId);
		if (!pending) {
			throw conflict('No pending login. Start with /connect/start first.', 'NO_PENDING_LOGIN');
		}
		return pending;
	}

	setPendingLogin(adminId: number, pending: PendingLogin): void {
		this.pendingLogins.set(adminId, pending);
	}

	removePendingLogin(adminId: number): void {
		this.pendingLogins.delete(adminId);
	}

	markStatus(adminId: number, status: ConnectionStatus, lastError = ''): void {
		const entry = this.live.get(adminId);
		if (entry) {
			entry.status = status;
			entry.lastError = lastError;
		}
	}

	async disconnect(adminId: number): Promise<void> {
		const entry = this.live.get(adminId);
		if (entry) {
			try {
				await entry.client.disconnect();
			} catch {
				// Best-effort disconnect.
			}
			this.live.delete(adminId);
		}
		this.pendingLogins.delete(adminId);
	}
}

export const clientManager = new ClientManager();