"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, MoreHorizontal, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Category = {
  id: string;
  name_zh: string;
  name_en: string;
  created_at: string;
};

// 添加排序相关的类型
type SortField = "id" | "created_at";
type SortDirection = "asc" | "desc";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 表单状态
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formData, setFormData] = useState({ name_zh: "", name_en: "" });
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  // 排序状态
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // 当排序状态改变时重新获取数据
  useEffect(() => {
    fetchCategories();
  }, [sortField, sortDirection]);

  async function fetchCategories() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order(sortField, { ascending: sortDirection === "asc" });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast.error("获取分类列表失败: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 切换排序
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      // 如果已经按此字段排序，则切换排序方向
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // 如果是新的排序字段，设置为降序
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // 打开编辑对话框
  const handleEditClick = (category: Category) => {
    setCurrentCategory(category);
    setFormData({
      name_zh: category.name_zh,
      name_en: category.name_en,
    });
    setIsEditOpen(true);
  };

  // 打开删除对话框
  const handleDeleteClick = (category: Category) => {
    setCurrentCategory(category);
    setIsDeleteOpen(true);
  };

  // 添加分类
  const handleAddCategory = async () => {
    try {
      if (!formData.name_zh || !formData.name_en) {
        toast.error("请填写完整信息");
        return;
      }

      setIsLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { data, error } = await supabase
        .from("categories")
        .insert([
          {
            name_zh: formData.name_zh,
            name_en: formData.name_en,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      toast.success("添加成功");
      setIsAddOpen(false);
      setFormData({ name_zh: "", name_en: "" });
      fetchCategories();
    } catch (error: any) {
      toast.error("添加失败: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 编辑分类
  const handleEditCategory = async () => {
    try {
      if (!currentCategory || !formData.name_zh || !formData.name_en) {
        toast.error("请填写完整信息");
        return;
      }

      setIsLoading(true);

      const { error } = await supabase
        .from("categories")
        .update({
          name_zh: formData.name_zh,
          name_en: formData.name_en,
        })
        .eq("id", currentCategory.id);

      if (error) throw error;

      toast.success("更新成功");
      setIsEditOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast.error("更新失败: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 删除分类
  const handleDeleteCategory = async () => {
    try {
      if (!currentCategory) return;

      setIsLoading(true);

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", currentCategory.id);

      if (error) throw error;

      toast.success("删除成功");
      setIsDeleteOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast.error("删除失败: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化日期，只显示年月日
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('zh-CN');
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl font-bold">分类管理</CardTitle>
          <Button
            className="flex items-center gap-1"
            onClick={() => {
              setFormData({ name_zh: "", name_en: "" });
              setIsAddOpen(true);
            }}
          >
            <PlusCircle className="h-4 w-4" />
            <span>添加分类</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="w-[80px] cursor-pointer"
                    onClick={() => toggleSort("id")}
                  >
                    <div className="flex items-center gap-1">
                      ID
                      {sortField === "id" && (
                        sortDirection === "asc"
                          ? <ArrowUp className="h-3 w-3" />
                          : <ArrowDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>中文名称</TableHead>
                  <TableHead>英文名称</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("created_at")}
                  >
                    <div className="flex items-center gap-1">
                      创建时间
                      {sortField === "created_at" && (
                        sortDirection === "asc"
                          ? <ArrowUp className="h-3 w-3" />
                          : <ArrowDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                      </div>
                      <div className="mt-2">加载中...</div>
                    </TableCell>
                  </TableRow>
                ) : categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      暂无分类数据
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.id}</TableCell>
                      <TableCell>{category.name_zh}</TableCell>
                      <TableCell>{category.name_en}</TableCell>
                      <TableCell>{formatDate(category.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="flex items-center gap-2"
                              onClick={() => handleEditClick(category)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span>编辑</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="flex items-center gap-2 text-destructive"
                              onClick={() => handleDeleteClick(category)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>删除</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 添加分类对话框 */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加分类</DialogTitle>
            <DialogDescription>
              请填写分类的中文名称和英文名称
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name_zh">中文名称</Label>
              <Input
                id="name_zh"
                name="name_zh"
                value={formData.name_zh}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name_en">英文名称</Label>
              <Input
                id="name_en"
                name="name_en"
                value={formData.name_en}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddCategory} disabled={isLoading}>
              {isLoading ? "提交中..." : "确认添加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑分类对话框 */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑分类</DialogTitle>
            <DialogDescription>
              修改分类的中文名称和英文名称
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_name_zh">中文名称</Label>
              <Input
                id="edit_name_zh"
                name="name_zh"
                value={formData.name_zh}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_name_en">英文名称</Label>
              <Input
                id="edit_name_en"
                name="name_en"
                value={formData.name_en}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditCategory} disabled={isLoading}>
              {isLoading ? "更新中..." : "确认更新"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除分类 &quot;{currentCategory?.name_zh}&quot; 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}