import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { Refine, useAuthenticated } from "@refinedev/core";
import { dataProvider } from "./dataProvider";
import { authProvider } from "./providers/authProvider";
import routerProvider, {
  NavigateToResource,
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from "@refinedev/react-router-v6";
import { ThemedLayout, RefineThemes, useNotificationProvider, ErrorComponent } from "@refinedev/antd";
import { App as AntdApp, ConfigProvider } from "antd";
import faIR from "antd/locale/fa_IR";

import "@refinedev/antd/dist/reset.css";

import { LoginPage } from "./pages/login";
import { CategoryList, CategoryCreate, CategoryEdit } from "./pages/categories";
import { ProductList, ProductCreate, ProductEdit } from "./pages/products";
import { ColorList, ColorCreate, ColorEdit } from "./pages/colors";
import { SizeList, SizeCreate, SizeEdit } from "./pages/sizes";
import { DesignList, DesignCreate, DesignEdit } from "./pages/designs";
import { UserList } from "./pages/users";
import { AdminList, AdminCreate, AdminEdit } from "./pages/admins";
import { OrderList, OrderShow } from "./pages/orders";
import { CouponList, CouponCreate, CouponEdit } from "./pages/coupons";
import { SettingsPage } from "./pages/settings";

const Authenticated: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading } = useAuthenticated();
  if (isLoading) return null;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <ConfigProvider theme={RefineThemes.Purple} locale={faIR} direction="rtl">
        <AntdApp>
          <Refine
            dataProvider={dataProvider}
            authProvider={authProvider}
            routerProvider={routerProvider}
            notificationProvider={useNotificationProvider}
            resources={[
              { name: "categories", list: "/categories", create: "/categories/create", edit: "/categories/edit/:id", meta: { label: "دسته‌بندی‌ها" } },
              { name: "products", list: "/products", create: "/products/create", edit: "/products/edit/:id", meta: { label: "محصولات" } },
              { name: "colors", list: "/colors", create: "/colors/create", edit: "/colors/edit/:id", meta: { label: "رنگ‌ها" } },
              { name: "sizes", list: "/sizes", create: "/sizes/create", edit: "/sizes/edit/:id", meta: { label: "سایزها" } },
              { name: "designs", list: "/designs", create: "/designs/create", edit: "/designs/edit/:id", meta: { label: "طرح‌ها" } },
              { name: "users", list: "/users", meta: { label: "کاربران" } },
              { name: "admins", list: "/admins", create: "/admins/create", edit: "/admins/edit/:id", meta: { label: "ادمین‌ها" } },
              { name: "orders", list: "/orders", show: "/orders/show/:id", meta: { label: "سفارشات" } },
              { name: "coupons", list: "/coupons", create: "/coupons/create", edit: "/coupons/edit/:id", meta: { label: "کدهای تخفیف" } },
              { name: "settings", list: "/settings", meta: { label: "تنظیمات" } },
            ]}
            options={{
              redirect: {
                afterCreate: false,
                afterEdit: false,
              },
              disableTelemetry: true,
            }}
          >
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                  <Authenticated>
                    <ThemedLayout>
                      <Outlet />
                    </ThemedLayout>
                  </Authenticated>
                }
              >
                <Route index element={<NavigateToResource resource="categories" />} />
                <Route path="/categories"><Route index element={<CategoryList />} /><Route path="create" element={<CategoryCreate />} /><Route path="edit/:id" element={<CategoryEdit />} /></Route>
                <Route path="/products"><Route index element={<ProductList />} /><Route path="create" element={<ProductCreate />} /><Route path="edit/:id" element={<ProductEdit />} /></Route>
                <Route path="/colors"><Route index element={<ColorList />} /><Route path="create" element={<ColorCreate />} /><Route path="edit/:id" element={<ColorEdit />} /></Route>
                <Route path="/sizes"><Route index element={<SizeList />} /><Route path="create" element={<SizeCreate />} /><Route path="edit/:id" element={<SizeEdit />} /></Route>
                <Route path="/designs"><Route index element={<DesignList />} /><Route path="create" element={<DesignCreate />} /><Route path="edit/:id" element={<DesignEdit />} /></Route>
                <Route path="/users"><Route index element={<UserList />} /></Route>
                <Route path="/admins"><Route index element={<AdminList />} /><Route path="create" element={<AdminCreate />} /><Route path="edit/:id" element={<AdminEdit />} /></Route>
                <Route path="/orders"><Route index element={<OrderList />} /><Route path="show/:id" element={<OrderShow />} /></Route>
                <Route path="/coupons"><Route index element={<CouponList />} /><Route path="create" element={<CouponCreate />} /><Route path="edit/:id" element={<CouponEdit />} /></Route>
                <Route path="/settings"><Route index element={<SettingsPage />} /></Route>
              </Route>
              <Route path="*" element={<ErrorComponent />} />
            </Routes>
            <UnsavedChangesNotifier />
            <DocumentTitleHandler />
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
