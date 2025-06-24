import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("image") as File
    const sku = formData.get("sku") as string

    if (!file || !sku) {
      return NextResponse.json({ success: false, error: "Файл или SKU не предоставлены" }, { status: 400 })
    }

    console.log(`Загрузка изображения для товара: ${sku}`)

    // Создаем директорию для изображений если её нет
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "products")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
      console.log(`Создана директория: ${uploadsDir}`)
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now()
    const extension = file.name.split(".").pop() || "jpg"
    const filename = `${sku}_${timestamp}.${extension}`
    const filepath = path.join(uploadsDir, filename)

    // Сохраняем файл
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    console.log(`Файл сохранен: ${filepath}`)

    // URL для доступа к изображению
    const imageUrl = `/uploads/products/${filename}`

    // Обновляем запись в базе данных
    const client = await pool.connect()
    try {
      await client.query("UPDATE products SET image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE sku = $2", [
        imageUrl,
        sku,
      ])
      console.log(`Обновлена запись в БД для SKU: ${sku}`)
    } finally {
      client.release()
    }

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      message: "Изображение успешно загружено",
    })
  } catch (error) {
    console.error("Ошибка загрузки изображения:", error)
    return NextResponse.json(
      { success: false, error: "Ошибка загрузки изображения: " + (error as Error).message },
      { status: 500 },
    )
  }
}
