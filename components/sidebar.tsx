"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { LanguageSelector } from "@/components/language-selector"
import { LayoutDashboard, ShoppingCart, Package, History, Settings, LogOut } from "lucide-react"
import Image from "next/image"

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  onLogout: () => void
}

export function Sidebar({ activeTab, setActiveTab, onLogout }: SidebarProps) {
  const { t } = useLanguage()

  const menuItems = [
    { id: "dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { id: "orders", label: t("nav.orders"), icon: ShoppingCart },
    { id: "products", label: t("nav.products"), icon: Package },
    { id: "history", label: t("nav.history"), icon: History },
    { id: "settings", label: t("nav.settings"), icon: Settings },
  ]

  const handleLogout = () => {
    localStorage.removeItem("auth-token")
    localStorage.removeItem("user-data")
    onLogout()
  }

  return (
    <div className="w-64 sidebar-gradient">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <Image src="/logo.png" alt="Апельсин" width={40} height={40} className="rounded-full" />
          <div>
            <h2 className="text-lg font-bold glow-text">Апельсин</h2>
            <p className="text-sm text-muted-foreground">Система доставки</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              className={`w-full justify-start transition-all duration-200 ${
                activeTab === item.id ? "elegant-button text-white" : "hover:bg-red-900/20 hover:text-red-300"
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          )
        })}
      </nav>

      <div className="absolute bottom-4 left-4 right-4 space-y-2">
        <LanguageSelector />
        <Button
          variant="outline"
          className="w-full justify-start hover:bg-red-900/20 border-red-800/30 hover:border-red-600/50"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("nav.logout")}
        </Button>
      </div>
    </div>
  )
}
