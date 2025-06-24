import { type NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const search = searchParams.get("search") || ""

    const offset = (page - 1) * limit

    const client = await pool.connect()

    try {
      let query = "SELECT sku, name, category1, category2, price, stock, image_url as image, description FROM products"
      let countQuery = "SELECT COUNT(*) FROM products"
      const params: any[] = []

      if (search) {
        const searchCondition = " WHERE name ILIKE $1 OR category1 ILIKE $1 OR category2 ILIKE $1 OR sku ILIKE $1"
        query += searchCondition
        countQuery += searchCondition
        params.push(`%${search}%`)
      }

      query += ` ORDER BY updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
      params.push(limit, offset)

      const [productsResult, countResult] = await Promise.all([
        client.query(query, params),
        client.query(countQuery, search ? [`%${search}%`] : []),
      ])

      const total = Number.parseInt(countResult.rows[0].count)
      const totalPages = Math.ceil(total / limit)

      return NextResponse.json({
        success: true,
        products: productsResult.rows,
        count: productsResult.rows.length,
        total,
        page,
        totalPages,
        hasMore: page < totalPages,
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Ошибка получения товаров:", error)
    return NextResponse.json(
      {
        success: false,
        products: [],
        count: 0,
        total: 0,
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const product = await request.json()
    const { sku, name, image, description } = product

    const client = await pool.connect()
    try {
      await client.query(
        "UPDATE products SET name = $1, image_url = $2, description = $3, updated_at = CURRENT_TIMESTAMP WHERE sku = $4",
        [name, image, description, sku],
      )

      return NextResponse.json({
        success: true,
        message: "Товар обновлен",
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Ошибка обновления товара:", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  try {
    const client = await pool.connect()
    try {
      await client.query("DELETE FROM products")
      await client.query("ALTER SEQUENCE products_id_seq RESTART WITH 1")

      return NextResponse.json({
        success: true,
        message: "Все товары удалены",
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Ошибка удаления товаров:", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
