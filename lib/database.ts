import { Pool } from "pg"

let pool: Pool

function createPool() {
  if (!pool) {
    console.log("Creating new database pool...")

    const connectionString = process.env.DATABASE_URL
    console.log("Database URL exists:", !!connectionString)

    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set")
    }

    pool = new Pool({
      connectionString,
      ssl: false, // Отключаем SSL для локального Docker
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })

    pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err)
    })

    console.log("Database pool created successfully")
  }
  return pool
}

export async function query(text: string, params?: any[]) {
  const client = await createPool().connect()
  try {
    console.log("Executing query:", text.substring(0, 50) + "...")
    const result = await client.query(text, params)
    console.log("Query executed successfully, rows:", result.rows.length)
    return result
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  } finally {
    client.release()
  }
}

export { pool }
