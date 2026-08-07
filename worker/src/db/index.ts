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
} from './types';
