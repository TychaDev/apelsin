"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  ShoppingCart,
  Package,
  TrendingUp,
  Clock,
  RefreshCw,
  Database,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

interface DashboardStats {
  totalOrders: number
  activeOrders: number
  totalRevenue: number
  totalProducts: number
  totalStock: number
  inStockProducts: number
  outOfStockProducts: number
  totalImports: number
  totalImportedProducts: number
  lastImport: string | null
}

export function DashboardContent() {
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    activeOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalStock: 0,
    inStockProducts: 0,
    outOfStockProducts: 0,
    totalImports: 0,
    totalImportedProducts: 0,
    lastImport: null,
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchStats = async () => {
    try {
      console.log("Fetching dashboard stats...")
      const response = await fetch("/api/dashboard/stats")
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
        setLastUpdate(new Date())
        console.log("Dashboard stats updated:", data.stats)
      } else {
        console.error("Failed to fetch stats:", data.error)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить статистику",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    await fetchStats()
    toast({
      title: "Обновлено",
      description: "Статистика обновлена",
    })
  }

  useEffect(() => {
    fetchStats()

    // Автообновление каждые 30 секунд
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatNumber = (num: number): string => {
    return num.toLocaleString()
  }

  const formatCurrency = (amount: number): string => {
    return `${amount.toLocaleString()} ₸`
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "Никогда"
    return new Date(dateString).toLocaleString("ru-RU")
  }

  if (loading && stats.totalOrders === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-red-400" />
            <p className="text-muted-foreground">Загрузка статистики...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold elegant-text">Панель управления</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">Обновлено: {lastUpdate.toLocaleTimeString("ru-RU")}</div>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Обновить
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Заказы */}
        <Card className="elegant-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего заказов</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalOrders)}</div>
            <p className="text-xs text-muted-foreground">
              Активных: <Badge variant="secondary">{formatNumber(stats.activeOrders)}</Badge>
            </p>
          </CardContent>
        </Card>

        {/* Товары */}
        <Card className="elegant-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего товаров</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalProducts)}</div>
            <p className="text-xs text-muted-foreground">
              Общий остаток: <Badge variant="outline">{formatNumber(stats.totalStock)}</Badge>
            </p>
          </CardContent>
        </Card>

        {/* Выручка */}
        <Card className="elegant-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выручка</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">За все время</p>
          </CardContent>
        </Card>

        {/* Импорты */}
        <Card className="elegant-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Импорты (24ч)</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalImports)}</div>
            <p className="text-xs text-muted-foreground">
              Товаров: <Badge variant="secondary">{formatNumber(stats.totalImportedProducts)}</Badge>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Детальная статистика */}
      <div className="grid gap-6 md:grid-cols-2 mt-6">
        {/* Статистика товаров */}
        <Card className="elegant-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Статистика товаров
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-sm">В наличии</span>
              </div>
              <Badge variant="secondary">{formatNumber(stats.inStockProducts)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="text-sm">Нет в наличии</span>
              </div>
              <Badge variant="destructive">{formatNumber(stats.outOfStockProducts)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-400" />
                <span className="text-sm">Общий остаток</span>
              </div>
              <Badge variant="outline">{formatNumber(stats.totalStock)} шт</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Последние импорты */}
        <Card className="elegant-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Импорт данных
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Последний импорт</span>
              </div>
              <div className="text-sm text-muted-foreground">{formatDate(stats.lastImport)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-green-400" />
                <span className="text-sm">Импортов за 24ч</span>
              </div>
              <Badge variant="secondary">{formatNumber(stats.totalImports)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-400" />
                <span className="text-sm">Товаров импортировано</span>
              </div>
              <Badge variant="outline">{formatNumber(stats.totalImportedProducts)}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
