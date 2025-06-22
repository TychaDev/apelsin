import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""

    let sqlQuery = `
      SELECT 
        o.*,
        json_agg(
          json_build_object(
            'name', oi.product_name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status IN ('completed', 'cancelled')
    `
    let params: any[] = []

    if (search) {
      sqlQuery += " AND (o.customer_phone ILIKE $1 OR o.customer_name ILIKE $1)"
      params = [`%${search}%`]
    }

    sqlQuery += " GROUP BY o.id ORDER BY o.created_at DESC"

    const result = await query(sqlQuery, params)
    return NextResponse.json({ orders: result.rows })
  } catch (error) {
    console.error("Get history error:", error)
    return NextResponse.json({ error: "Ошибка получения истории" }, { status: 500 })
  }
}
