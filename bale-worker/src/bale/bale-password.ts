const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const SALT_LENGTH = 32;

export async function hashBalePassword(password: string, salt?: string): Promise<string> {
  const saltBytes = salt
    ? Uint8Array.from(salt.match(/.{2}/g)!.map((h) => parseInt(h, 16)))
    : crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);

  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: ITERATIONS, hash: 'SHA-512' },
    keyMaterial,
    KEY_LENGTH * 8
  );

  const saltHex = Array.from(saltBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');

  return `$pbkdf2$${ITERATIONS}$${saltHex}$${hashHex}`;
}

export async function verifyBalePassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 5 || parts[1] !== 'pbkdf2') return false;
    const salt = parts[3];
    const hash = parts[4];
    const newHash = await hashBalePassword(password, salt);
    const newHashValue = newHash.split('$')[4];
    if (hash.length !== newHashValue.length) return false;
    let result = 0;
    for (let i = 0; i < hash.length; i++) {
      result |= hash.charCodeAt(i) ^ newHashValue.charCodeAt(i);
    }
    return result === 0;
  } catch {
    return false;
  }
}

export function needsBaleRehash(storedHash: string): boolean {
  return !storedHash.startsWith('$pbkdf2$');
}
