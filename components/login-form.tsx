"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LanguageSelector } from "@/components/language-selector"
import { useLanguage } from "@/components/language-provider"
import Image from "next/image"

interface LoginFormProps {
  onLogin: () => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("auth-token", data.token)
        localStorage.setItem("user-data", JSON.stringify(data.user))
        onLogin()
      } else {
        setError(data.error || "Ошибка входа")
      }
    } catch (error) {
      setError("Ошибка подключения к серверу")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-transparent to-red-900/10"></div>

      <Card className="w-full max-w-md mx-4 bg-gray-900/90 border-gray-700 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative w-16 h-16">
              <Image src="/logo.png" alt="Апельсин" fill className="object-contain" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">{t("login.title", "Апельсин")}</CardTitle>
          <CardDescription className="text-gray-400">
            {t("login.subtitle", "Система управления доставкой")}
          </CardDescription>
          <div className="flex justify-center mt-4">
            <LanguageSelector />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                {t("login.email", "Email")}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-800 border-gray-600 text-white focus:border-red-500"
                placeholder={t("login.emailPlaceholder", "manager@apelsin.kz")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                {t("login.password", "Пароль")}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-800 border-gray-600 text-white focus:border-red-500"
                placeholder={t("login.passwordPlaceholder", "Введите пароль")}
              />
            </div>
            {error && (
              <Alert className="bg-red-900/50 border-red-700">
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
              disabled={isLoading}
            >
              {isLoading ? t("login.loading", "Вход...") : t("login.submit", "Войти")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
