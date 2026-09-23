import { Api, password as passwordUtils, TelegramClient } from 'telegram';
import type { StringSession } from 'telegram/sessions/StringSession.js';

import { clientManager } from './clientManager.js';
import { config } from './config.js';
import { sessionStore } from './store.js';
import { badRequest, extractRpcError } from './errors.js';

const apiCredentials = { apiId: config.apiId, apiHash: config.apiHash };

export interface ConnectedUser {
	id: string;
	username?: string;
	phone: string;
}

export async function startLogin(adminId: number, phoneNumber: string): Promise<{ isCodeViaApp: boolean }> {
	const client = clientManager.getClient(adminId);
	await client.connect();
	const result = await client.sendCode(apiCredentials, phoneNumber);
	clientManager.setPendingLogin(adminId, {
		phoneNumber,
		phoneCodeHash: result.phoneCodeHash,
		isCodeViaApp: result.isCodeViaApp,
		createdAt: Date.now(),
	});
	return { isCodeViaApp: result.isCodeViaApp };
}

export async function submitCode(adminId: number, code: string): Promise<{ needPassword: true } | { user: ConnectedUser }> {
	const pending = clientManager.getPendingLogin(adminId);
	const client = clientManager.getClient(adminId);
	await client.connect();
	try {
		await client.invoke(
			new Api.auth.SignIn({
				phoneNumber: pending.phoneNumber,
				phoneCodeHash: pending.phoneCodeHash,
				phoneCode: code,
			}),
		);
	} catch (err) {
		if (extractRpcError(err) === 'SESSION_PASSWORD_NEEDED') {
			return { needPassword: true };
		}
		throw badRequest(extractRpcError(err), 'CODE_INVALID');
	}
	return { user: await finalizeLogin(adminId, client, pending.phoneNumber) };
}

export async function submitPassword(adminId: number, password: string): Promise<{ user: ConnectedUser }> {
	const pending = clientManager.getPendingLogin(adminId);
	const client = clientManager.getClient(adminId);
	await client.connect();
	try {
		const passwordSrpResult = await client.invoke(new Api.account.GetPassword());
		const passwordSrpCheck = await passwordUtils.computeCheck(passwordSrpResult, password);
		await client.invoke(new Api.auth.CheckPassword({ password: passwordSrpCheck }));
	} catch (err) {
		throw badRequest(extractRpcError(err), 'PASSWORD_INVALID');
	}
	return { user: await finalizeLogin(adminId, client, pending.phoneNumber) };
}

async function finalizeLogin(adminId: number, client: TelegramClient, phoneNumber: string): Promise<ConnectedUser> {
	const me = await client.getMe();
	const sessionString = (client.session as StringSession).save();
	sessionStore.set(adminId, {
		session: sessionString,
		phoneNumber,
		telegramUserId: String(me.id),
		username: me.username,
		updatedAt: new Date().toISOString(),
	});
	clientManager.markStatus(adminId, 'connected');
	clientManager.removePendingLogin(adminId);
	return {
		id: String(me.id),
		username: me.username,
		phone: me.phone ?? phoneNumber,
	};
}

export async function cancelLogin(adminId: number): Promise<void> {
	clientManager.removePendingLogin(adminId);
}