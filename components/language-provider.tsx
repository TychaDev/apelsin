"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type Language = "ru" | "en" | "kz"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  ru: {
    // Auth
    "auth.title": "Вход в систему",
    "auth.email": "Email",
    "auth.password": "Пароль",
    "auth.login": "Войти",
    "auth.error": "Неверный email или пароль",

    // Navigation
    "nav.dashboard": "Панель управления",
    "nav.orders": "Заказы",
    "nav.products": "Товары",
    "nav.history": "История заказов",
    "nav.settings": "Настройки",
    "nav.logout": "Выйти",

    // Dashboard
    "dashboard.title": "Панель управления",
    "dashboard.totalOrders": "Всего заказов",
    "dashboard.activeOrders": "Активные заказы",
    "dashboard.totalProducts": "Товаров в базе",
    "dashboard.revenue": "Выручка за месяц",

    // Orders
    "orders.title": "Управление заказами",
    "orders.id": "ID заказа",
    "orders.customer": "Клиент",
    "orders.phone": "Телефон",
    "orders.total": "Сумма",
    "orders.payment": "Оплата",
    "orders.status": "Статус",
    "orders.actions": "Действия",
    "orders.status.assembly": "В сборке",
    "orders.status.waiting": "Ожидание курьера",
    "orders.status.delivery": "Курьер в пути",
    "orders.status.completed": "Выполнен",
    "orders.status.cancelled": "Отменен",

    // Products
    "products.title": "Управление товарами",
    "products.loadXml": "Загрузить XML",
    "products.search": "Поиск товаров...",
    "products.name": "Название",
    "products.category": "Категория",
    "products.price": "Цена",
    "products.stock": "Остаток",
    "products.actions": "Действия",
    "products.edit": "Редактировать",
    "products.addImage": "Добавить фото",
    "products.description": "Описание",

    // Settings
    "settings.title": "Настройки",
    "settings.adminPassword": "Пароль администратора",
    "settings.profile": "Профиль",
    "settings.name": "Имя",
    "settings.email": "Email",
    "settings.password": "Пароль",
    "settings.save": "Сохранить",
    "settings.ftp": "FTP настройки",
    "settings.ftpHost": "FTP хост",
    "settings.ftpUser": "FTP пользователь",
    "settings.ftpPassword": "FTP пароль",

    // Common
    "common.loading": "Загрузка...",
    "common.save": "Сохранить",
    "common.cancel": "Отмена",
    "common.delete": "Удалить",
    "common.edit": "Редактировать",
    "common.search": "Поиск",
    "common.currency": "₸",
  },
  en: {
    // Auth
    "auth.title": "System Login",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.login": "Login",
    "auth.error": "Invalid email or password",

    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.orders": "Orders",
    "nav.products": "Products",
    "nav.history": "Order History",
    "nav.settings": "Settings",
    "nav.logout": "Logout",

    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.totalOrders": "Total Orders",
    "dashboard.activeOrders": "Active Orders",
    "dashboard.totalProducts": "Products in Database",
    "dashboard.revenue": "Monthly Revenue",

    // Orders
    "orders.title": "Order Management",
    "orders.id": "Order ID",
    "orders.customer": "Customer",
    "orders.phone": "Phone",
    "orders.total": "Total",
    "orders.payment": "Payment",
    "orders.status": "Status",
    "orders.actions": "Actions",
    "orders.status.assembly": "Assembly",
    "orders.status.waiting": "Waiting Courier",
    "orders.status.delivery": "In Delivery",
    "orders.status.completed": "Completed",
    "orders.status.cancelled": "Cancelled",

    // Products
    "products.title": "Product Management",
    "products.loadXml": "Load XML",
    "products.search": "Search products...",
    "products.name": "Name",
    "products.category": "Category",
    "products.price": "Price",
    "products.stock": "Stock",
    "products.actions": "Actions",
    "products.edit": "Edit",
    "products.addImage": "Add Photo",
    "products.description": "Description",

    // Settings
    "settings.title": "Settings",
    "settings.adminPassword": "Admin Password",
    "settings.profile": "Profile",
    "settings.name": "Name",
    "settings.email": "Email",
    "settings.password": "Password",
    "settings.save": "Save",
    "settings.ftp": "FTP Settings",
    "settings.ftpHost": "FTP Host",
    "settings.ftpUser": "FTP User",
    "settings.ftpPassword": "FTP Password",

    // Common
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.search": "Search",
    "common.currency": "₸",
  },
  kz: {
    // Auth
    "auth.title": "Жүйеге кіру",
    "auth.email": "Email",
    "auth.password": "Құпия сөз",
    "auth.login": "Кіру",
    "auth.error": "Email немесе құпия сөз қате",

    // Navigation
    "nav.dashboard": "Басқару панелі",
    "nav.orders": "Тапсырыстар",
    "nav.products": "Тауарлар",
    "nav.history": "Тапсырыстар тарихы",
    "nav.settings": "Баптаулар",
    "nav.logout": "Шығу",

    // Dashboard
    "dashboard.title": "Басқару панелі",
    "dashboard.totalOrders": "Барлық тапсырыстар",
    "dashboard.activeOrders": "Белсенді тапсырыстар",
    "dashboard.totalProducts": "Базадағы тауарлар",
    "dashboard.revenue": "Айлық кіріс",

    // Orders
    "orders.title": "Тапсырыстарды басқару",
    "orders.id": "Тапсырыс ID",
    "orders.customer": "Клиент",
    "orders.phone": "Телефон",
    "orders.total": "Сома",
    "orders.payment": "Төлем",
    "orders.status": "Мәртебе",
    "orders.actions": "Әрекеттер",
    "orders.status.assembly": "Жинауда",
    "orders.status.waiting": "Курьерді күту",
    "orders.status.delivery": "Жеткізуде",
    "orders.status.completed": "Орындалды",
    "orders.status.cancelled": "Бас тартылды",

    // Products
    "products.title": "Тауарларды басқару",
    "products.loadXml": "XML жүктеу",
    "products.search": "Тауарларды іздеу...",
    "products.name": "Атауы",
    "products.category": "Санат",
    "products.price": "Бағасы",
    "products.stock": "Қалдық",
    "products.actions": "Әрекеттер",
    "products.edit": "Өңдеу",
    "products.addImage": "Сурет қосу",
    "products.description": "Сипаттама",

    // Settings
    "settings.title": "Баптаулар",
    "settings.adminPassword": "Әкімші құпия сөзі",
    "settings.profile": "Профиль",
    "settings.name": "Аты",
    "settings.email": "Email",
    "settings.password": "Құпия сөз",
    "settings.save": "Сақтау",
    "settings.ftp": "FTP баптаулары",
    "settings.ftpHost": "FTP хост",
    "settings.ftpUser": "FTP пайдаланушы",
    "settings.ftpPassword": "FTP құпия сөз",

    // Common
    "common.loading": "Жүктелуде...",
    "common.save": "Сақтау",
    "common.cancel": "Бас тарту",
    "common.delete": "Жою",
    "common.edit": "Өңдеу",
    "common.search": "Іздеу",
    "common.currency": "₸",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("ru")

  const t = (key: string): string => {
    return translations[language][key as keyof (typeof translations)[typeof language]] || key
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
