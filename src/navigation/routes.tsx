import type { ComponentType, JSX } from 'react';

import { IndexPage } from '@/pages/IndexPage/IndexPage';
import { InitDataPage } from '@/pages/InitDataPage.tsx';
import { LaunchParamsPage } from '@/pages/LaunchParamsPage.tsx';
import { ThemeParamsPage } from '@/pages/ThemeParamsPage.tsx';
import { ChatPage } from '@/pages/ChatPage/ChatPage';
import { QuickBuyPage } from '@/pages/QuickBuyPage/QuickBuyPage.tsx';
import { ProfilePage } from '@/pages/ProfilePage/ProfilePage';
import { AdminPanelPage } from '@/pages/AdminPanelPage/AdminPanelPage';
import { OrdersPage } from '@/pages/OrdersPage/OrdersPage';

interface Route {
  path: string;
  Component: ComponentType;
  title?: string;
  icon?: JSX.Element;
}

export const routes: Route[] = [
  { path: '/', Component: IndexPage },
  { path: '/chat', Component: ChatPage, title: 'چت با هوش مصنوعی' },
  { path: '/quick-buy', Component: QuickBuyPage, title: 'سفارش سریع' },
  { path: '/profile', Component: ProfilePage, title: 'پروفایل' },
  { path: '/orders', Component: OrdersPage, title: 'سفارش‌های من' },
  { path: '/admin-panel', Component: AdminPanelPage, title: 'پنل ادمین' },
  { path: '/init-data', Component: InitDataPage, title: 'Init Data' },
  { path: '/theme-params', Component: ThemeParamsPage, title: 'Theme Params' },
  { path: '/launch-params', Component: LaunchParamsPage, title: 'Launch Params' },
];
