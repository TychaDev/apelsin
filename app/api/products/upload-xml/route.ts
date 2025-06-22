import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 })
    }

    const xmlText = await file.text()
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, "text/xml")

    const offers = xmlDoc.getElementsByTagName("offer")
    let importedCount = 0

    // Начинаем транзакцию
    await query("BEGIN")

    try {
      for (let i = 0; i < offers.length; i++) {
        const offer = offers[i]
        const sku = offer.getAttribute("sku")
        const group1 = offer.getAttribute("group1") || ""
        const group2 = offer.getAttribute("group2") || ""

        const name = offer.getElementsByTagName("name")[0]?.textContent || ""
        const priceText = offer.getElementsByTagName("price")[0]?.textContent || "0"
        const stockText = offer.getElementsByTagName("ostatok")[0]?.textContent || "0"

        if (!sku || !name) continue

        const price = Number.parseFloat(priceText.replace(/\s/g, "")) || 0
        const stock = Number.parseFloat(stockText) || 0

        // Upsert товара
        await query(
          `
          INSERT INTO products (sku, name, category1, category2, price, stock)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (sku) 
          DO UPDATE SET 
            name = EXCLUDED.name,
            category1 = EXCLUDED.category1,
            category2 = EXCLUDED.category2,
            price = EXCLUDED.price,
            stock = EXCLUDED.stock,
            updated_at = CURRENT_TIMESTAMP
        `,
          [sku, name, group1, group2, price, stock],
        )

        importedCount++
      }

      await query("COMMIT")
      return NextResponse.json({
        success: true,
        message: `Успешно импортировано ${importedCount} товаров`,
      })
    } catch (error) {
      await query("ROLLBACK")
      throw error
    }
  } catch (error) {
    console.error("XML upload error:", error)
    return NextResponse.json({ error: "Ошибка импорта XML" }, { status: 500 })
  }
}
