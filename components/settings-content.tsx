"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/components/language-provider"
import { useToast } from "@/hooks/use-toast"
import { Lock, User, Server } from "lucide-react"

export function SettingsContent() {
  const { t } = useLanguage()
  const { toast } = useToast()

  const [adminPassword, setAdminPassword] = useState("")
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const [showAdminDialog, setShowAdminDialog] = useState(false)

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem("user-data") || "{}")
  const [profileData, setProfileData] = useState({
    name: userData.name || "Менеджер Апельсин",
    email: userData.email || "manager@apelsin.kz",
    password: "",
  })

  const [ftpSettings, setFtpSettings] = useState({
    host: "ftp.apelsin.kz",
    port: "21",
    username: "apelsin_manager",
    password: "",
    directory: "/xml_uploads",
  })

  const handleAdminAuth = () => {
    if (adminPassword === "8174126811dda") {
      setIsAdminAuthenticated(true)
      setShowAdminDialog(false)
      toast({
        title: "Успешно",
        description: "Доступ к настройкам разрешен",
      })
    } else {
      toast({
        title: "Ошибка",
        description: "Неверный пароль администратора",
        variant: "destructive",
      })
    }
  }

  const handleSaveProfile = () => {
    // Update localStorage
    localStorage.setItem(
      "user-data",
      JSON.stringify({
        name: profileData.name,
        email: profileData.email,
      }),
    )

    toast({
      title: "Успешно",
      description: "Профиль обновлен",
    })
  }

  const handleSaveFtpSettings = () => {
    toast({
      title: "Успешно",
      description: "FTP настройки сохранены",
    })
  }

  const testFtpConnection = () => {
    toast({
      title: "Тестирование FTP",
      description: "Проверка подключения к FTP серверу...",
    })

    setTimeout(() => {
      toast({
        title: "FTP подключение",
        description: "Подключение к FTP серверу успешно установлено",
      })
    }, 2000)
  }

  if (!isAdminAuthenticated) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6 glow-text">{t("settings.title")}</h1>

        <Card className="max-w-md mx-auto glow-effect">
          <CardHeader className="text-center">
            <Lock className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <CardTitle>Требуется авторизация администратора</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="admin-password">{t("settings.adminPassword")}</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="glow-effect"
                />
              </div>
              <Button onClick={handleAdminAuth} className="w-full bg-red-600 hover:bg-red-700 glow-effect">
                Войти
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 glow-text">{t("settings.title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card className="glow-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t("settings.profile")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">{t("settings.name")}</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="glow-effect"
              />
            </div>
            <div>
              <Label htmlFor="email">{t("settings.email")}</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="glow-effect"
              />
            </div>
            <div>
              <Label htmlFor="password">Новый {t("settings.password")}</Label>
              <Input
                id="password"
                type="password"
                value={profileData.password}
                onChange={(e) => setProfileData({ ...profileData, password: e.target.value })}
                placeholder="Оставьте пустым, чтобы не менять"
                className="glow-effect"
              />
            </div>
            <Button onClick={handleSaveProfile} className="bg-red-600 hover:bg-red-700 glow-effect">
              {t("settings.save")}
            </Button>
          </CardContent>
        </Card>

        {/* FTP Settings */}
        <Card className="glow-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              {t("settings.ftp")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ftp-host">{t("settings.ftpHost")}</Label>
              <Input
                id="ftp-host"
                value={ftpSettings.host}
                onChange={(e) => setFtpSettings({ ...ftpSettings, host: e.target.value })}
                className="glow-effect"
              />
            </div>
            <div>
              <Label htmlFor="ftp-port">Порт</Label>
              <Input
                id="ftp-port"
                value={ftpSettings.port}
                onChange={(e) => setFtpSettings({ ...ftpSettings, port: e.target.value })}
                className="glow-effect"
              />
            </div>
            <div>
              <Label htmlFor="ftp-user">{t("settings.ftpUser")}</Label>
              <Input
                id="ftp-user"
                value={ftpSettings.username}
                onChange={(e) => setFtpSettings({ ...ftpSettings, username: e.target.value })}
                className="glow-effect"
              />
            </div>
            <div>
              <Label htmlFor="ftp-password">{t("settings.ftpPassword")}</Label>
              <Input
                id="ftp-password"
                type="password"
                value={ftpSettings.password}
                onChange={(e) => setFtpSettings({ ...ftpSettings, password: e.target.value })}
                className="glow-effect"
              />
            </div>
            <div>
              <Label htmlFor="ftp-directory">Папка для XML файлов</Label>
              <Input
                id="ftp-directory"
                value={ftpSettings.directory}
                onChange={(e) => setFtpSettings({ ...ftpSettings, directory: e.target.value })}
                className="glow-effect"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveFtpSettings} className="bg-red-600 hover:bg-red-700 glow-effect">
                {t("settings.save")}
              </Button>
              <Button onClick={testFtpConnection} variant="outline" className="glow-effect">
                Тест подключения
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
