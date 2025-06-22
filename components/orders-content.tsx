"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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

  const [orders, setOrders] = useState<Order[]>([
    {
      id: "001",
      customer: "Айдар Нурланов",
      phone: "+7 777 123 45 67",
      total: 15500,
      payment: "Kaspi Bank",
      status: "assembly",
      items: [
        { name: "Хлеб белый", quantity: 2, price: 300 },
        { name: "Молоко 1л", quantity: 3, price: 500 },
        { name: "Яйца С1 10шт", quantity: 1, price: 600 },
      ],
    },
    {
      id: "002",
      customer: "Мария Петрова",
      phone: "+7 777 987 65 43",
      total: 8750,
      payment: "Halyk Bank",
      status: "waiting",
      items: [
        { name: "Масло подсолнечное", quantity: 1, price: 600 },
        { name: "Сахар 1кг", quantity: 2, price: 500 },
      ],
    },
    {
      id: "003",
      customer: "Ержан Касымов",
      phone: "+7 777 555 44 33",
      total: 12300,
      payment: "Наличные",
      status: "delivery",
      items: [
        { name: "Мясо говядина", quantity: 1, price: 2500 },
        { name: "Картофель 1кг", quantity: 3, price: 200 },
      ],
    },
  ])

  const updateOrderStatus = (orderId: string, newStatus: Order["status"]) => {
    setOrders(orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
  }

  const getStatusBadge = (status: Order["status"]) => {
    const statusConfig = {
      assembly: { label: t("orders.status.assembly"), className: "status-badge status-assembly" },
      waiting: { label: t("orders.status.waiting"), className: "status-badge status-waiting" },
      delivery: { label: t("orders.status.delivery"), className: "status-badge status-delivery" },
      completed: { label: t("orders.status.completed"), className: "status-badge status-completed" },
      cancelled: { label: t("orders.status.cancelled"), className: "status-badge status-cancelled" },
    }

    const config = statusConfig[status]
    return <span className={config.className}>{config.label}</span>
  }

  const getPaymentBadge = (payment: Order["payment"]) => {
    const paymentConfig = {
      "Kaspi Bank": "status-badge payment-kaspi",
      "Halyk Bank": "status-badge payment-halyk",
      Наличные: "status-badge payment-cash",
    }

    return <span className={paymentConfig[payment]}>{payment}</span>
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 glow-text">{t("orders.title")}</h1>

      <Card className="elegant-card">
        <CardHeader>
          <CardTitle>Активные заказы</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("orders.id")}</TableHead>
                <TableHead>{t("orders.customer")}</TableHead>
                <TableHead>{t("orders.phone")}</TableHead>
                <TableHead>{t("orders.total")}</TableHead>
                <TableHead>{t("orders.payment")}</TableHead>
                <TableHead>{t("orders.status")}</TableHead>
                <TableHead>{t("orders.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders
                .filter((order) => !["completed", "cancelled"].includes(order.status))
                .map((order) => (
                  <TableRow key={order.id} className="table-row-hover">
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{order.phone}</TableCell>
                    <TableCell>{order.total.toLocaleString()} ₸</TableCell>
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
                          <SelectItem value="assembly">{t("orders.status.assembly")}</SelectItem>
                          <SelectItem value="waiting">{t("orders.status.waiting")}</SelectItem>
                          <SelectItem value="delivery">{t("orders.status.delivery")}</SelectItem>
                          <SelectItem value="completed">{t("orders.status.completed")}</SelectItem>
                          <SelectItem value="cancelled">{t("orders.status.cancelled")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
