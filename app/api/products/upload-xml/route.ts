import { type NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"

// Подключение к базе данных
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Простой XML парсер
function parseXML(xmlContent: string) {
  const products = []

  try {
    console.log("Начинаем парсинг XML...")

    // Ищем все теги <offer>
    const offerMatches = xmlContent.match(/<offer[^>]*>[\s\S]*?<\/offer>/g)

    if (offerMatches) {
      console.log(`Найдено ${offerMatches.length} товаров в XML`)

      for (const offer of offerMatches) {
        // Извлекаем атрибуты
        const sku = offer.match(/sku="([^"]*)"/) ? offer.match(/sku="([^"]*)"/)?.[1] : ""
        const group1 = offer.match(/group1="([^"]*)"/) ? offer.match(/group1="([^"]*)"/)?.[1] : ""
        const group2 = offer.match(/group2="([^"]*)"/) ? offer.match(/group2="([^"]*)"/)?.[1] : ""

        // Извлекаем содержимое тегов
        const nameMatch = offer.match(/<name>(.*?)<\/name>/)
        const stockMatch = offer.match(/<ostatok>(.*?)<\/ostatok>/)
        const priceMatch = offer.match(/<price>(.*?)<\/price>/)

        const name = nameMatch ? nameMatch[1] : ""
        const stockText = stockMatch ? stockMatch[1] : "0"
        const priceText = priceMatch ? priceMatch[1] : "0"

        if (sku && name) {
          products.push({
            sku,
            name,
            category1: group1 || "",
            category2: group2 || "",
            stock: Number.parseFloat(stockText.replace(/\s/g, "").replace(",", ".")) || 0,
            price: Number.parseFloat(priceText.replace(/\s/g, "").replace(",", ".")) || 0,
          })
        }
      }
    } else {
      console.log("Теги <offer> не найдены в XML")
    }
  } catch (error) {
    console.error("Ошибка парсинга XML:", error)
  }

  console.log(`Обработано ${products.length} товаров`)
  return products
}

export async function POST(request: NextRequest) {
  try {
    console.log("Получен запрос на загрузку XML")

    const formData = await request.formData()
    const file = formData.get("xmlFile") as File

    if (!file) {
      console.log("Файл не найден в запросе")
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 })
    }

    console.log(`Получен файл: ${file.name}, размер: ${file.size} байт`)

    const xmlText = await file.text()
    console.log(`Содержимое файла прочитано, длина: ${xmlText.length} символов`)

    const products = parseXML(xmlText)

    if (products.length === 0) {
      return NextResponse.json(
        {
          error: "В XML файле не найдено товаров для импорта",
          xmlPreview: xmlText.substring(0, 500) + "...",
        },
        { status: 400 },
      )
    }

    // Начинаем транзакцию
    const client = await pool.connect()

    try {
      await client.query("BEGIN")

      let importedCount = 0
      let errorCount = 0

      for (const product of products) {
        try {
          await client.query(
            `
            INSERT INTO products (sku, name, category1, category2, price, stock, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (sku) 
            DO UPDATE SET 
              name = EXCLUDED.name,
              category1 = EXCLUDED.category1,
              category2 = EXCLUDED.category2,
              price = EXCLUDED.price,
              stock = EXCLUDED.stock,
              updated_at = NOW()
          `,
            [product.sku, product.name, product.category1, product.category2, product.price, product.stock],
          )

          importedCount++
        } catch (error) {
          console.error(`Ошибка сохранения товара ${product.sku}:`, error)
          errorCount++
        }
      }

      await client.query("COMMIT")

      // Логирование
      try {
        await client.query(
          `
          INSERT INTO import_logs (filename, products_imported, status, error_message, created_at)
          VALUES ($1, $2, $3, $4, NOW())
        `,
          [
            file.name,
            importedCount,
            errorCount > 0 ? "partial" : "success",
            errorCount > 0 ? `Ошибок: ${errorCount}` : null,
          ],
        )
      } catch (logError) {
        console.error("Ошибка записи лога:", logError)
      }

      // Получаем обновленный список товаров
      const result = await client.query("SELECT * FROM products ORDER BY updated_at DESC")

      return NextResponse.json({
        success: true,
        message: `Успешно импортировано ${importedCount} товаров`,
        count: importedCount,
        errors: errorCount,
        products: result.rows,
      })
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("XML upload error:", error)
    return NextResponse.json(
      {
        error: "Ошибка импорта XML: " + (error as Error).message,
      },
      { status: 500 },
    )
  }
}
