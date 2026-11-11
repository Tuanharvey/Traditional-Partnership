import { and, desc, eq, gte, inArray, lt, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { financialEntries, inventoryItems, inventoryMovements, orderRequestItems, orderRequests, products, sellerProfiles } from '@/lib/db/schema'

export async function getPublicProducts() {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      category: products.category,
      price: products.price,
      imageUrls: products.imageUrls,
      shopName: sellerProfiles.shopName,
    })
    .from(products)
    .innerJoin(sellerProfiles, eq(products.userId, sellerProfiles.userId))
    .where(eq(products.status, 'published'))
    .orderBy(desc(products.createdAt))
    .limit(60)

  return rows.map((product) => ({
    ...product,
    price: Number(product.price),
  }))
}

export async function getSellerDashboardData(userId: string) {
  const [seller] = await db
    .select()
    .from(sellerProfiles)
    .where(eq(sellerProfiles.userId, userId))
    .limit(1)

  if (!seller) return null

  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 6)
  const weekStartString = weekStart.toISOString().slice(0, 10)
  const monthStartString = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const nextMonthString = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10)

  const [sellerProducts, sellerOrders, sellerEntries, materials, movements, weeklyTotals, monthlyTotals] = await Promise.all([
    db.select().from(products).where(eq(products.userId, userId)).orderBy(desc(products.createdAt)).limit(100),
    db.select().from(orderRequests).where(eq(orderRequests.userId, userId)).orderBy(desc(orderRequests.createdAt)).limit(50),
    db.select().from(financialEntries).where(eq(financialEntries.userId, userId)).orderBy(desc(financialEntries.entryDate), desc(financialEntries.createdAt)).limit(50),
    db.select().from(inventoryItems).where(eq(inventoryItems.userId, userId)).orderBy(inventoryItems.name).limit(200),
    db.select({
      id: inventoryMovements.id,
      itemName: inventoryItems.name,
      movementType: inventoryMovements.movementType,
      quantity: inventoryMovements.quantity,
      unitCost: inventoryMovements.unitCost,
      note: inventoryMovements.note,
      occurredAt: inventoryMovements.occurredAt,
    }).from(inventoryMovements).innerJoin(inventoryItems, and(
      eq(inventoryMovements.itemId, inventoryItems.id),
      eq(inventoryMovements.userId, inventoryItems.userId),
    )).where(eq(inventoryMovements.userId, userId)).orderBy(desc(inventoryMovements.occurredAt)).limit(30),
    db.select({
      entryType: financialEntries.entryType,
      total: sql<string>`coalesce(sum(${financialEntries.amount}), 0)`,
    }).from(financialEntries).where(and(eq(financialEntries.userId, userId), gte(financialEntries.entryDate, weekStartString))).groupBy(financialEntries.entryType),
    db.select({
      entryType: financialEntries.entryType,
      total: sql<string>`coalesce(sum(${financialEntries.amount}), 0)`,
    }).from(financialEntries).where(and(
      eq(financialEntries.userId, userId),
      gte(financialEntries.entryDate, monthStartString),
      lt(financialEntries.entryDate, nextMonthString),
    )).groupBy(financialEntries.entryType),
  ])

  const orderIds = sellerOrders.map((order) => order.id)
  const items = orderIds.length
    ? await db.select().from(orderRequestItems).where(and(
        eq(orderRequestItems.userId, userId),
        inArray(orderRequestItems.orderRequestId, orderIds),
      ))
    : []

  const totalFor = (rows: { entryType: string; total: string }[], type: 'income' | 'expense') =>
    Number(rows.find((row) => row.entryType === type)?.total ?? 0)

  return {
    seller,
    products: sellerProducts.map((product) => ({
      ...product,
      price: Number(product.price),
      materialCost: Number(product.materialCost),
      laborCost: Number(product.laborCost),
    })),
    orders: sellerOrders.map((order) => ({
      ...order,
      totalAmount: Number(order.totalAmount),
      items: items
        .filter((item) => item.orderRequestId === order.id)
        .map((item) => ({ ...item, unitPrice: Number(item.unitPrice), lineTotal: Number(item.lineTotal) })),
    })),
    financialEntries: sellerEntries.map((entry) => ({ ...entry, amount: Number(entry.amount) })),
    inventoryItems: materials.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
      reorderLevel: Number(item.reorderLevel),
    })),
    inventoryMovements: movements.map((movement) => ({
      ...movement,
      quantity: Number(movement.quantity),
      unitCost: Number(movement.unitCost),
    })),
    reports: {
      weeklyIncome: totalFor(weeklyTotals, 'income'),
      weeklyExpenses: totalFor(weeklyTotals, 'expense'),
      monthlyIncome: totalFor(monthlyTotals, 'income'),
      monthlyExpenses: totalFor(monthlyTotals, 'expense'),
    },
  }
}
