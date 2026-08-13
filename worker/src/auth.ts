import type { D1Database } from '@cloudflare/workers-types';
import { Database } from './db';

export interface BaleInitData {
  query_id: string;
  user?: {
    id: number;
    is_bot?: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    photo_url?: string;
  };
  auth_date: number;
  hash: string;
  start_param?: string;
  can_send_messages?: boolean;
  chat_type?: string;
  chat_instance?: string;
}

export function parseInitData(initData: string): Record<string, string> {
  const params = new URLSearchParams(initData);
  const result: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    result[key] = value;
  }

  return result;
}

export function extractUserFromInitData(initData: string): BaleInitData['user'] | null {
  const params = parseInitData(initData);
  const userJson = params['user'];

  if (!userJson) {
    return null;
  }

  try {
    return JSON.parse(userJson) as BaleInitData['user'];
  } catch {
    return null;
  }
}

export async function verifyBaleInitData(
  initData: string,
  botToken: string
): Promise<boolean> {
  try {
    const params = parseInitData(initData);
    const hash = params['hash'];

    if (!hash) {
      return false;
    }

    const authDate = parseInt(params['auth_date'] || '0', 10);
    const now = Math.floor(Date.now() / 1000);

    if (now - authDate > 86400) {
      return false;
    }

    const dataCheckArr: string[] = [];
    for (const [key, value] of Object.entries(params)) {
      if (key !== 'hash') {
        dataCheckArr.push(`${key}=${value}`);
      }
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

    const secretKey = await crypto.subtle.sign(
      'HMAC',
      secretKeyRaw,
      encoder.encode(botToken)
    );

    const hmacKey = await crypto.subtle.importKey(
      'raw',
      secretKey,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const computedHash = await crypto.subtle.sign(
      'HMAC',
      hmacKey,
      encoder.encode(dataCheckString)
    );

    const computedHashHex = Array.from(new Uint8Array(computedHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return computedHashHex === hash;
  } catch {
    return false;
  }
}

export async function authenticateCustomer(
  db: D1Database,
  initData: string,
  botToken: string
): Promise<{
  success: boolean;
  customer_id?: string;
  session_token?: string;
  error?: string;
}> {
  const database = new Database(db);

  const isValid = await verifyBaleInitData(initData, botToken);

  if (!isValid) {
    return { success: false, error: 'Invalid init data' };
  }

  const baleUser = extractUserFromInitData(initData);

  if (!baleUser) {
    return { success: false, error: 'User data not found' };
  }

  const customerId = String(baleUser.id);

  await database.customers.updateTelegramFields({
    id: customerId,
    first_name: baleUser.first_name,
    last_name: baleUser.last_name,
    username: baleUser.username,
    language_code: baleUser.language_code,
    photo_url: baleUser.photo_url,
    is_premium: baleUser.is_premium,
  });

  const existingSession = await database.sessions.findValidByCustomerId(customerId);

  if (existingSession) {
    await database.sessions.extend(existingSession.session_id);
    return {
      success: true,
      customer_id: customerId,
      session_token: existingSession.token,
    };
  }

  const session = await database.sessions.create(customerId);

  return {
    success: true,
    customer_id: customerId,
    session_token: session.token,
  };
}

export async function validateSession(
  db: D1Database,
  token: string
): Promise<{
  valid: boolean;
  customer_id?: string;
  error?: string;
}> {
  const database = new Database(db);

  const session = await database.sessions.findValidByToken(token);

  if (!session) {
    return { valid: false, error: 'Invalid or expired session' };
  }

  await database.customers.updateLastActive(session.customer_id);

  return {
    valid: true,
    customer_id: session.customer_id,
  };
}