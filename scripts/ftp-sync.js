import { Client } from "basic-ftp"
import fs from "fs"
import path from "path"
import { DOMParser } from "xmldom"
import pkg from "pg"
const { Pool } = pkg

// Настройка подключения к базе данных
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

class FTPSync {
  constructor(config) {
    this.config = config
    this.client = new Client()
    this.tempDir = "./temp"

    // Создаем временную папку если её нет
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true })
    }
  }

  async connect() {
    try {
      await this.client.access({
        host: this.config.host,
        port: this.config.port || 21,
        user: this.config.username,
        password: this.config.password,
        secure: false,
      })
      console.log("✅ FTP подключение установлено")
      return true
    } catch (error) {
      console.error("❌ Ошибка подключения к FTP:", error.message)
      return false
    }
  }

  async checkForNewFiles() {
    try {
      const files = await this.client.list(this.config.directory || "/")
      const xmlFiles = files.filter(
        (file) => file.name.toLowerCase().endsWith(".xml") && file.type === 1 && !file.name.startsWith("processed_"),
      )

      console.log(`📁 Найдено ${xmlFiles.length} новых XML файлов`)
      return xmlFiles
    } catch (error) {
      console.error("❌ Ошибка получения списка файлов:", error.message)
      return []
    }
  }

  async downloadFile(filename) {
    try {
      const remotePath = `${this.config.directory}/${filename}`
      const localPath = path.join(this.tempDir, filename)

      await this.client.downloadTo(localPath, remotePath)
      console.log(`⬇️ Файл ${filename} загружен`)
      return localPath
    } catch (error) {
      console.error(`❌ Ошибка загрузки файла ${filename}:`, error.message)
      return null
    }
  }

  async parseXMLFile(filePath) {
    try {
      const xmlContent = fs.readFileSync(filePath, "utf8")
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml")

      const offers = xmlDoc.getElementsByTagName("offer")
      const products = []

      for (let i = 0; i < offers.length; i++) {
        const offer = offers[i]
        const sku = offer.getAttribute("sku")
        const group1 = offer.getAttribute("group1")
        const group2 = offer.getAttribute("group2")

        const name = offer.getElementsByTagName("name")[0]?.textContent
        const priceText = offer.getElementsByTagName("price")[0]?.textContent
        const stockText = offer.getElementsByTagName("ostatok")[0]?.textContent

        if (sku && name) {
          products.push({
            sku,
            name,
            category1: group1 || "",
            category2: group2 || "",
            price: Number.parseFloat(priceText?.replace(/\s/g, "") || "0"),
            stock: Number.parseFloat(stockText || "0"),
          })
        }
      }

      console.log(`📦 Обработано ${products.length} товаров из XML`)
      return products
    } catch (error) {
      console.error("❌ Ошибка парсинга XML:", error.message)
      return []
    }
  }

  async saveProductsToDatabase(products, filename) {
    const client = await pool.connect()

    try {
      await client.query("BEGIN")

      let importedCount = 0
      let errorCount = 0

      for (const product of products) {
        try {
          await client.query(
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
            [product.sku, product.name, product.category1, product.category2, product.price, product.stock],
          )

          importedCount++
        } catch (error) {
          console.error(`❌ Ошибка сохранения товара ${product.sku}:`, error.message)
          errorCount++
        }
      }

      // Логируем импорт
      await client.query(
        `
        INSERT INTO import_logs (filename, products_imported, status, error_message)
        VALUES ($1, $2, $3, $4)
      `,
        [
          filename,
          importedCount,
          errorCount > 0 ? "partial" : "success",
          errorCount > 0 ? `Ошибок: ${errorCount}` : null,
        ],
      )

      await client.query("COMMIT")
      console.log(`✅ Импортировано ${importedCount} товаров, ошибок: ${errorCount}`)

      return { imported: importedCount, errors: errorCount }
    } catch (error) {
      await client.query("ROLLBACK")
      console.error("❌ Ошибка сохранения в базу данных:", error.message)

      // Логируем ошибку
      await client.query(
        `
        INSERT INTO import_logs (filename, products_imported, status, error_message)
        VALUES ($1, $2, $3, $4)
      `,
        [filename, 0, "error", error.message],
      )

      throw error
    } finally {
      client.release()
    }
  }

  async moveProcessedFile(filename) {
    try {
      const oldPath = `${this.config.directory}/${filename}`
      const newPath = `${this.config.directory}/processed_${Date.now()}_${filename}`

      await this.client.rename(oldPath, newPath)
      console.log(`📁 Файл ${filename} перемещен в обработанные`)
    } catch (error) {
      console.error(`❌ Ошибка перемещения файла ${filename}:`, error.message)
    }
  }

  async syncProducts() {
    const connected = await this.connect()
    if (!connected) return false

    try {
      const files = await this.checkForNewFiles()

      for (const file of files) {
        console.log(`🔄 Обработка файла: ${file.name}`)

        const localPath = await this.downloadFile(file.name)
        if (localPath) {
          const products = await this.parseXMLFile(localPath)

          if (products.length > 0) {
            await this.saveProductsToDatabase(products, file.name)
            await this.moveProcessedFile(file.name)
          }

          // Удаляем временный файл
          fs.unlinkSync(localPath)
        }
      }

      return true
    } catch (error) {
      console.error("❌ Ошибка синхронизации:", error.message)
      return false
    } finally {
      this.client.close()
    }
  }
}

// Получение настроек FTP из базы данных
async function getFTPSettings() {
  try {
    const client = await pool.connect()
    const result = await client.query("SELECT * FROM ftp_settings ORDER BY id DESC LIMIT 1")
    client.release()

    if (result.rows.length > 0) {
      const settings = result.rows[0]
      return {
        host: settings.host,
        port: settings.port,
        username: settings.username,
        password: settings.password_encrypted, // В реальном проекте нужно расшифровать
        directory: settings.directory,
      }
    }
  } catch (error) {
    console.error("❌ Ошибка получения настроек FTP:", error.message)
  }

  // Настройки по умолчанию из переменных окружения
  return {
    host: process.env.FTP_HOST || "localhost",
    port: Number.parseInt(process.env.FTP_PORT) || 21,
    username: process.env.FTP_USER || "apelsin_ftp",
    password: process.env.FTP_PASSWORD || "",
    directory: process.env.FTP_DIRECTORY || "/xml_uploads",
  }
}

// Основная функция
async function main() {
  console.log("🚀 Запуск FTP синхронизации...")

  const ftpConfig = await getFTPSettings()
  const sync = new FTPSync(ftpConfig)

  await sync.syncProducts()

  console.log("✅ Синхронизация завершена")
}

// Запуск синхронизации каждые 5 минут
if (process.env.NODE_ENV === "production") {
  setInterval(main, 5 * 60 * 1000)
}

// Запуск при старте
main()

export default FTPSync
