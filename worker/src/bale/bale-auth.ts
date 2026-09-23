import type { D1Database } from '@cloudflare/workers-types';
import { sign, verify } from 'hono/jwt';

export interface BaleInitUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  allows_write_to_pm?: boolean;
}

function parseInitData(initData: string): Record<string, string> {
  const params = new URLSearchParams(initData);
  const result: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
}

export function extractBaleUser(initData: string): BaleInitUser | null {
  const params = parseInitData(initData);
  const userJson = params['user'];
  if (!userJson) return null;
  try {
    return JSON.parse(userJson) as BaleInitUser;
  } catch {
    return null;
  }
}

export async function verifyBaleInitData(initData: string, botToken: string): Promise<boolean> {
  try {
    const params = parseInitData(initData);
    const hash = params['hash'];
    if (!hash) return false;
    const authDate = parseInt(params['auth_date'] || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) return false;
    const dataCheckArr: string[] = [];
    for (const [key, value] of Object.entries(params)) {
      if (key !== 'hash') dataCheckArr.push(`${key}=${value}`);
    }
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');
    const encoder = new TextEncoder();
    const secretKeyRaw = await crypto.subtle.importKey(
      'raw',
      encoder.encode('WebAppData'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const secretKey = await crypto.subtle.sign('HMAC', secretKeyRaw, encoder.encode(botToken));
    const hmacKey = await crypto.subtle.importKey('raw', secretKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const computedHash = await crypto.subtle.sign('HMAC', hmacKey, encoder.encode(dataCheckString));
    const computedHashHex = Array.from(new Uint8Array(computedHash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return computedHashHex === hash;
  } catch {
    return false;
  }
}

export async function authenticateBaleUser(
  db: D1Database,
  initData: string,
  botToken: string,
  jwtSecret: string
): Promise<{ success: boolean; user_id?: string; session_token?: string; error?: string }> {
  const isValid = await verifyBaleInitData(initData, botToken);
  if (!isValid) return { success: false, error: 'Invalid init data' };
  const baleUser = extractBaleUser(initData);
  if (!baleUser) return { success: false, error: 'User data not found' };
  const userId = String(baleUser.id);
  const existing = await db.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first<{ id: string }>();
  if (!existing) {
    await db.prepare(
      'INSERT INTO users (id, first_name, last_name, username, avatar_url) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      userId,
      baleUser.first_name,
      baleUser.last_name ?? null,
      baleUser.username ?? null,
      baleUser.photo_url ?? null
    ).run();
  } else {
    await db.prepare(
      'UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), username = COALESCE(?, username), avatar_url = COALESCE(?, avatar_url), last_active = unixepoch() WHERE id = ?'
    ).bind(
      baleUser.first_name ?? null,
      baleUser.last_name ?? null,
      baleUser.username ?? null,
      baleUser.photo_url ?? null,
      userId
    ).run();
  }
  const sessionToken = await sign(
    { type: 'bale', user_id: userId, exp: Math.floor(Date.now() / 1000) + 86400 },
    jwtSecret,
    'HS256'
  );
  return { success: true, user_id: userId, session_token: sessionToken };
}

export async function validateBaleSession(
  token: string,
  jwtSecret: string
): Promise<{ valid: boolean; user_id?: string; error?: string }> {
  try {
    const payload = await verify(token, jwtSecret, 'HS256') as { type?: string; user_id?: string };
    if (payload.type !== 'bale' || !payload.user_id) return { valid: false, error: 'Invalid session' };
    return { valid: true, user_id: payload.user_id };
  } catch {
    return { valid: false, error: 'Invalid or expired session' };
  }
}
