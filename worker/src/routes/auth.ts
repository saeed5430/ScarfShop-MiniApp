import { Hono } from "hono";
import { createAuth } from "../auth/index";

type Bindings = {
  DB: D1Database;
};

export const authRoutes = new Hono<{ Bindings: Bindings }>();

// Initialize auth tables
authRoutes.post("/init", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not configured" }, 500);

  try {
    const auth = createAuth(db);
    await auth.adapter.init();
    return c.json({ success: true, message: "Auth tables initialized" });
  } catch (error) {
    return c.json({ error: "Failed to initialize auth tables" }, 500);
  }
});

// Sign up (simplified)
authRoutes.post("/signup", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not configured" }, 500);

  const body = await c.req.json<{ email: string; password: string; name: string }>();
  const { email, password, name } = body;

  if (!email || !password || !name) {
    return c.json({ error: "ایمیل، رمز عبور و نام الزامی هستند" }, 400);
  }

  try {
    const auth = createAuth(db);
    const user = await auth.adapter.createUser({
      id: crypto.randomUUID(),
      email,
      name,
      emailVerified: false,
    });

    return c.json({ success: true, user });
  } catch (error: any) {
    return c.json({ error: error.message || "خطا در ثبت نام" }, 400);
  }
});

// Sign in (simplified)
authRoutes.post("/signin", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not configured" }, 500);

  const body = await c.req.json<{ email: string; password: string }>();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ error: "ایمیل و رمز عبور الزامی هستند" }, 400);
  }

  try {
    const auth = createAuth(db);
    const user = await auth.adapter.getUserByEmail(email);

    if (!user) {
      return c.json({ error: "ایمیل یا رمز عبور اشتباه است" }, 401);
    }

    // For now, accept any password for demo
    // In production, use proper password hashing
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await auth.adapter.createSession({
      id: crypto.randomUUID(),
      userId: user.id,
      token,
      expiresAt,
    });

    return c.json({
      success: true,
      token,
      user,
    });
  } catch (error: any) {
    return c.json({ error: error.message || "ایمیل یا رمز عبور اشتباه است" }, 401);
  }
});

// Get current session
authRoutes.get("/session", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not configured" }, 500);

  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return c.json({ error: "Token required" }, 401);

  try {
    const auth = createAuth(db);
    const session = await auth.adapter.getSession(token);

    if (!session) {
      return c.json({ error: "Invalid session" }, 401);
    }

    const user = await auth.adapter.getUser(session.userId);
    if (!user) {
      return c.json({ error: "User not found" }, 401);
    }

    return c.json({ session, user });
  } catch (error: any) {
    return c.json({ error: error.message || "Invalid session" }, 401);
  }
});

// Sign out
authRoutes.post("/signout", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "Database not configured" }, 500);

  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return c.json({ success: true });

  try {
    const auth = createAuth(db);
    await auth.adapter.deleteSession(token);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message || "خطا در خروج" }, 500);
  }
});
