"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/components/language-provider"
import { useToast } from "@/hooks/use-toast"
import { Upload, Search, Edit, ImageIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Product {
  sku: string
  name: string
  category1: string
  category2: string
  price: number
  stock: number
  image?: string
  description?: string
}

export function ProductsContent() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ftpFileInputRef = useRef<HTMLInputElement>(null)

  const [products, setProducts] = useState<Product[]>([
    {
      sku: "4870145004999",
      name: '"Zatecky Gus" 0% Пиво ж/б светлое 0,43л',
      category1: "НАПИТКИ",
      category2: "АЛКОГОЛЬНЫЕ",
      price: 460,
      stock: 35,
    },
    {
      sku: "2501805990018",
      name: 'Бедро "Мадрид" соус по-испански "КусВкус"',
      category1: "ГАСТРОНОМИЯ",
      category2: "ПОЛУФАБРИКАТЫ/ЗАМОРОЗКА",
      price: 2115,
      stock: 7.64,
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const handleXmlUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const xmlText = e.target?.result as string
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(xmlText, "text/xml")

        const offers = xmlDoc.getElementsByTagName("offer")
        const newProducts: Product[] = []

        for (let i = 0; i < offers.length; i++) {
          const offer = offers[i]
          const sku = offer.getAttribute("sku") || ""
          const group1 = offer.getAttribute("group1") || ""
          const group2 = offer.getAttribute("group2") || ""

          const name = offer.getElementsByTagName("name")[0]?.textContent || ""
          const priceText = offer.getElementsByTagName("price")[0]?.textContent || "0"
          const stockText = offer.getElementsByTagName("ostatok")[0]?.textContent || "0"

          const price = Number.parseInt(priceText.replace(/\s/g, "")) || 0
          const stock = Number.parseFloat(stockText) || 0

          if (sku && name) {
            newProducts.push({
              sku,
              name,
              category1: group1,
              category2: group2,
              price,
              stock,
            })
          }
        }

        setProducts(newProducts)
        toast({
          title: "Успешно",
          description: `Загружено ${newProducts.length} товаров из XML файла`,
        })
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось обработать XML файл",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  const handleFtpFileCheck = () => {
    // Simulate FTP file check
    toast({
      title: "FTP проверка",
      description: "Проверка FTP папки на наличие новых файлов...",
    })

    setTimeout(() => {
      toast({
        title: "FTP обновление",
        description: "Найден новый XML файл. База данных обновлена.",
      })
    }, 2000)
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category1.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category2.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleEditProduct = (product: Product) => {
    setEditingProduct({ ...product })
  }

  const handleSaveProduct = () => {
    if (!editingProduct) return

    setProducts(products.map((p) => (p.sku === editingProduct.sku ? editingProduct : p)))
    setEditingProduct(null)
    toast({
      title: "Успешно",
      description: "Товар обновлен",
    })
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !editingProduct) return

    // Simulate image upload
    const imageUrl = URL.createObjectURL(file)
    setEditingProduct({
      ...editingProduct,
      image: imageUrl,
    })
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 glow-text">{t("products.title")}</h1>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("products.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 elegant-input"
            />
          </div>
        </div>

        <input type="file" accept=".xml" onChange={handleXmlUpload} ref={fileInputRef} className="hidden" />

        <Button onClick={() => fileInputRef.current?.click()} className="elegant-button">
          <Upload className="mr-2 h-4 w-4" />
          {t("products.loadXml")}
        </Button>

        <Button
          onClick={handleFtpFileCheck}
          variant="outline"
          className="border-red-800/30 hover:border-red-600/50 hover:bg-red-900/20"
        >
          Проверить FTP
        </Button>
      </div>

      <Card className="elegant-card">
        <CardHeader>
          <CardTitle>База товаров ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>{t("products.name")}</TableHead>
                <TableHead>{t("products.category")}</TableHead>
                <TableHead>{t("products.price")}</TableHead>
                <TableHead>{t("products.stock")}</TableHead>
                <TableHead>{t("products.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.sku} className="table-row-hover">
                  <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                  <TableCell className="max-w-xs truncate">{product.name}</TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <div>{product.category1}</div>
                      <div className="text-muted-foreground">{product.category2}</div>
                    </div>
                  </TableCell>
                  <TableCell>{product.price.toLocaleString()} ₸</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Редактировать товар</DialogTitle>
                          <DialogDescription>Добавьте фото и описание для товара</DialogDescription>
                        </DialogHeader>
                        {editingProduct && (
                          <div className="space-y-4">
                            <div>
                              <Label>Название</Label>
                              <Input
                                value={editingProduct.name}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    name: e.target.value,
                                  })
                                }
                              />
                            </div>

                            <div>
                              <Label>Фото товара</Label>
                              <div className="flex items-center gap-4">
                                {editingProduct.image && (
                                  <img
                                    src={editingProduct.image || "/placeholder.svg"}
                                    alt={editingProduct.name}
                                    className="w-20 h-20 object-cover rounded border"
                                  />
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  className="hidden"
                                  id="image-upload"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => document.getElementById("image-upload")?.click()}
                                >
                                  <ImageIcon className="mr-2 h-4 w-4" />
                                  Выбрать фото
                                </Button>
                              </div>
                            </div>

                            <div>
                              <Label>Описание</Label>
                              <Textarea
                                value={editingProduct.description || ""}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    description: e.target.value,
                                  })
                                }
                                placeholder="Описание товара..."
                                rows={4}
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button onClick={handleSaveProduct} className="bg-red-600 hover:bg-red-700">
                                Сохранить
                              </Button>
                              <Button variant="outline" onClick={() => setEditingProduct(null)}>
                                Отмена
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
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
