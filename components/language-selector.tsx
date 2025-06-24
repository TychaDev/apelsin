"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/components/language-provider"
import { Languages } from "lucide-react"
import type { Language } from "@/lib/translations"

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  const languages: { code: Language; name: string }[] = [
    { code: "ru", name: "Русский" },
    { code: "en", name: "English" },
    { code: "kk", name: "Қазақша" },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="border-red-800/30 hover:border-red-600/50 hover:bg-red-900/20">
          <Languages className="h-4 w-4 mr-2" />
          {languages.find((l) => l.code === language)?.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={language === lang.code ? "bg-red-600/20" : ""}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
