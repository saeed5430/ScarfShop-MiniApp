import type { D1Database } from "@cloudflare/workers-types";

interface AdapterUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AdapterSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AdapterAccount {
  id: string;
  userId: string;
  accountId: string;
  providerId: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  scope?: string;
  idToken?: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AdapterVerification {
  id: string;
  identifier: string;
  value: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class D1Adapter {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async createTable(tableName: string, fields: Record<string, string>) {
    const fieldDefs = Object.entries(fields)
      .map(([name, type]) => `${name} ${type}`)
      .join(", ");
    
    await this.db.prepare(`CREATE TABLE IF NOT EXISTS ${tableName} (${fieldDefs})`).run();
  }

  async init() {
    await this.createTable("better_user", {
      id: "TEXT PRIMARY KEY",
      email: "TEXT UNIQUE NOT NULL",
      emailVerified: "INTEGER DEFAULT 0",
      name: "TEXT NOT NULL",
      image: "TEXT",
      createdAt: "INTEGER DEFAULT (unixepoch())",
      updatedAt: "INTEGER DEFAULT (unixepoch())",
    });

    await this.createTable("better_session", {
      id: "TEXT PRIMARY KEY",
      userId: "TEXT NOT NULL",
      token: "TEXT UNIQUE NOT NULL",
      expiresAt: "INTEGER NOT NULL",
      ipAddress: "TEXT",
      userAgent: "TEXT",
      createdAt: "INTEGER DEFAULT (unixepoch())",
      updatedAt: "INTEGER DEFAULT (unixepoch())",
    });

    await this.createTable("better_account", {
      id: "TEXT PRIMARY KEY",
      userId: "TEXT NOT NULL",
      accountId: "TEXT NOT NULL",
      providerId: "TEXT NOT NULL",
      accessToken: "TEXT",
      refreshToken: "TEXT",
      accessTokenExpiresAt: "INTEGER",
      refreshTokenExpiresAt: "INTEGER",
      scope: "TEXT",
      idToken: "TEXT",
      password: "TEXT",
      createdAt: "INTEGER DEFAULT (unixepoch())",
      updatedAt: "INTEGER DEFAULT (unixepoch())",
    });

    await this.createTable("better_verification", {
      id: "TEXT PRIMARY KEY",
      identifier: "TEXT NOT NULL",
      value: "TEXT NOT NULL",
      expiresAt: "INTEGER NOT NULL",
      createdAt: "INTEGER DEFAULT (unixepoch())",
      updatedAt: "INTEGER DEFAULT (unixepoch())",
    });
  }

  // User methods
  async createUser(data: Omit<AdapterUser, "createdAt" | "updatedAt">): Promise<AdapterUser> {
    const now = Math.floor(Date.now() / 1000);
    await this.db.prepare(`
      INSERT INTO better_user (id, email, emailVerified, name, image, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(data.id, data.email, data.emailVerified ? 1 : 0, data.name, data.image || null, now, now).run();

    return this.getUser(data.id) as Promise<AdapterUser>;
  }

  async getUser(id: string): Promise<AdapterUser | null> {
    const row = await this.db.prepare("SELECT * FROM better_user WHERE id = ?").bind(id).first();
    return row ? this.parseUser(row) : null;
  }

  async getUserByEmail(email: string): Promise<AdapterUser | null> {
    const row = await this.db.prepare("SELECT * FROM better_user WHERE email = ?").bind(email).first();
    return row ? this.parseUser(row) : null;
  }

  async updateUser(id: string, data: Partial<AdapterUser>): Promise<AdapterUser> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.email !== undefined) { fields.push("email = ?"); values.push(data.email); }
    if (data.emailVerified !== undefined) { fields.push("emailVerified = ?"); values.push(data.emailVerified ? 1 : 0); }
    if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
    if (data.image !== undefined) { fields.push("image = ?"); values.push(data.image); }

    if (fields.length > 0) {
      fields.push("updatedAt = ?");
      values.push(Math.floor(Date.now() / 1000));
      values.push(id);
      await this.db.prepare(`UPDATE better_user SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
    }

    return this.getUser(id) as Promise<AdapterUser>;
  }

  async deleteUser(id: string): Promise<void> {
    await this.db.prepare("DELETE FROM better_user WHERE id = ?").bind(id).run();
  }

  // Session methods
  async createSession(data: Omit<AdapterSession, "createdAt" | "updatedAt">): Promise<AdapterSession> {
    const now = Math.floor(Date.now() / 1000);
    await this.db.prepare(`
      INSERT INTO better_session (id, userId, token, expiresAt, ipAddress, userAgent, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(data.id, data.userId, data.token, Math.floor(data.expiresAt.getTime() / 1000), data.ipAddress || null, data.userAgent || null, now, now).run();

    return this.getSession(data.token) as Promise<AdapterSession>;
  }

  async getSession(token: string): Promise<AdapterSession | null> {
    const row = await this.db.prepare("SELECT * FROM better_session WHERE token = ?").bind(token).first();
    return row ? this.parseSession(row) : null;
  }

  async getSessionByUserId(userId: string): Promise<AdapterSession | null> {
    const row = await this.db.prepare("SELECT * FROM better_session WHERE userId = ? ORDER BY createdAt DESC LIMIT 1").bind(userId).first();
    return row ? this.parseSession(row) : null;
  }

  async updateSession(token: string, data: Partial<AdapterSession>): Promise<AdapterSession> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.expiresAt !== undefined) { fields.push("expiresAt = ?"); values.push(Math.floor(data.expiresAt.getTime() / 1000)); }
    if (data.ipAddress !== undefined) { fields.push("ipAddress = ?"); values.push(data.ipAddress); }
    if (data.userAgent !== undefined) { fields.push("userAgent = ?"); values.push(data.userAgent); }

    if (fields.length > 0) {
      fields.push("updatedAt = ?");
      values.push(Math.floor(Date.now() / 1000));
      values.push(token);
      await this.db.prepare(`UPDATE better_session SET ${fields.join(", ")} WHERE token = ?`).bind(...values).run();
    }

    return this.getSession(token) as Promise<AdapterSession>;
  }

  async deleteSession(token: string): Promise<void> {
    await this.db.prepare("DELETE FROM better_session WHERE token = ?").bind(token).run();
  }

  async deleteSessionsByUserId(userId: string): Promise<void> {
    await this.db.prepare("DELETE FROM better_session WHERE userId = ?").bind(userId).run();
  }

  // Account methods
  async createAccount(data: Omit<AdapterAccount, "createdAt" | "updatedAt">): Promise<AdapterAccount> {
    const now = Math.floor(Date.now() / 1000);
    await this.db.prepare(`
      INSERT INTO better_account (id, userId, accountId, providerId, accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt, scope, idToken, password, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.id, data.userId, data.accountId, data.providerId,
      data.accessToken || null, data.refreshToken || null,
      data.accessTokenExpiresAt ? Math.floor(data.accessTokenExpiresAt.getTime() / 1000) : null,
      data.refreshTokenExpiresAt ? Math.floor(data.refreshTokenExpiresAt.getTime() / 1000) : null,
      data.scope || null, data.idToken || null, data.password || null,
      now, now
    ).run();

    return this.getAccount(data.id) as Promise<AdapterAccount>;
  }

  async getAccount(id: string): Promise<AdapterAccount | null> {
    const row = await this.db.prepare("SELECT * FROM better_account WHERE id = ?").bind(id).first();
    return row ? this.parseAccount(row) : null;
  }

  async getAccountByUserId(userId: string, providerId: string): Promise<AdapterAccount | null> {
    const row = await this.db.prepare("SELECT * FROM better_account WHERE userId = ? AND providerId = ?").bind(userId, providerId).first();
    return row ? this.parseAccount(row) : null;
  }

  async updateAccount(id: string, data: Partial<AdapterAccount>): Promise<AdapterAccount> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.accessToken !== undefined) { fields.push("accessToken = ?"); values.push(data.accessToken); }
    if (data.refreshToken !== undefined) { fields.push("refreshToken = ?"); values.push(data.refreshToken); }
    if (data.accessTokenExpiresAt !== undefined) { fields.push("accessTokenExpiresAt = ?"); values.push(Math.floor(data.accessTokenExpiresAt.getTime() / 1000)); }
    if (data.refreshTokenExpiresAt !== undefined) { fields.push("refreshTokenExpiresAt = ?"); values.push(Math.floor(data.refreshTokenExpiresAt.getTime() / 1000)); }
    if (data.scope !== undefined) { fields.push("scope = ?"); values.push(data.scope); }
    if (data.idToken !== undefined) { fields.push("idToken = ?"); values.push(data.idToken); }
    if (data.password !== undefined) { fields.push("password = ?"); values.push(data.password); }

    if (fields.length > 0) {
      fields.push("updatedAt = ?");
      values.push(Math.floor(Date.now() / 1000));
      values.push(id);
      await this.db.prepare(`UPDATE better_account SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
    }

    return this.getAccount(id) as Promise<AdapterAccount>;
  }

  async deleteAccount(id: string): Promise<void> {
    await this.db.prepare("DELETE FROM better_account WHERE id = ?").bind(id).run();
  }

  // Verification methods
  async createVerification(data: Omit<AdapterVerification, "createdAt" | "updatedAt">): Promise<AdapterVerification> {
    const now = Math.floor(Date.now() / 1000);
    await this.db.prepare(`
      INSERT INTO better_verification (id, identifier, value, expiresAt, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(data.id, data.identifier, data.value, Math.floor(data.expiresAt.getTime() / 1000), now, now).run();

    return this.getVerification(data.identifier, data.value) as Promise<AdapterVerification>;
  }

  async getVerification(identifier: string, value: string): Promise<AdapterVerification | null> {
    const row = await this.db.prepare("SELECT * FROM better_verification WHERE identifier = ? AND value = ?").bind(identifier, value).first();
    return row ? this.parseVerification(row) : null;
  }

  async deleteVerification(identifier: string, value: string): Promise<void> {
    await this.db.prepare("DELETE FROM better_verification WHERE identifier = ? AND value = ?").bind(identifier, value).run();
  }

  async deleteExpiredVerifications(): Promise<void> {
    await this.db.prepare("DELETE FROM better_verification WHERE expiresAt < ?").bind(Math.floor(Date.now() / 1000)).run();
  }

  // Parse methods
  private parseUser(row: Record<string, unknown>): AdapterUser {
    return {
      id: String(row.id),
      email: String(row.email),
      emailVerified: Boolean(row.emailVerified),
      name: String(row.name),
      image: row.image ? String(row.image) : undefined,
      createdAt: new Date(Number(row.createdAt) * 1000),
      updatedAt: new Date(Number(row.updatedAt) * 1000),
    };
  }

  private parseSession(row: Record<string, unknown>): AdapterSession {
    return {
      id: String(row.id),
      userId: String(row.userId),
      token: String(row.token),
      expiresAt: new Date(Number(row.expiresAt) * 1000),
      ipAddress: row.ipAddress ? String(row.ipAddress) : undefined,
      userAgent: row.userAgent ? String(row.userAgent) : undefined,
      createdAt: new Date(Number(row.createdAt) * 1000),
      updatedAt: new Date(Number(row.updatedAt) * 1000),
    };
  }

  private parseAccount(row: Record<string, unknown>): AdapterAccount {
    return {
      id: String(row.id),
      userId: String(row.userId),
      accountId: String(row.accountId),
      providerId: String(row.providerId),
      accessToken: row.accessToken ? String(row.accessToken) : undefined,
      refreshToken: row.refreshToken ? String(row.refreshToken) : undefined,
      accessTokenExpiresAt: row.accessTokenExpiresAt ? new Date(Number(row.accessTokenExpiresAt) * 1000) : undefined,
      refreshTokenExpiresAt: row.refreshTokenExpiresAt ? new Date(Number(row.refreshTokenExpiresAt) * 1000) : undefined,
      scope: row.scope ? String(row.scope) : undefined,
      idToken: row.idToken ? String(row.idToken) : undefined,
      password: row.password ? String(row.password) : undefined,
      createdAt: new Date(Number(row.createdAt) * 1000),
      updatedAt: new Date(Number(row.updatedAt) * 1000),
    };
  }

  private parseVerification(row: Record<string, unknown>): AdapterVerification {
    return {
      id: String(row.id),
      identifier: String(row.identifier),
      value: String(row.value),
      expiresAt: new Date(Number(row.expiresAt) * 1000),
      createdAt: new Date(Number(row.createdAt) * 1000),
      updatedAt: new Date(Number(row.updatedAt) * 1000),
    };
  }
}
