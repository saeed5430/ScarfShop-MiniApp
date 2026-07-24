// Password hashing utilities using Web Crypto API
// Compatible with Cloudflare Workers

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const SALT_LENGTH = 32;

// Generate a random salt
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  return Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Hash password with salt using PBKDF2
export async function hashPassword(password: string, salt?: string): Promise<string> {
  const saltBytes = salt
    ? Uint8Array.from(salt.match(/.{2}/g)!.map(h => parseInt(h, 16)))
    : crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: ITERATIONS,
      hash: 'SHA-512',
    },
    keyMaterial,
    KEY_LENGTH * 8
  );

  const hashArray = Array.from(new Uint8Array(hash));
  const saltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Format: $pbkdf2$iterations$salt$hash
  return `$pbkdf2$${ITERATIONS}$${saltHex}$${hashHex}`;
}

// Verify password against stored hash
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 5 || parts[1] !== 'pbkdf2') {
      return false;
    }

    const iterations = parseInt(parts[2]);
    const salt = parts[3];
    const hash = parts[4];

    const newHash = await hashPassword(password, salt);
    const newHashParts = newHash.split('$');

    // Constant-time comparison to prevent timing attacks
    if (hash.length !== newHashParts[4].length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < hash.length; i++) {
      result |= hash.charCodeAt(i) ^ newHashParts[4].charCodeAt(i);
    }

    return result === 0;
  } catch {
    return false;
  }
}

// Check if password needs rehashing (e.g., if stored as plain text)
export function needsRehash(storedHash: string): boolean {
  return !storedHash.startsWith('$pbkdf2$');
}
