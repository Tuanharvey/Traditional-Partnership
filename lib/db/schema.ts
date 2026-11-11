import { boolean, date, index, integer, jsonb, numeric, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

export const sellerProfiles = pgTable('seller_profiles', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().unique(),
  shopName: text('shopName').notNull(),
  bio: text('bio').notNull().default(''),
  contactPhone: text('contactPhone'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  category: text('category').notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  materialCost: numeric('materialCost', { precision: 12, scale: 2 }).notNull().default('0'),
  laborCost: numeric('laborCost', { precision: 12, scale: 2 }).notNull().default('0'),
  stockQuantity: integer('stockQuantity').notNull().default(0),
  imageUrls: jsonb('imageUrls').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  status: text('status').notNull().default('draft'),
  viewCount: integer('viewCount').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (table) => [
  index('products_user_created_idx').on(table.userId, table.createdAt),
  index('products_marketplace_idx').on(table.status, table.createdAt),
])

export const orderRequests = pgTable('order_requests', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  buyerName: text('buyerName').notNull(),
  buyerEmail: text('buyerEmail').notNull(),
  buyerPhone: text('buyerPhone').notNull(),
  note: text('note').notNull().default(''),
  totalAmount: numeric('totalAmount', { precision: 12, scale: 2 }).notNull(),
  status: text('status').notNull().default('new'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (table) => [index('order_requests_seller_created_idx').on(table.userId, table.createdAt)])

export const orderRequestItems = pgTable('order_request_items', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  orderRequestId: text('orderRequestId').notNull(),
  productId: text('productId').notNull(),
  productName: text('productName').notNull(),
  unitPrice: numeric('unitPrice', { precision: 12, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull(),
  lineTotal: numeric('lineTotal', { precision: 12, scale: 2 }).notNull(),
}, (table) => [index('order_items_order_idx').on(table.userId, table.orderRequestId)])

export const financialEntries = pgTable('financial_entries', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  entryType: text('entryType').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text('paymentMethod').notNull().default('cash'),
  sourceOrderId: text('sourceOrderId').unique(),
  entryDate: date('entryDate', { mode: 'string' }).notNull().default(sql`CURRENT_DATE`),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (table) => [index('financial_entries_user_date_idx').on(table.userId, table.entryDate)])

export const inventoryItems = pgTable('inventory_items', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  name: text('name').notNull(),
  unit: text('unit').notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 2 }).notNull().default('0'),
  unitCost: numeric('unitCost', { precision: 12, scale: 2 }).notNull().default('0'),
  reorderLevel: numeric('reorderLevel', { precision: 12, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (table) => [index('inventory_items_user_name_idx').on(table.userId, table.name)])

export const inventoryMovements = pgTable('inventory_movements', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  itemId: text('itemId').notNull(),
  movementType: text('movementType').notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 2 }).notNull(),
  unitCost: numeric('unitCost', { precision: 12, scale: 2 }).notNull().default('0'),
  note: text('note').notNull().default(''),
  occurredAt: timestamp('occurredAt').notNull().defaultNow(),
}, (table) => [index('inventory_movements_user_item_idx').on(table.userId, table.itemId, table.occurredAt)])
