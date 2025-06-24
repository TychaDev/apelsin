import { type NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"
import fs from "fs"
import path from "path"

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
    console.log("FTP синхронизация запущена...")

    // Возможные пути к FTP директории
    const possiblePaths = [
      "/ftp-data/home/apelsin_xml/xml_uploads",
      "/opt/apelsin/ftp-data/home/apelsin_xml/xml_uploads",
      "/app/ftp-data/home/apelsin_xml/xml_uploads",
      "/var/ftp/apelsin_xml/xml_uploads",
      "/home/apelsin_xml/xml_uploads",
      "./ftp-data/home/apelsin_xml/xml_uploads",
    ]

    let ftpDir = ""
    let dirExists = false

    // Ищем существующую директорию
    for (const dir of possiblePaths) {
      if (fs.existsSync(dir)) {
        ftpDir = dir
        dirExists = true
        console.log(`Найдена FTP директория: ${dir}`)
        break
      }
    }

    if (!dirExists) {
      // Пытаемся создать первую директорию
      ftpDir = possiblePaths[0]
      try {
        fs.mkdirSync(ftpDir, { recursive: true })
        console.log(`Создана FTP директория: ${ftpDir}`)

        // Создаем тестовый файл
        const testXml = `<?xml version="1.0" encoding="UTF-8"?>
<catalog date="2024-01-01" xmlns="1cShopping">
  <company>Apelsin</company>
  <offers>
    <offer sku="TEST001" group1="ТЕСТ" group2="КАТЕГОРИЯ">
      <name>Тестовый товар</name>
      <ostatok>100</ostatok>
      <price>1000</price>
    </offer>
    <offer sku="TEST002" group1="НАПИТКИ" group2="БЕЗАЛКОГОЛЬНЫЕ">
      <name>Кока-кола 0.5л</name>
      <ostatok>50</ostatok>
      <price>350</price>
    </offer>
  </offers>
</catalog>`

        fs.writeFileSync(path.join(ftpDir, "test-products.xml"), testXml)
        console.log("Создан тестовый XML файл")
      } catch (createError) {
        console.error("Ошибка создания директории:", createError)
        return NextResponse.json(
          {
            success: false,
            message: "FTP директория не найдена и не может быть создана",
            error: (createError as Error).message,
            searchedPaths: possiblePaths,
          },
          { status: 500 },
        )
      }
    }

    // Читаем файлы в директории
    let files: string[] = []
    try {
      files = fs.readdirSync(ftpDir)
      console.log(`Файлы в директории ${ftpDir}:`, files)
    } catch (readError) {
      console.error("Ошибка чтения директории:", readError)
      return NextResponse.json(
        {
          success: false,
          message: "Не удается прочитать FTP директорию",
          error: (readError as Error).message,
          directory: ftpDir,
        },
        { status: 500 },
      )
    }

    const xmlFiles = files.filter((file) => file.toLowerCase().endsWith(".xml") && !file.startsWith("processed_"))

    if (xmlFiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: "XML файлы для обработки не найдены",
        processed: 0,
        directory: ftpDir,
        allFiles: files,
        updated: false,
      })
    }

    console.log(`Найдено ${xmlFiles.length} XML файлов:`, xmlFiles)

    let totalProcessed = 0
    let totalErrors = 0

    // Обрабатываем каждый файл
    for (const file of xmlFiles) {
      const filePath = path.join(ftpDir, file)

      try {
        console.log(`Обработка файла: ${file}`)

        const xmlContent = fs.readFileSync(filePath, "utf8")
        const products = parseXML(xmlContent)

        console.log(`Найдено товаров в ${file}: ${products.length}`)

        if (products.length > 0) {
          const client = await pool.connect()

          try {
            await client.query("BEGIN")

            let updated = 0
            let errors = 0

            for (const product of products) {
              try {
                await client.query(
                  `
                  INSERT INTO products (sku, name, category1, category2, stock, price, updated_at)
                  VALUES ($1, $2, $3, $4, $5, $6, NOW())
                  ON CONFLICT (sku) 
                  DO UPDATE SET 
                    name = EXCLUDED.name,
                    category1 = EXCLUDED.category1,
                    category2 = EXCLUDED.category2,
                    stock = EXCLUDED.stock,
                    price = EXCLUDED.price,
                    updated_at = NOW()
                `,
                  [product.sku, product.name, product.category1, product.category2, product.stock, product.price],
                )

                updated++
              } catch (error) {
                console.error(`Ошибка обновления товара ${product.sku}:`, error)
                errors++
              }
            }

            await client.query("COMMIT")
            totalProcessed += updated
            totalErrors += errors

            // Логирование
            try {
              await client.query(
                `
                INSERT INTO import_logs (filename, products_imported, status, error_message, created_at)
                VALUES ($1, $2, $3, $4, NOW())
              `,
                [file, updated, errors > 0 ? "partial" : "success", errors > 0 ? `Ошибок: ${errors}` : null],
              )
            } catch (logError) {
              console.error("Ошибка записи лога:", logError)
            }
          } catch (error) {
            await client.query("ROLLBACK")
            throw error
          } finally {
            client.release()
          }

          // Перемещаем обработанный файл
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
          const newFileName = `processed_${timestamp}_${file}`
          const newPath = path.join(ftpDir, newFileName)

          fs.renameSync(filePath, newPath)
          console.log(`Файл ${file} обработан и переименован в ${newFileName}`)
        }
      } catch (error) {
        console.error(`Ошибка обработки файла ${file}:`, error)
        totalErrors++
      }
    }

    // Получаем обновленный список товаров
    const client = await pool.connect()
    try {
      const result = await client.query("SELECT * FROM products ORDER BY updated_at DESC LIMIT 100")

      return NextResponse.json({
        success: true,
        message: `Обработано файлов: ${xmlFiles.length}, товаров: ${totalProcessed}`,
        processed: totalProcessed,
        errors: totalErrors,
        files: xmlFiles.length,
        directory: ftpDir,
        updated: true,
        count: totalProcessed,
        products: result.rows,
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Ошибка FTP синхронизации:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка синхронизации: " + (error as Error).message,
        error: (error as Error).stack,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    // Проверка статуса FTP
    const possiblePaths = [
      "/ftp-data/home/apelsin_xml/xml_uploads",
      "/opt/apelsin/ftp-data/home/apelsin_xml/xml_uploads",
      "/app/ftp-data/home/apelsin_xml/xml_uploads",
      "/var/ftp/apelsin_xml/xml_uploads",
      "/home/apelsin_xml/xml_uploads",
      "./ftp-data/home/apelsin_xml/xml_uploads",
    ]

    let ftpDir = ""
    let dirExists = false

    for (const dir of possiblePaths) {
      if (fs.existsSync(dir)) {
        ftpDir = dir
        dirExists = true
        break
      }
    }

    const status = {
      ftpDirExists: dirExists,
      xmlFiles: 0,
      processedFiles: 0,
      allFiles: [] as string[],
      directory: ftpDir,
      searchedPaths: possiblePaths,
    }

    if (dirExists) {
      try {
        const files = fs.readdirSync(ftpDir)
        status.allFiles = files
        status.xmlFiles = files.filter((f) => f.endsWith(".xml") && !f.startsWith("processed_")).length
        status.processedFiles = files.filter((f) => f.startsWith("processed_")).length
      } catch (readError) {
        console.error("Ошибка чтения FTP директории:", readError)
      }
    }

    return NextResponse.json({
      success: true,
      status,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
