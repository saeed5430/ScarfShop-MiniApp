import { DataProvider } from "@refinedev/core";

const API_URL = "https://scarfminiappbale-api.abdollahi003.workers.dev";

const getToken = () => localStorage.getItem("admin_token");

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

const fetchJson = async (url: string, options?: RequestInit) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) ?? {}),
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new ApiError(error.error || `HTTP ${response.status}`, response.status);
  }

  return response.json();
};

const resourceMap: Record<string, { path: string; key: string }> = {
  categories: { path: "/api/bale-admin/categories", key: "categories" },
  products: { path: "/api/bale-admin/products", key: "items" },
  variants: { path: "/api/bale-admin/variants", key: "items" },
  colors: { path: "/api/bale-admin/colors", key: "items" },
  sizes: { path: "/api/bale-admin/sizes", key: "items" },
  designs: { path: "/api/bale-admin/designs", key: "items" },
  users: { path: "/api/bale-admin/users", key: "users" },
  orders: { path: "/api/bale-admin/orders", key: "orders" },
  admins: { path: "/api/bale-admin/admins", key: "admins" },
  settings: { path: "/api/bale-admin/settings", key: "settings" },
};

const singleKey: Record<string, string[]> = {
  categories: ["category"],
  products: ["product"],
  variants: ["variant"],
  colors: ["item"],
  sizes: ["item"],
  designs: ["item"],
  users: ["user"],
  orders: ["order"],
  admins: ["admin"],
  settings: ["setting"],
};

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters }) => {
    const config = resourceMap[resource];
    if (!config) throw new Error(`Unknown resource: ${resource}`);

    const params = new URLSearchParams();

    if (pagination) {
      const { current = 1, pageSize = 10 } = pagination;
      params.set("limit", String(pageSize));
      params.set("offset", String((current - 1) * pageSize));
    }

    if (filters) {
      for (const filter of filters) {
        if ("field" in filter && filter.operator === "eq") {
          params.set(filter.field, String(filter.value));
        }
      }
    }

    const qs = params.toString();
    const data = await fetchJson(`${API_URL}${config.path}${qs ? `?${qs}` : ""}`);

    let items: unknown[];
    if (config.key === "categories") {
      items = data.categories || [];
    } else if (config.key === "items") {
      items = data.items || [];
    } else if (config.key === "users") {
      items = data.users || [];
    } else if (config.key === "orders") {
      items = data.orders || [];
    } else if (config.key === "admins") {
      items = data.admins || [];
    } else {
      items = data[config.key] || data.items || [];
    }
    const total: number = data.total ?? items.length;

    return { data: items, total } as never;
  },

  getOne: async ({ resource, id }) => {
    const config = resourceMap[resource];
    if (!config) throw new Error(`Unknown resource: ${resource}`);

    const url = `${API_URL}${config.path}/${id}`;
    const data = await fetchJson(url);
    const keys = singleKey[resource] ?? [];
    for (const key of keys) {
      if (data[key] !== undefined) return { data: data[key] } as never;
    }
    return { data } as never;
  },

  create: async ({ resource, variables }) => {
    const config = resourceMap[resource];
    if (!config) throw new Error(`Unknown resource: ${resource}`);

    const data = await fetchJson(`${API_URL}${config.path}`, {
      method: "POST",
      body: JSON.stringify(variables),
    });

    const keys = singleKey[resource] ?? [];
    for (const key of keys) {
      if (data[key] !== undefined) return { data: data[key] } as never;
    }
    return { data } as never;
  },

  update: async ({ resource, id, variables }) => {
    const config = resourceMap[resource];
    if (!config) throw new Error(`Unknown resource: ${resource}`);

    const data = await fetchJson(`${API_URL}${config.path}/${id}`, {
      method: "PUT",
      body: JSON.stringify(variables),
    });

    const keys = singleKey[resource] ?? [];
    for (const key of keys) {
      if (data[key] !== undefined) return { data: data[key] } as never;
    }
    return { data } as never;
  },

  deleteOne: async ({ resource, id }) => {
    const config = resourceMap[resource];
    if (!config) throw new Error(`Unknown resource: ${resource}`);

    await fetchJson(`${API_URL}${config.path}/${id}`, { method: "DELETE" });

    return { data: { id } } as never;
  },

  getApiUrl: () => API_URL,

  custom: async ({ url, method, payload, query, headers }) => {
    const params = new URLSearchParams();
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        params.set(key, String(value));
      }
    }
    const qs = params.toString();
    const data = await fetchJson(`${url}${qs ? `?${qs}` : ""}`, {
      method: method || "GET",
      body: payload ? JSON.stringify(payload) : undefined,
      headers,
    });
    return { data };
  },
};
