"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { DashboardContent } from "@/components/dashboard-content"
import { OrdersContent } from "@/components/orders-content"
import { ProductsContent } from "@/components/products-content"
import { HistoryContent } from "@/components/history-content"
import { SettingsContent } from "@/components/settings-content"

interface DashboardProps {
  onLogout: () => void
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("dashboard")

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardContent />
      case "orders":
        return <OrdersContent />
      case "products":
        return <ProductsContent />
      case "history":
        return <HistoryContent />
      case "settings":
        return <SettingsContent />
      default:
        return <DashboardContent />
    }
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={onLogout} />
      <main className="flex-1 overflow-auto">{renderContent()}</main>
    </div>
  )
}
