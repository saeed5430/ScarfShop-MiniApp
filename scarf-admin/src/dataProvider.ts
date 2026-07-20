import { DataProvider } from "@refinedev/core";

const API_URL = "https://scarf-mini-app.abdollahi003.workers.dev";

const getToken = () => localStorage.getItem("admin_token");

const fetchJson = async (url: string, options?: RequestInit) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
};

// Map resource name to API path and response key
const resourceMap: Record<string, { path: string; key: string }> = {
  categories: { path: "/api/categories", key: "categories" },
  products: { path: "/api/products", key: "items" },
  colors: { path: "/api/colors", key: "items" },
  sizes: { path: "/api/sizes", key: "items" },
  designs: { path: "/api/designs", key: "items" },
  users: { path: "/api/users", key: "users" },
  admins: { path: "/api/admins", key: "admins" },
  orders: { path: "/api/orders", key: "orders" },
  coupons: { path: "/api/coupons", key: "coupons" },
  settings: { path: "/api/settings", key: "settings" },
  chats: { path: "/api/chats", key: "messages" },
};

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters }) => {
    const config = resourceMap[resource];
    if (!config) throw new Error(`Unknown resource: ${resource}`);

    const params = new URLSearchParams();

    // Pagination
    if (pagination) {
      const { current = 1, pageSize = 10 } = pagination;
      params.set("limit", String(pageSize));
      params.set("offset", String((current - 1) * pageSize));
    }

    // Filters
    if (filters) {
      for (const filter of filters) {
        if ("field" in filter && filter.operator === "eq") {
          params.set(filter.field, String(filter.value));
        }
      }
    }

    const qs = params.toString();
    const data = await fetchJson(`${API_URL}${config.path}${qs ? `?${qs}` : ""}`);

    // Extract array and total from response
    let items: any[];
    let total: number;

    if (config.key === "categories") {
      items = data.categories || [];
      total = items.length;
    } else if (config.key === "items") {
      items = data.items || [];
      total = data.total ?? items.length;
    } else if (config.key === "customers") {
      items = data.customers || [];
      total = data.total ?? items.length;
    } else if (config.key === "orders") {
      items = data.orders || [];
      total = data.total ?? items.length;
    } else if (config.key === "coupons") {
      items = data.coupons || [];
      total = data.total ?? items.length;
    } else {
      items = data[config.key] || data.items || [];
      total = data.total ?? items.length;
    }

    return { data: items, total };
  },

  getOne: async ({ resource, id }) => {
    const config = resourceMap[resource];
    if (!config) throw new Error(`Unknown resource: ${resource}`);

    const url = `${API_URL}${config.path}/${id}`;
    const data = await fetchJson(url);
    return { data: data[resource] || data.item || data.product || data.admin || data.order || data.coupon || data.setting || data };
  },

  create: async ({ resource, variables }) => {
    const config = resourceMap[resource];
    if (!config) throw new Error(`Unknown resource: ${resource}`);

    const data = await fetchJson(`${API_URL}${config.path}`, {
      method: "POST",
      body: JSON.stringify(variables),
    });

    return { data: data[resource] || data.item || data.product || data.admin || data.order || data.coupon || data.setting || data };
  },

  update: async ({ resource, id, variables }) => {
    const config = resourceMap[resource];
    if (!config) throw new Error(`Unknown resource: ${resource}`);

    const data = await fetchJson(`${API_URL}${config.path}/${id}`, {
      method: "PUT",
      body: JSON.stringify(variables),
    });

    return { data: data[resource] || data.item || data.product || data.admin || data.order || data.coupon || data.setting || data };
  },

  deleteOne: async ({ resource, id }) => {
    const config = resourceMap[resource];
    if (!config) throw new Error(`Unknown resource: ${resource}`);

    await fetchJson(`${API_URL}${config.path}/${id}`, { method: "DELETE" });

    return { data: { id } as any };
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
