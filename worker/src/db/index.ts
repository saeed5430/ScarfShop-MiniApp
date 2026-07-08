import type { D1Database } from '@cloudflare/workers-types';
import { UsersDB } from './users';
import { AdminsDB } from './admins';
import { SessionsDB } from './sessions';
import { ChatsDB } from './chats';
import { CategoriesDB } from './categories';
import { ProductsDB } from './products';
import { DesignsDB } from './designs';
import { ColorsDB } from './colors';
import { SizesDB } from './sizes';
import { VariantsDB } from './variants';
import { VariantRelationsDB } from './variant-relations';

export class Database {
  public users: UsersDB;
  public admins: AdminsDB;
  public sessions: SessionsDB;
  public chats: ChatsDB;
  public categories: CategoriesDB;
  public products: ProductsDB;
  public designs: DesignsDB;
  public colors: ColorsDB;
  public sizes: SizesDB;
  public variants: VariantsDB;
  public variantRelations: VariantRelationsDB;

  constructor(db: D1Database) {
    this.users = new UsersDB(db);
    this.admins = new AdminsDB(db);
    this.sessions = new SessionsDB(db);
    this.chats = new ChatsDB(db);
    this.categories = new CategoriesDB(db);
    this.products = new ProductsDB(db);
    this.designs = new DesignsDB(db);
    this.colors = new ColorsDB(db);
    this.sizes = new SizesDB(db);
    this.variants = new VariantsDB(db);
    this.variantRelations = new VariantRelationsDB(db);
  }
}

export type {
  User, Admin, Session, Chat, CreateUserInput, UpdateUserInput,
  Category, CreateCategoryInput, UpdateCategoryInput,
  Product, CreateProductInput, UpdateProductInput,
  Design, CreateDesignInput, UpdateDesignInput,
  Color, CreateColorInput, UpdateColorInput,
  Size, CreateSizeInput, UpdateSizeInput,
  Variant, CreateVariantInput, UpdateVariantInput,
} from './types';
