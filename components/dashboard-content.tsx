"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import { ShoppingCart, Package, TrendingUp, Users } from "lucide-react"

interface DashboardStats {
  totalOrders: number
  activeOrders: number
  totalProducts: number
  revenue: number
}

interface RecentOrder {
  id: string
  phone: string
  total: number
  status: string
}

interface PopularProduct {
  name: string
  sales: number
  revenue: number
}

export function DashboardContent() {
  const { t } = useLanguage()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [popularProducts, setPopularProducts] = useState<PopularProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setRecentOrders(data.recentOrders)
        setPopularProducts(data.popularProducts)
      }
    } catch (error) {
      console.error("Ошибка загрузки данных:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 glow-text">{t("dashboard.title")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="stats-card fade-in-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Всего заказов</CardTitle>
            <ShoppingCart className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalOrders || 0}</div>
          </CardContent>
        </Card>

        <Card className="stats-card fade-in-up" style={{ animationDelay: "0.1s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Активные заказы</CardTitle>
            <Users className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.activeOrders || 0}</div>
          </CardContent>
        </Card>

        <Card className="stats-card fade-in-up" style={{ animationDelay: "0.2s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Всего товаров</CardTitle>
            <Package className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalProducts || 0}</div>
          </CardContent>
        </Card>

        <Card className="stats-card fade-in-up" style={{ animationDelay: "0.3s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Выручка</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.revenue?.toLocaleString() || 0} ₸</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="elegant-card">
          <CardHeader>
            <CardTitle className="elegant-text">Последние заказы</CardTitle>
            <CardDescription>Недавние заказы в системе</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Заказ #{order.id}</p>
                      <p className="text-sm text-muted-foreground">{order.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{order.total.toLocaleString()} ₸</p>
                      <p className="text-sm text-green-600">{order.status}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">Нет данных</p>
              )}
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
              {popularProducts.length > 0 ? (
                popularProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.sales} продаж</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{product.revenue.toLocaleString()} ₸</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">Нет данных</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
