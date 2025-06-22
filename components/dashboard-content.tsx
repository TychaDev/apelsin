"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import { ShoppingCart, Package, TrendingUp, Users } from "lucide-react"

export function DashboardContent() {
  const { t } = useLanguage()

  const stats = [
    {
      title: t("dashboard.totalOrders"),
      value: "1,234",
      icon: ShoppingCart,
      change: "+12%",
    },
    {
      title: t("dashboard.activeOrders"),
      value: "23",
      icon: Users,
      change: "+5%",
    },
    {
      title: t("dashboard.totalProducts"),
      value: "5,678",
      icon: Package,
      change: "+8%",
    },
    {
      title: t("dashboard.revenue"),
      value: "2,450,000 ₸",
      icon: TrendingUp,
      change: "+15%",
    },
  ]

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 glow-text">{t("dashboard.title")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="stats-card fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <p className="text-xs text-green-400">{stat.change} от прошлого месяца</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="elegant-card">
          <CardHeader>
            <CardTitle className="elegant-text">Последние заказы</CardTitle>
            <CardDescription>Недавние заказы в системе</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((order) => (
                <div key={order} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Заказ #{order}001</p>
                    <p className="text-sm text-muted-foreground">+7 777 123 45 67</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">15,500 ₸</p>
                    <p className="text-sm text-green-600">В сборке</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="elegant-card">
          <CardHeader>
            <CardTitle className="elegant-text">Популярные товары</CardTitle>
            <CardDescription>Топ продаж за неделю</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Хлеб белый", sales: 145, revenue: "43,500 ₸" },
                { name: "Молоко 1л", sales: 123, revenue: "61,500 ₸" },
                { name: "Яйца С1 10шт", sales: 98, revenue: "58,800 ₸" },
                { name: "Масло подсолнечное", sales: 87, revenue: "52,200 ₸" },
                { name: "Сахар 1кг", sales: 76, revenue: "38,000 ₸" },
              ].map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.sales} продаж</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{product.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
