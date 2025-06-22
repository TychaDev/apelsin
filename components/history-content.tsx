"use client"

import { useState } from "react"
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

  const historyOrders: HistoryOrder[] = [
    {
      id: "098",
      customer: "Айдар Нурланов",
      phone: "+7 777 123 45 67",
      total: 15500,
      payment: "Kaspi Bank",
      status: "completed",
      date: "2024-01-15",
      items: [
        { name: "Хлеб белый", quantity: 2, price: 300 },
        { name: "Молоко 1л", quantity: 3, price: 500 },
      ],
    },
    {
      id: "097",
      customer: "Айдар Нурланов",
      phone: "+7 777 123 45 67",
      total: 8750,
      payment: "Halyk Bank",
      status: "completed",
      date: "2024-01-10",
      items: [{ name: "Масло подсолнечное", quantity: 1, price: 600 }],
    },
    {
      id: "096",
      customer: "Мария Петрова",
      phone: "+7 777 987 65 43",
      total: 12300,
      payment: "Наличные",
      status: "cancelled",
      date: "2024-01-08",
      items: [{ name: "Мясо говядина", quantity: 1, price: 2500 }],
    },
    {
      id: "095",
      customer: "Ержан Касымов",
      phone: "+7 777 555 44 33",
      total: 5600,
      payment: "Kaspi Bank",
      status: "completed",
      date: "2024-01-05",
      items: [{ name: "Картофель 1кг", quantity: 3, price: 200 }],
    },
  ]

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

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 glow-text">{t("nav.history")}</h1>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по телефону или имени..."
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            className="pl-10 glow-effect"
          />
        </div>
      </div>

      <Card className="glow-effect">
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
        </CardContent>
      </Card>
    </div>
  )
}
