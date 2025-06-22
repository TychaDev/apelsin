import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    // Получаем статистику
    const totalOrdersResult = await query("SELECT COUNT(*) as count FROM orders")
    const activeOrdersResult = await query(
      "SELECT COUNT(*) as count FROM orders WHERE status NOT IN ('completed', 'cancelled')",
    )
    const totalProductsResult = await query("SELECT COUNT(*) as count FROM products")
    const revenueResult = await query(`
      SELECT COALESCE(SUM(total_amount), 0) as revenue 
      FROM orders 
      WHERE status = 'completed' 
      AND created_at >= date_trunc('month', CURRENT_DATE)
    `)

    // Последние заказы
    const recentOrdersResult = await query(`
      SELECT * FROM orders 
      WHERE status NOT IN ('completed', 'cancelled')
      ORDER BY created_at DESC 
      LIMIT 5
    `)

    // Популярные товары
    const popularProductsResult = await query(`
      SELECT 
        p.name,
        SUM(oi.quantity) as sales,
        SUM(oi.total) as revenue
      FROM order_items oi
      JOIN products p ON p.sku = oi.product_id::text
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY p.name
      ORDER BY sales DESC
      LIMIT 5
    `)

    return NextResponse.json({
      stats: {
        totalOrders: totalOrdersResult.rows[0].count,
        activeOrders: activeOrdersResult.rows[0].count,
        totalProducts: totalProductsResult.rows[0].count,
        revenue: revenueResult.rows[0].revenue,
      },
      recentOrders: recentOrdersResult.rows,
      popularProducts: popularProductsResult.rows,
    })
  } catch (error) {
    console.error("Get dashboard stats error:", error)
    return NextResponse.json({ error: "Ошибка получения статистики" }, { status: 500 })
  }
}
