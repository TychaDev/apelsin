"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface LanguageContextType {
  language: string
  setLanguage: (lang: string) => void
  t: (key: string, fallback?: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations = {
  ru: {
    "login.title": "Апельсин",
    "login.subtitle": "Система управления доставкой",
    "login.email": "Email",
    "login.password": "Пароль",
    "login.submit": "Войти",
    "login.loading": "Вход...",
    "login.emailPlaceholder": "manager@apelsin.kz",
    "login.passwordPlaceholder": "Введите пароль",
    "nav.dashboard": "Панель управления",
    "nav.orders": "Заказы",
    "nav.products": "Товары",
    "nav.history": "История",
    "nav.settings": "Настройки",
    "nav.logout": "Выход",
  },
  en: {
    "login.title": "Orange",
    "login.subtitle": "Delivery Management System",
    "login.email": "Email",
    "login.password": "Password",
    "login.submit": "Login",
    "login.loading": "Logging in...",
    "login.emailPlaceholder": "manager@apelsin.kz",
    "login.passwordPlaceholder": "Enter password",
    "nav.dashboard": "Dashboard",
    "nav.orders": "Orders",
    "nav.products": "Products",
    "nav.history": "History",
    "nav.settings": "Settings",
    "nav.logout": "Logout",
  },
  kk: {
    "login.title": "Апельсин",
    "login.subtitle": "Жеткізу басқару жүйесі",
    "login.email": "Email",
    "login.password": "Құпия сөз",
    "login.submit": "Кіру",
    "login.loading": "Кіру...",
    "login.emailPlaceholder": "manager@apelsin.kz",
    "login.passwordPlaceholder": "Құпия сөзді енгізіңіз",
    "nav.dashboard": "Басқару панелі",
    "nav.orders": "Тапсырыстар",
    "nav.products": "Тауарлар",
    "nav.history": "Тарих",
    "nav.settings": "Баптаулар",
    "nav.logout": "Шығу",
  },
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState("ru")

  const t = (key: string, fallback?: string) => {
    const translation = translations[language as keyof typeof translations]?.[key as keyof typeof translation]
    return translation || fallback || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
