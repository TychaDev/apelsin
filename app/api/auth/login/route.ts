import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { verifyPassword, generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("Login attempt started")

    const { email, password } = await request.json()
    console.log("Login data received:", { email, password: "***" })

    if (!email || !password) {
      console.log("Missing email or password")
      return NextResponse.json({ error: "Email и пароль обязательны" }, { status: 400 })
    }

    // Проверяем подключение к базе данных
    try {
      console.log("Testing database connection...")
      await query("SELECT 1")
      console.log("Database connection successful")
    } catch (dbError) {
      console.error("Database connection failed:", dbError)
      return NextResponse.json({ error: "Ошибка подключения к базе данных" }, { status: 500 })
    }

    // Поиск пользователя в базе данных
    console.log("Searching for user:", email)
    const result = await query("SELECT * FROM users WHERE email = $1", [email])
    console.log("User search result:", result.rows.length > 0 ? "found" : "not found")

    if (result.rows.length === 0) {
      console.log("User not found, returning error")
      return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 })
    }

    const user = result.rows[0]
    console.log("User found:", { id: user.id, email: user.email, role: user.role })

    // Проверка пароля
    console.log("Verifying password...")
    const isValidPassword = await verifyPassword(password, user.password_hash)
    console.log("Password verification result:", isValidPassword)

    if (!isValidPassword) {
      console.log("Invalid password")
      return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 })
    }

    // Генерация токена
    console.log("Generating token...")
    const token = generateToken(user.id, user.email)
    console.log("Token generated successfully")

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Login error details:", error)
    return NextResponse.json(
      {
        error: "Внутренняя ошибка сервера",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
