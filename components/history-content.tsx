"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import { Search } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface HistoryOrder {
  id: string
  customer_name?: string
  customer_phone?: string
  total: number
  payment_method?: string
  status: "completed" | "cancelled"
  created_at: string
  items: Array<{ name: string; quantity: number; price: number }>
}

export function HistoryContent() {
  const { t } = useLanguage()
  const [searchPhone, setSearchPhone] = useState("")
  const [historyOrders, setHistoryOrders] = useState<HistoryOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/history")
      if (response.ok) {
        const data = await response.json()
        console.log("History data:", data)
        setHistoryOrders(data.orders || [])
      } else {
        console.error("Failed to fetch history:", response.status)
        setHistoryOrders([])
      }
    } catch (error) {
      console.error("Ошибка загрузки истории:", error)
      setHistoryOrders([])
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = historyOrders.filter((order) => {
    if (!order) return false

    const phone = order.customer_phone || ""
    const customer = order.customer_name || ""
    const search = searchPhone.toLowerCase()

    return phone.includes(searchPhone) || customer.toLowerCase().includes(search)
  })

  const getStatusBadge = (status: HistoryOrder["status"]) => {
    return status === "completed" ? (
      <Badge className="bg-green-600">Выполнен</Badge>
    ) : (
      <Badge variant="destructive">Отменен</Badge>
    )
  }

  const getPaymentBadge = (payment?: string) => {
    if (!payment) return <Badge variant="secondary">Не указано</Badge>

    const colors: Record<string, string> = {
      "Kaspi Bank": "bg-red-600",
      "Halyk Bank": "bg-blue-600",
      Наличные: "bg-green-600",
    }

    return <Badge className={`${colors[payment] || "bg-gray-600"} text-white`}>{payment}</Badge>
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-64"></div>
          <div className="h-96 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 glow-text">История заказов</h1>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по телефону или имени..."
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            className="pl-10 elegant-input"
          />
        </div>
      </div>

      <Card className="elegant-card">
        <CardHeader>
          <CardTitle>История заказов ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID заказа</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Оплата</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Товары</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>
                    {order.created_at ? new Date(order.created_at).toLocaleDateString("ru-RU") : "Не указана"}
                  </TableCell>
                  <TableCell>{order.customer_name || "Не указан"}</TableCell>
                  <TableCell>{order.customer_phone || "Не указан"}</TableCell>
                  <TableCell>{(order.total || 0).toLocaleString()} ₸</TableCell>
                  <TableCell>{getPaymentBadge(order.payment_method)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, index) => (
                          <div key={index}>
                            {item.name || "Неизвестный товар"} x{item.quantity || 0}
                          </div>
                        ))
                      ) : (
                        <div className="text-muted-foreground">Нет товаров</div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {historyOrders.length === 0 ? "Нет истории заказов" : "Заказы не найдены"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
