import type { D1Database } from '@cloudflare/workers-types';
import { CustomersDB } from './customers';
import { AdminsDB } from './admin';
import { SessionsDB } from './sessions';
import { ChatsDB } from './chats';
import { CategoriesDB } from './categories';
import { ProductsDB } from './products';
import { DesignsDB } from './designs';
import { ColorsDB } from './colors';
import { SizesDB } from './sizes';
import { OrdersDB } from './orders';
import { OrderItemsDB } from './order-items';
import { CouponsDB } from './coupons';
import { SettingsDB } from './settings';
import { OrderTelegramDB } from './order-telegram';
import { TelegramAccountsDB } from './telegram-accounts';
import { TelegramDeletionQueueDB } from './telegram-deletion-queue';
import { BaleCustomersDB } from './bale-customers';
import { BaleSessionsDB } from './bale-sessions';
import { BaleChatsDB } from './bale-chats';
import { BaleOrderDB } from './bale-order';
import { BaleDeletionQueueDB } from './bale-deletion-queue';

export class Database {
  public customers: CustomersDB;
  public admins: AdminsDB;
  public sessions: SessionsDB;
  public chats: ChatsDB;
  public categories: CategoriesDB;
  public products: ProductsDB;
  public designs: DesignsDB;
  public colors: ColorsDB;
  public sizes: SizesDB;
  public orders: OrdersDB;
  public orderItems: OrderItemsDB;
  public coupons: CouponsDB;
  public settings: SettingsDB;
  public orderTelegram: OrderTelegramDB;
  public telegramAccounts: TelegramAccountsDB;
  public telegramDeletionQueue: TelegramDeletionQueueDB;
  public baleCustomers: BaleCustomersDB;
  public baleSessions: BaleSessionsDB;
  public baleChats: BaleChatsDB;
  public baleOrder: BaleOrderDB;
  public baleDeletionQueue: BaleDeletionQueueDB;

  constructor(db: D1Database) {
    this.customers = new CustomersDB(db);
    this.admins = new AdminsDB(db);
    this.sessions = new SessionsDB(db);
    this.chats = new ChatsDB(db);
    this.categories = new CategoriesDB(db);
    this.products = new ProductsDB(db);
    this.designs = new DesignsDB(db);
    this.colors = new ColorsDB(db);
    this.sizes = new SizesDB(db);
    this.orders = new OrdersDB(db);
    this.orderItems = new OrderItemsDB(db);
    this.coupons = new CouponsDB(db);
    this.settings = new SettingsDB(db);
    this.orderTelegram = new OrderTelegramDB(db);
    this.telegramAccounts = new TelegramAccountsDB(db);
    this.telegramDeletionQueue = new TelegramDeletionQueueDB(db);
    this.baleCustomers = new BaleCustomersDB(db);
    this.baleSessions = new BaleSessionsDB(db);
    this.baleChats = new BaleChatsDB(db);
    this.baleOrder = new BaleOrderDB(db);
    this.baleDeletionQueue = new BaleDeletionQueueDB(db);
  }
}

export type {
  Customer, Admin, Session, Chat, CreateCustomerInput, UpdateCustomerInput,
  Category, CreateCategoryInput, UpdateCategoryInput,
  Product, CreateProductInput, UpdateProductInput,
  Design, CreateDesignInput, UpdateDesignInput,
  Color, CreateColorInput, UpdateColorInput,
  Size, CreateSizeInput, UpdateSizeInput,
  Order, CreateOrderInput, UpdateOrderInput,
  OrderItem, CreateOrderItemInput,
  Coupon, CreateCouponInput, UpdateCouponInput,
  Setting, UpdateSettingInput,
  DeliveryMethod,
  AdminTelegramAccount, UpdateTelegramAccountInput, TelegramAccountStatus,
  TelegramDeletionQueueItem,
} from './types';
