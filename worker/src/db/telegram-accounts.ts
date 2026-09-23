import type { D1Database } from '@cloudflare/workers-types';
import type { AdminTelegramAccount, UpdateTelegramAccountInput } from './types';

export class TelegramAccountsDB {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  private parseRow(row: Record<string, unknown>): AdminTelegramAccount {
    return {
      admin_id: String(row.admin_id),
      username: row.username != null ? String(row.username) : null,
      telegram_user_id: row.telegram_user_id != null ? String(row.telegram_user_id) : null,
      telegram_phone_masked: row.telegram_phone_masked != null ? String(row.telegram_phone_masked) : null,
      status: String(row.status || 'not_connected') as AdminTelegramAccount['status'],
      personal_sending_enabled: Number(row.personal_sending_enabled) === 1,
      session_ref: row.session_ref != null ? String(row.session_ref) : null,
      last_connected_at: row.last_connected_at != null ? String(row.last_connected_at) : null,
      last_verified_at: row.last_verified_at != null ? String(row.last_verified_at) : null,
      last_error: row.last_error != null ? String(row.last_error) : null,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async get(adminId: string): Promise<AdminTelegramAccount | null> {
    const row = await this.db
      .prepare('SELECT * FROM admin_telegram_accounts WHERE admin_id = ?')
      .bind(adminId)
      .first();
    return row ? this.parseRow(row) : null;
  }

  async list(): Promise<AdminTelegramAccount[]> {
    const { results } = await this.db.prepare('SELECT * FROM admin_telegram_accounts ORDER BY admin_id').all();
    return results.map((row) => this.parseRow(row));
  }

  async upsert(adminId: string, input: UpdateTelegramAccountInput): Promise<AdminTelegramAccount> {
    const now = Math.floor(Date.now() / 1000);
    const existing = await this.get(adminId);
    const status = input.status ?? existing?.status ?? 'not_connected';
    const merged: UpdateTelegramAccountInput = {
      username: input.username ?? existing?.username ?? null,
      telegram_user_id: input.telegram_user_id ?? existing?.telegram_user_id ?? null,
      telegram_phone_masked: input.telegram_phone_masked ?? existing?.telegram_phone_masked ?? null,
      personal_sending_enabled:
        input.personal_sending_enabled ?? existing?.personal_sending_enabled ?? false,
      session_ref: input.session_ref ?? existing?.session_ref ?? null,
      last_connected_at: input.last_connected_at ?? existing?.last_connected_at ?? null,
      last_verified_at: input.last_verified_at ?? existing?.last_verified_at ?? null,
      last_error: input.last_error ?? existing?.last_error ?? null,
    };
    if (input.username === null) merged.username = null;
    if (input.telegram_user_id === null) merged.telegram_user_id = null;
    if (input.telegram_phone_masked === null) merged.telegram_phone_masked = null;
    if (input.session_ref === null) merged.session_ref = null;
    if (input.last_connected_at === null) merged.last_connected_at = null;
    if (input.last_verified_at === null) merged.last_verified_at = null;
    if (input.last_error === null) merged.last_error = null;

    await this.db
      .prepare(
        `INSERT INTO admin_telegram_accounts (
           admin_id, username, telegram_user_id, telegram_phone_masked, status,
           personal_sending_enabled, session_ref, last_connected_at, last_verified_at,
           last_error, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(admin_id) DO UPDATE SET
           username = excluded.username,
           telegram_user_id = excluded.telegram_user_id,
           telegram_phone_masked = excluded.telegram_phone_masked,
           status = excluded.status,
           personal_sending_enabled = excluded.personal_sending_enabled,
           session_ref = excluded.session_ref,
           last_connected_at = excluded.last_connected_at,
           last_verified_at = excluded.last_verified_at,
           last_error = excluded.last_error,
           updated_at = excluded.updated_at`,
      )
      .bind(
        adminId,
        merged.username,
        merged.telegram_user_id,
        merged.telegram_phone_masked,
        status,
        merged.personal_sending_enabled ? 1 : 0,
        merged.session_ref,
        merged.last_connected_at !== null ? Number(merged.last_connected_at) : null,
        merged.last_verified_at !== null ? Number(merged.last_verified_at) : null,
        merged.last_error,
        now,
        now,
      )
      .run();
    return (await this.get(adminId)) as AdminTelegramAccount;
  }

  async update(adminId: string, input: UpdateTelegramAccountInput): Promise<AdminTelegramAccount | null> {
    await this.upsert(adminId, input);
    return this.get(adminId);
  }

  async setEnabled(adminId: string, enabled: boolean): Promise<AdminTelegramAccount | null> {
    return this.update(adminId, { personal_sending_enabled: enabled });
  }

  async findSendingReady(): Promise<AdminTelegramAccount | null> {
    const row = await this.db
      .prepare(
        `SELECT * FROM admin_telegram_accounts
         WHERE personal_sending_enabled = 1 AND status = 'connected'
         ORDER BY last_verified_at DESC
         LIMIT 1`,
      )
      .first();
    return row ? this.parseRow(row) : null;
  }

  async remove(adminId: string): Promise<void> {
    await this.db.prepare('DELETE FROM admin_telegram_accounts WHERE admin_id = ?').bind(adminId).run();
  }
}