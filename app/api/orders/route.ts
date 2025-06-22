import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    const result = await query(`
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
      WHERE o.status NOT IN ('completed', 'cancelled')
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `)

    return NextResponse.json({ orders: result.rows })
  } catch (error) {
    console.error("Get orders error:", error)
    return NextResponse.json({ error: "Ошибка получения заказов" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { orderId, status } = await request.json()

    await query("UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [status, orderId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update order error:", error)
    return NextResponse.json({ error: "Ошибка обновления заказа" }, { status: 500 })
  }
}
