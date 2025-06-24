"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

interface Order {
  id: string
  customer: string
  phone: string
  total: number
  payment: "Halyk Bank" | "Kaspi Bank" | "Наличные"
  status: "assembly" | "waiting" | "delivery" | "completed" | "cancelled"
  items: Array<{ name: string; quantity: number; price: number }>
}

export function OrdersContent() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders")
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error("Ошибка загрузки заказов:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null || isNaN(num)) {
      return "0"
    }
    return num.toLocaleString()
  }

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const response = await fetch("/api/orders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      })

      if (response.ok) {
        setOrders(orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
        toast({
          title: "Успешно",
          description: "Статус заказа обновлен",
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус заказа",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: Order["status"]) => {
    const statusConfig = {
      assembly: { label: "В сборке", className: "status-badge status-assembly" },
      waiting: { label: "Ожидание курьера", className: "status-badge status-waiting" },
      delivery: { label: "Курьер в пути", className: "status-badge status-delivery" },
      completed: { label: "Выполнен", className: "status-badge status-completed" },
      cancelled: { label: "Отменен", className: "status-badge status-cancelled" },
    }

    const config = statusConfig[status] || { label: "Неизвестно", className: "status-badge" }
    return <span className={config.className}>{config.label}</span>
  }

  const getPaymentBadge = (payment: Order["payment"]) => {
    const paymentConfig = {
      "Kaspi Bank": "status-badge payment-kaspi",
      "Halyk Bank": "status-badge payment-halyk",
      Наличные: "status-badge payment-cash",
    }

    return <span className={paymentConfig[payment] || "status-badge"}>{payment || "Не указано"}</span>
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

  const activeOrders = orders.filter((order) => !["completed", "cancelled"].includes(order.status))

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 glow-text">Управление заказами</h1>

      <Card className="elegant-card">
        <CardHeader>
          <CardTitle>Активные заказы ({activeOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID заказа</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Оплата</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeOrders.map((order) => (
                <TableRow key={order.id} className="table-row-hover">
                  <TableCell className="font-medium">#{order.id || "N/A"}</TableCell>
                  <TableCell>{order.customer || "Не указан"}</TableCell>
                  <TableCell>{order.phone || "Не указан"}</TableCell>
                  <TableCell>{formatNumber(order.total)} ₸</TableCell>
                  <TableCell>{getPaymentBadge(order.payment)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(value) => updateOrderStatus(order.id, value as Order["status"])}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assembly">В сборке</SelectItem>
                        <SelectItem value="waiting">Ожидание курьера</SelectItem>
                        <SelectItem value="delivery">Курьер в пути</SelectItem>
                        <SelectItem value="completed">Выполнен</SelectItem>
                        <SelectItem value="cancelled">Отменен</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {activeOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">Нет активных заказов</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
