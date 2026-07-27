import { Hono } from 'hono';
import { sendOrderNotification } from '../services/notify';
import { Database } from '../db';

type Bindings = {
  DB: D1Database;
  ORDER_NOTIFY_BOT_TOKEN: string;
};

export const testRoutes = new Hono<{ Bindings: Bindings }>();

// Simple test endpoint
testRoutes.get('/test-notification', async (c) => {
  const db = c.env.DB;
  const botToken = c.env.ORDER_NOTIFY_BOT_TOKEN;

  if (!db) return c.json({ error: 'Database not configured' }, 500);
  if (!botToken) return c.json({ error: 'Bot token not configured' }, 500);

  const database = new Database(db);

  // Get first customer (or use test data)
  const customers = await database.customers.list(1);
  const customerId = customers.length > 0 ? customers[0].id : 'test_user';

  // Test order items
  const testItems = [
    {
      product_name: 'روسری درختی',
      category_name: 'روسری',
      color_name: 'مشکی',
      color_hex: '#000000',
      size_dimensions: '100x100',
      quantity: 2,
    },
    {
      product_name: 'شال ابریشمی',
      category_name: 'شال',
      color_name: 'سرمه‌ای',
      color_hex: '#000080',
      size_dimensions: '110x110',
      quantity: 1,
    },
  ];

  try {
    const result = await sendOrderNotification(db, botToken, 999, customerId, testItems);
    return c.json({
      success: true,
      message: 'Test notification sent',
      result,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});
