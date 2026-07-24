export const TOKEN_EXPIRY = 60 * 30; // 30 minutes

export function getJwtSecret(env: { JWT_SECRET?: string }): string {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return env.JWT_SECRET;
}
