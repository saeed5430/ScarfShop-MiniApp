import * as path from 'node:path';

function required(name: string): string {
	const value = process.env[name];
	if (!value || value.trim() === '') {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value.trim();
}

function requiredInt(name: string): number {
	const parsed = Number.parseInt(required(name), 10);
	if (!Number.isFinite(parsed)) {
		throw new Error(`Environment variable ${name} must be an integer`);
	}
	return parsed;
}

function optional(name: string, fallback: string): string {
	const value = process.env[name];
	return value === undefined || value.trim() === '' ? fallback : value.trim();
}

function optionalInt(name: string, fallback: number): number {
	const value = process.env[name];
	if (value === undefined || value.trim() === '') {
		return fallback;
	}
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function parseAdminIds(value: string): number[] {
	if (value.trim() === '') {
		return [];
	}
	return value
		.split(',')
		.map((part) => Number.parseInt(part.trim(), 10))
		.filter((id) => Number.isFinite(id));
}

const sessionKeyHex = required('SESSION_ENCRYPTION_KEY');
if (sessionKeyHex.length !== 64) {
	throw new Error('SESSION_ENCRYPTION_KEY must be 32 bytes encoded as 64 hex characters');
}

export const config = {
	port: optionalInt('PORT', 8787),
	apiId: requiredInt('TELEGRAM_API_ID'),
	apiHash: required('TELEGRAM_API_HASH'),
	serviceToken: required('SERVICE_TOKEN'),
	adminIds: parseAdminIds(optional('ADMIN_IDS', '')),
	sessionEncryptionKey: Buffer.from(sessionKeyHex, 'hex'),
	sessionDir: path.resolve(optional('SESSION_DIR', path.join(process.cwd(), 'sessions'))),
	maxUploadBytes: optionalInt('MAX_UPLOAD_BYTES', 10 * 1024 * 1024),
};

export type AppConfig = typeof config;