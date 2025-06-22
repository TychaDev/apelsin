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
  customer: string
  phone: string
  total: number
  payment: "Halyk Bank" | "Kaspi Bank" | "Наличные"
  status: "completed" | "cancelled"
  date: string
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
        setHistoryOrders(data.orders)
      }
    } catch (error) {
      console.error("Ошибка загрузки истории:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = historyOrders.filter(
    (order) => order.phone.includes(searchPhone) || order.customer.toLowerCase().includes(searchPhone.toLowerCase()),
  )

  const getStatusBadge = (status: HistoryOrder["status"]) => {
    return status === "completed" ? (
      <Badge className="bg-green-600">Выполнен</Badge>
    ) : (
      <Badge variant="destructive">Отменен</Badge>
    )
  }

  const getPaymentBadge = (payment: HistoryOrder["payment"]) => {
    const colors = {
      "Kaspi Bank": "bg-red-600",
      "Halyk Bank": "bg-blue-600",
      Наличные: "bg-green-600",
    }

    return <Badge className={`${colors[payment]} text-white`}>{payment}</Badge>
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
                  <TableCell>{new Date(order.date).toLocaleDateString("ru-RU")}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.phone}</TableCell>
                  <TableCell>{order.total.toLocaleString()} ₸</TableCell>
                  <TableCell>{getPaymentBadge(order.payment)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      {order.items.map((item, index) => (
                        <div key={index}>
                          {item.name} x{item.quantity}
                        </div>
                      ))}
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
