import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { config } from './config.js';

export interface StoredSession {
	session: string;
	phoneNumber: string;
	telegramUserId?: string;
	username?: string;
	updatedAt: string;
}

interface StoreFile {
	[key: string]: StoredSession;
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function encrypt(plaintext: string): string {
	const iv = crypto.randomBytes(IV_LENGTH);
	const cipher = crypto.createCipheriv(ALGORITHM, config.sessionEncryptionKey, iv);
	const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
	const tag = cipher.getAuthTag();
	return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(payload: string): string {
	const buffer = Buffer.from(payload, 'base64');
	if (buffer.length < IV_LENGTH + TAG_LENGTH) {
		throw new Error('Stored session payload is corrupted');
	}
	const iv = buffer.subarray(0, IV_LENGTH);
	const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
	const encrypted = buffer.subarray(IV_LENGTH + TAG_LENGTH);
	const decipher = crypto.createDecipheriv(ALGORITHM, config.sessionEncryptionKey, iv);
	decipher.setAuthTag(tag);
	return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

class SessionStore {
	private readonly filePath: string;
	private cache: StoreFile;

	constructor() {
		this.filePath = path.join(config.sessionDir, 'sessions.json');
		this.cache = {};
		this.load();
	}

	private load(): void {
		try {
			const raw = fs.readFileSync(this.filePath, 'utf8');
			this.cache = JSON.parse(raw) as StoreFile;
		} catch (err) {
			this.cache = {};
			if (err instanceof Error && (err as NodeJS.ErrnoException).code === 'ENOENT') {
				this.persist();
			}
		}
	}

	private persist(): void {
		fs.mkdirSync(config.sessionDir, { recursive: true });
		fs.writeFileSync(this.filePath, JSON.stringify(this.cache, null, 2), { mode: 0o600 });
	}

	has(adminId: number): boolean {
		return Object.prototype.hasOwnProperty.call(this.cache, String(adminId));
	}

	get(adminId: number): StoredSession | undefined {
		const entry = this.cache[String(adminId)];
		if (!entry) {
			return undefined;
		}
		return { ...entry, session: decrypt(entry.session) };
	}

	set(adminId: number, session: StoredSession): void {
		this.cache[String(adminId)] = {
			...session,
			session: encrypt(session.session),
		};
		this.persist();
	}

	remove(adminId: number): void {
		delete this.cache[String(adminId)];
		this.persist();
	}
}

export const sessionStore = new SessionStore();