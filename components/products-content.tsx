"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
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
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products")
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
      }
    } catch (error) {
      console.error("Ошибка загрузки товаров:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleXmlUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("xmlFile", file)

    try {
      const response = await fetch("/api/products/upload-xml", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
        toast({
          title: "Успешно",
          description: `Загружено ${data.count} товаров из XML файла`,
        })
      } else {
        throw new Error("Ошибка загрузки")
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обработать XML файл",
        variant: "destructive",
      })
    }
  }

  const handleFtpFileCheck = async () => {
    toast({
      title: "FTP проверка",
      description: "Проверка FTP папки на наличие новых файлов...",
    })

    try {
      const response = await fetch("/api/products/ftp-sync", {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.updated) {
          setProducts(data.products)
          toast({
            title: "FTP обновление",
            description: `Обновлено ${data.count} товаров из FTP`,
          })
        } else {
          toast({
            title: "FTP проверка",
            description: "Новых файлов не найдено",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Ошибка проверки FTP",
        variant: "destructive",
      })
    }
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

  const handleSaveProduct = async () => {
    if (!editingProduct) return

    try {
      const response = await fetch("/api/products", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingProduct),
      })

      if (response.ok) {
        setProducts(products.map((p) => (p.sku === editingProduct.sku ? editingProduct : p)))
        setEditingProduct(null)
        toast({
          title: "Успешно",
          description: "Товар обновлен",
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить товар",
        variant: "destructive",
      })
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !editingProduct) return

    const imageUrl = URL.createObjectURL(file)
    setEditingProduct({
      ...editingProduct,
      image: imageUrl,
    })
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
      <h1 className="text-3xl font-bold mb-6 glow-text">База товаров</h1>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск товаров..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 elegant-input"
            />
          </div>
        </div>

        <input type="file" accept=".xml" onChange={handleXmlUpload} ref={fileInputRef} className="hidden" />

        <Button onClick={() => fileInputRef.current?.click()} className="elegant-button">
          <Upload className="mr-2 h-4 w-4" />
          Загрузить XML
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
                <TableHead>Название</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Остаток</TableHead>
                <TableHead>Действия</TableHead>
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
          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {products.length === 0 ? "Нет товаров в базе" : "Товары не найдены"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
