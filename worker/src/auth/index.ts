import { D1Adapter } from "./d1-adapter";

export function createAuth(db: D1Database) {
  const adapter = new D1Adapter(db);
  return { adapter };
}

export type Auth = ReturnType<typeof createAuth>;
