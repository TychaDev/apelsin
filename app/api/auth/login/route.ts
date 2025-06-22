import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { verifyPassword, generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email и пароль обязательны" }, { status: 400 })
    }

    // Поиск пользователя в базе данных
    const result = await query("SELECT * FROM users WHERE email = $1", [email])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 })
    }

    const user = result.rows[0]
    const isValidPassword = await verifyPassword(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 })
    }

    const token = generateToken(user.id, user.email)

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
    console.error("Login error:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}
