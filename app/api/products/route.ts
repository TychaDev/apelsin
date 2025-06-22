import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""

    let sqlQuery = "SELECT * FROM products"
    let params: any[] = []

    if (search) {
      sqlQuery += " WHERE name ILIKE $1 OR category1 ILIKE $1 OR category2 ILIKE $1"
      params = [`%${search}%`]
    }

    sqlQuery += " ORDER BY name"

    const result = await query(sqlQuery, params)
    return NextResponse.json({ products: result.rows })
  } catch (error) {
    console.error("Get products error:", error)
    return NextResponse.json({ error: "Ошибка получения товаров" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { sku, name, description, image_url } = await request.json()

    await query(
      "UPDATE products SET name = $1, description = $2, image_url = $3, updated_at = CURRENT_TIMESTAMP WHERE sku = $4",
      [name, description, image_url, sku],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update product error:", error)
    return NextResponse.json({ error: "Ошибка обновления товара" }, { status: 500 })
  }
}
