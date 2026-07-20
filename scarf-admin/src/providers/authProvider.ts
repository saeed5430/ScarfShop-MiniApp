import type { AuthProvider } from "@refinedev/core";

const API_URL = "https://scarf-mini-app.abdollahi003.workers.dev";

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const response = await fetch(`${API_URL}/api/admin-auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: {
            message: data.error || "ایمیل یا رمز عبور اشتباه است",
            statusCode: response.status,
          },
        };
      }

      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_user", JSON.stringify(data.admin));
      localStorage.setItem("admin_token_expires", String(Date.now() + data.expires_in * 1000));

      return { success: true, redirectTo: "/categories" };
    } catch (error) {
      return {
        success: false,
        error: {
          message: "خطا در اتصال به سرور",
          statusCode: 500,
        },
      };
    }
  },

  logout: async () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    localStorage.removeItem("admin_token_expires");
    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    const token = localStorage.getItem("admin_token");
    const expires = localStorage.getItem("admin_token_expires");

    if (!token) {
      return { authenticated: false, logout: true };
    }

    // Check if token is expired
    if (expires && Date.now() > Number(expires)) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      localStorage.removeItem("admin_token_expires");
      return { authenticated: false, logout: true };
    }

    // Verify token with server
    try {
      const response = await fetch(`${API_URL}/api/admin-auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      if (!data.valid) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        localStorage.removeItem("admin_token_expires");
        return { authenticated: false, logout: true };
      }
    } catch {
      // If server is unreachable, allow based on local expiry
    }

    return { authenticated: true };
  },

  getIdentity: async () => {
    const userStr = localStorage.getItem("admin_user");
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getPermissions: async () => {
    return ["admin"];
  },

  onError: async (error) => {
    if (error.status === 401) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      localStorage.removeItem("admin_token_expires");
      return { logout: true, redirectTo: "/login" };
    }
    return {};
  },
};
