"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import { LanguageSelector } from "@/components/language-selector"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface LoginFormProps {
  onLogin: () => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useLanguage()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate authentication
    setTimeout(() => {
      if (email === "manager@apelsin.kz" && password === "manager123") {
        localStorage.setItem("auth-token", "authenticated")
        localStorage.setItem(
          "user-data",
          JSON.stringify({
            name: "Менеджер Апельсин",
            email: "manager@apelsin.kz",
          }),
        )
        onLogin()
      } else {
        toast({
          title: "Ошибка",
          description: t("auth.error"),
          variant: "destructive",
        })
      }
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>

      <Card className="w-full max-w-md elegant-card fade-in-up">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="Апельсин" width={80} height={80} className="rounded-full" />
          </div>
          <CardTitle className="text-2xl font-bold elegant-text">Апельсин</CardTitle>
          <CardDescription>{t("auth.title")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="elegant-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="elegant-input"
              />
            </div>
            <Button type="submit" className="w-full elegant-button" disabled={isLoading}>
              {isLoading ? t("common.loading") : t("auth.login")}
            </Button>
          </form>
          <div className="mt-4 text-xs text-muted-foreground text-center">Demo: manager@apelsin.kz / manager123</div>
        </CardContent>
      </Card>
    </div>
  )
}
