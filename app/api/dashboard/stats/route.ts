import { NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET() {
  try {
    console.log("=== GET /api/dashboard/stats ===")

    const client = await pool.connect()

    try {
      // Получаем статистику заказов
      const ordersResult = await client.query(`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status IN ('pending', 'processing', 'ready') THEN 1 END) as active_orders,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_revenue
        FROM orders
      `)

      // Получаем статистику товаров
      const productsResult = await client.query(`
        SELECT 
          COUNT(*) as total_products,
          COALESCE(SUM(stock), 0) as total_stock,
          COUNT(CASE WHEN stock > 0 THEN 1 END) as in_stock_products,
          COUNT(CASE WHEN stock = 0 THEN 1 END) as out_of_stock_products
        FROM products
      `)

      // Получаем последние импорты
      const importsResult = await client.query(`
        SELECT 
          COUNT(*) as total_imports,
          COALESCE(SUM(products_imported), 0) as total_imported_products,
          MAX(created_at) as last_import
        FROM import_logs
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `)

      const orderStats = ordersResult.rows[0]
      const productStats = productsResult.rows[0]
      const importStats = importsResult.rows[0]

      const stats = {
        // Заказы
        totalOrders: Number.parseInt(orderStats.total_orders) || 0,
        activeOrders: Number.parseInt(orderStats.active_orders) || 0,
        totalRevenue: Number.parseFloat(orderStats.total_revenue) || 0,

        // Товары
        totalProducts: Number.parseInt(productStats.total_products) || 0,
        totalStock: Number.parseInt(productStats.total_stock) || 0,
        inStockProducts: Number.parseInt(productStats.in_stock_products) || 0,
        outOfStockProducts: Number.parseInt(productStats.out_of_stock_products) || 0,

        // Импорты
        totalImports: Number.parseInt(importStats.total_imports) || 0,
        totalImportedProducts: Number.parseInt(importStats.total_imported_products) || 0,
        lastImport: importStats.last_import,
      }

      console.log("Dashboard stats:", stats)

      return NextResponse.json({
        success: true,
        stats,
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Dashboard stats error:", error)

    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        stats: {
          totalOrders: 0,
          activeOrders: 0,
          totalRevenue: 0,
          totalProducts: 0,
          totalStock: 0,
          inStockProducts: 0,
          outOfStockProducts: 0,
          totalImports: 0,
          totalImportedProducts: 0,
          lastImport: null,
        },
      },
      { status: 500 },
    )
  }
}
