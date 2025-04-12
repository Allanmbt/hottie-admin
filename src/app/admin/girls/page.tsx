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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Search, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon } from "lucide-react";
import { GirlAlbumDialog } from "@/components/GirlAlbumDialog";
import LanguageMultiSelect, { LanguageOption } from "@/components/LanguageMultiSelect";

type Girl = {
  id: string;
  name: string;
  name_en: string;
  avatar: string | { url: string | null };
  nationality: string;
  status: number;
  is_show: boolean;
  created_at: string;
  category_id: string;
  category?: {
    name_zh: string;
  };
  categories: {
    name_zh: string;
  }[];
};

type Category = {
  id: string;
  name_zh: string;
  name_en: string;
};


export default function GirlListPage() {
  const [girls, setGirls] = useState<Girl[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // 分页和筛选状态
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<number | null>(null);
  const [nationality, setNationality] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isShow, setIsShow] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // 筛选选项
  const statusOptions = [
    { value: null, label: "全部状态" },
    { value: 0, label: "在线" },
    { value: 1, label: "忙碌" },
    { value: 2, label: "离线" },
  ];

  // 直接使用emoji作为值
  const nationalityOptions = [
    { value: null, label: "全部国籍" },
    { value: "🇹🇭", label: "泰国" },
    { value: "🇻🇳", label: "越南" },
    { value: "🇨🇳", label: "中国" },
    { value: "🇯🇵", label: "日本" },
    { value: "🇰🇷", label: "韩国" },
    { value: "🇷🇺", label: "俄罗斯" },
    { value: "🇺🇦", label: "乌克兰" },
  ];

  // 从emoji映射到对应的中文名称
  const emojiToName: Record<string, string> = {
    "🇹🇭": "泰国",
    "🇻🇳": "越南",
    "🇨🇳": "中国",
    "🇯🇵": "日本",
    "🇰🇷": "韩国",
    "🇷🇺": "俄罗斯",
    "🇺🇦": "乌克兰"
  };

  const isShowOptions = [
    { value: null, label: "全部显示状态" },
    { value: 1, label: "显示" },
    { value: 0, label: "隐藏" },
  ];

  const zhLanguageOptions: LanguageOption[] = [
    { value: "泰语", label: "泰语" },
    { value: "中文", label: "中文" },
    { value: "基础中文", label: "基础中文" },
    { value: "英语", label: "英语" },
    { value: "基础英语", label: "基础英语" },
    { value: "国籍母语", label: "国籍母语" },
  ];

  const enLanguageOptions: LanguageOption[] = [
    { value: "thai", label: "Thai" },
    { value: "chinese", label: "Chinese" },
    { value: "basic chinese", label: "Basic Chinese" },
    { value: "english", label: "English" },
    { value: "basic english", label: "Basic English" },
    { value: "native", label: "Native" },
  ];

  // 添加技师
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic"); // 记录当前活动的表单标签页
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [courseList, setCourseList] = useState<Array<any>>([
    { id: 1, name: "", name_en: "", desc: "", desc_en: "", price: 0 }
  ]);

  // 编辑与删除状态管理
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentGirlId, setCurrentGirlId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [girlToDelete, setGirlToDelete] = useState<Girl | null>(null);
  const [updatingShowId, setUpdatingShowId] = useState<string | null>(null);

  // 相册状态
  const [isAlbumOpen, setIsAlbumOpen] = useState(false);
  const [currentGirlName, setCurrentGirlName] = useState<string>("");

  // 初始化表单数据
  const [formData, setFormData] = useState({
    name: "",
    name_en: "",
    age: 20,
    city_id: 0,
    gender: 0,
    height: 165,
    bwh: "",
    zhaobei: "D",
    boobs: 0,
    complexion: 0,
    language: { en: "", zh: "" },
    badge: "hot",
    profile: "",
    profile_en: "",
    experience: 1,
    nationality: "🇹🇭",
    position: { lat: 13.7563, lon: 100.5018 },
    on_time: "14:00:00",
    off_time: "01:00:00",
    min_price: 0,
    is_medical: true,
    status: 0,
    category_id: "1",
    tags: { en: "", zh: "", type: 0 },
    is_show: true
  });

  // 处理表单字段变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    // 处理数字输入
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: value === '' ? '' : Number(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // 处理嵌套对象字段变更
  const handleNestedChange = (parent: keyof typeof formData, child: string, value: any) => {
    setFormData({
      ...formData,
      [parent]: {
        ...(formData[parent] as Record<string, any>),
        [child]: value
      }
    });
  };

  const handleOpenAlbum = (girl: Girl) => {
    // 先设置ID和名称
    setCurrentGirlId(girl.id);
    setCurrentGirlName(girl.name);
    // 使用setTimeout确保状态已更新再打开对话框
    setTimeout(() => {
      setIsAlbumOpen(true);
    }, 0);
  };

  // 添加新课程
  const addCourse = () => {
    const newId = courseList.length > 0
      ? Math.max(...courseList.map(c => c.id)) + 1
      : 1;

    setCourseList([
      ...courseList,
      { id: newId, name: "", name_en: "", desc: "", desc_en: "", price: 0 }
    ]);
  };

  // 更新课程数据
  const updateCourse = (index: number, field: string, value: any) => {
    const updatedCourses = [...courseList];
    updatedCourses[index] = {
      ...updatedCourses[index],
      [field]: field === 'price' ? Number(value) : value
    };
    setCourseList(updatedCourses);
  };

  // 删除课程
  const removeCourse = (index: number) => {
    setCourseList(courseList.filter((_, i) => i !== index));
  };

  // 处理图片上传
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      // 创建预览
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 上传图片到 Supabase 存储
  const uploadImage = async () => {
    if (!imageFile) return null;

    try {
      // 创建唯一文件名
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `images/${fileName}`;

      // 上传文件
      const { data, error } = await supabase.storage
        .from('upload')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // 获取公共URL
      const { data: publicUrlData } = supabase.storage
        .from('upload')
        .getPublicUrl(filePath);

      // 获取图片尺寸
      return new Promise<{ url: string, width: number, height: number }>((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            url: publicUrlData.publicUrl,
            width: img.width,
            height: img.height
          });
        };
        img.src = publicUrlData.publicUrl;
      });
    } catch (error) {
      console.error('Image upload error:', error);
      return null;
    }
  };

  // 处理表单提交 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证是否上传了头像
    if (!imageFile && !imagePreview) {
      toast.error("请上传头像，头像为必填项");
      setActiveTab("media");
      return;
    }

    // 验证是否选择了分类
    if (!formData.category_id || formData.category_id === "0") {
      toast.error("请选择技师分类，分类为必填项");
      setActiveTab("basic");
      return;
    }

    setIsLoading(true);

    try {
      // 准备提交数据
      let submitData: any = {
        ...formData,
        category_id: parseInt(formData.category_id) || null,
        badge: formData.badge === "hot" ? "" : formData.badge,
      };

      // 处理课程数据
      submitData.course = courseList;

      // 自动计算并更新最低价格
      // 先检查课程列表是否有有效数据
      if (courseList && courseList.length > 0) {
        // 筛选出有效价格的课程（价格 > 0）
        const validCourses = courseList.filter(course =>
          course.price && Number(course.price) > 0
        );

        // 如果有有效价格的课程，则计算最低价格
        if (validCourses.length > 0) {
          // 使用 Math.min 找出最低价格
          const lowestPrice = Math.min(...validCourses.map(course => Number(course.price)));

          // 更新 min_price 字段
          submitData.min_price = lowestPrice;

          // 可选：如果想在界面上同步显示，也可以更新表单数据状态
          setFormData(prev => ({
            ...prev,
            min_price: lowestPrice
          }));

          console.log(`已自动计算最低价格: ${lowestPrice}`);
        }
      }

      // 只有在有新图片上传时才更新avatar字段
      if (imageFile) {
        const avatarData = await uploadImage();
        submitData.avatar = avatarData || null;
      } else if (isEditMode && !imagePreview) {
        // 编辑模式下如果清除了图片预览但没有新上传
        submitData.avatar = null;
      } else if (!isEditMode) {
        // 新增模式，没有图片
        submitData.avatar = null;
      }
      // 编辑模式下保留原有图片时，不更新avatar字段

      let result;

      if (isEditMode && currentGirlId) {
        // 编辑模式
        const { data, error } = await supabase
          .from('girls')
          .update(submitData)
          .eq('id', currentGirlId)
          .select();

        result = { data, error };
        if (!error) toast.success("技师信息更新成功");
      } else {
        // 新增模式
        submitData.created_at = new Date().toISOString();
        const { data, error } = await supabase
          .from('girls')
          .insert([submitData])
          .select();

        result = { data, error };
        if (!error) toast.success("技师添加成功");
      }

      if (result.error) throw result.error;

      // 成功后关闭对话框并重置表单
      setIsAddOpen(false);
      resetForm();

      // 刷新列表
      fetchGirls();
    } catch (error: any) {
      toast.error((isEditMode ? "更新" : "添加") + "失败: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 重置表单 - 添加到handleInputChange函数后
  const resetForm = () => {
    setFormData({
      name: "",
      name_en: "",
      age: 20,
      city_id: 0,
      gender: 0,
      height: 165,
      bwh: "",
      zhaobei: "D",
      boobs: 0,
      complexion: 0,
      language: { en: "", zh: "" },
      badge: "hot",
      profile: "",
      profile_en: "",
      experience: 1,
      nationality: "🇹🇭",
      position: { lat: 13.7563, lon: 100.5018 },
      on_time: "14:00:00",
      off_time: "01:00:00",
      min_price: 0,
      is_medical: true,
      status: 0,
      category_id: "1",
      tags: { en: "", zh: "", type: 0 },
      is_show: true
    });
    setCourseList([{ id: 1, name: "", name_en: "", desc: "", desc_en: "", price: 0 }]);
    setImageFile(null);
    setImagePreview(null);
    setIsEditMode(false);
    setCurrentGirlId(null);
  };

  // 打开删除确认框 - 添加到重置筛选函数后
  const handleDeleteClick = (girl: Girl) => {
    setGirlToDelete(girl);
    setIsDeleteDialogOpen(true);
  };
  // 打开编辑对话框
  const handleEditGirl = (girl: Girl) => {
    setIsEditMode(true);
    setCurrentGirlId(girl.id);
    setActiveTab("basic"); // 回到第一个标签页
    fetchGirlDetail(girl.id); // 获取并填充详细数据
    setIsAddOpen(true);
  };

  // 执行删除 - 添加到handleDeleteClick函数后
  const confirmDelete = async () => {
    if (!girlToDelete) return;

    setIsLoading(true);
    try {
      // 1. 检查并删除存储中的头像图片
      if (typeof girlToDelete.avatar === 'object' && girlToDelete.avatar?.url) {
        // 从URL获取文件路径
        const url = girlToDelete.avatar.url as string;
        if (url.includes('upload/')) {
          const pathParts = url.split('upload/');
          if (pathParts.length > 1) {
            const filePath = pathParts[1];

            // 尝试删除文件
            await supabase.storage
              .from('upload')
              .remove([filePath]);

            console.log("已删除头像文件:", filePath);
          }
        }
      }

      // 2. 删除数据库记录
      const { error } = await supabase
        .from('girls')
        .delete()
        .eq('id', girlToDelete.id);

      if (error) throw error;

      toast.success("技师删除成功");
      setIsDeleteDialogOpen(false);
      setGirlToDelete(null);
      fetchGirls(); // 刷新列表
    } catch (error: any) {
      toast.error("删除失败: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取分类列表
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("id", { ascending: true });

        if (error) throw error;
        console.log("加载的分类数据:", data);

        // 设置分类数据
        setCategories(data || []);

        // 如果有分类数据且当前formData中category_id为"0"，则设置默认分类
        // 这里我们查找名称为"即时上门"的分类，如果找不到就用第一个
        if (data && data.length > 0 && formData.category_id === "0") {
          const defaultCategory = data.find(c => c.name_zh === "即时上门") || data[0];
          setFormData(prev => ({
            ...prev,
            category_id: defaultCategory.id
          }));
        }
      } catch (error: any) {
        toast.error("获取分类列表失败: " + error.message);
      }
    }

    fetchCategories();
  }, []);

  // 当分页或筛选条件变化时重新获取数据
  useEffect(() => {
    console.log("当前每页显示:", pageSize);
    fetchGirls();
  }, [page, pageSize, status, nationality, categoryId, isShow, sortDirection]);

  async function fetchGirls() {
    try {
      setIsLoading(true);

      // 构建查询
      let query = supabase
        .from("girls")
        .select(`
          id, name, name_en, avatar, nationality, status, is_show, created_at, category_id,
          categories!inner(name_zh)
        `, { count: "exact" });

      // 应用筛选条件
      if (keyword) {
        query = query.or(`name.ilike.%${keyword}%,name_en.ilike.%${keyword}%`);
      }

      if (status !== null) {
        query = query.eq("status", status);
      }

      if (nationality) {
        query = query.eq("nationality", nationality);
      }

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      if (isShow !== null) {
        query = query.eq("is_show", isShow === 1);
      }

      // 复杂排序逻辑
      query = query
        .order("is_show", { ascending: false })  // true(1)在前，false(0)在后
        .order("status", { ascending: true })    // 0在前，1和2在后
        .order("created_at", { ascending: sortDirection === "asc" });

      // 应用分页
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // 执行查询
      const { data, error, count } = await query;

      if (error) throw error;

      // 处理数据，将 categories 字段展平
      const processedData = data?.map(girl => ({
        ...girl,
        category: {
          name_zh: girl.categories[0]?.name_zh || ""
        }
      })) || [];

      setGirls(processedData as Girl[]);
      setTotalCount(count || 0);
    } catch (error: any) {
      toast.error("获取技师列表失败: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }

  // 获取单个技师完整信息 - 添加到fetchGirls函数后面
  const fetchGirlDetail = async (id: string) => {
    try {
      setIsLoading(true);

      // 获取技师基本信息
      const { data: girlData, error } = await supabase
        .from("girls")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (girlData) {
        // 填充表单数据
        setFormData({
          name: girlData.name || "",
          name_en: girlData.name_en || "",
          age: girlData.age || 20,
          city_id: girlData.city_id || 0,
          gender: girlData.gender || 0,
          height: girlData.height || 165,
          bwh: girlData.bwh || "",
          zhaobei: girlData.zhaobei || "D",
          boobs: girlData.boobs || 0,
          complexion: girlData.complexion || 0,
          language: girlData.language || { en: "", zh: "" },
          badge: girlData.badge || "hot",
          profile: girlData.profile || "",
          profile_en: girlData.profile_en || "",
          experience: girlData.experience || 1,
          nationality: girlData.nationality || "🇹🇭",
          position: girlData.position || { lat: 13.7563, lon: 100.5018 },
          on_time: girlData.on_time || "14:00:00",
          off_time: girlData.off_time || "01:00:00",
          min_price: girlData.min_price || 0,
          is_medical: girlData.is_medical !== undefined ? girlData.is_medical : true,
          status: girlData.status || 0,
          category_id: girlData.category_id?.toString() || "1",
          tags: girlData.tags || { en: "", zh: "", type: 0 },
          is_show: girlData.is_show !== undefined ? girlData.is_show : true
        });

        // 检查并设置课程数据
        if (girlData.course && Array.isArray(girlData.course) && girlData.course.length > 0) {
          // 直接使用从JSONB字段中获取的课程数据
          setCourseList(girlData.course);
        } else {
          // 无课程数据时设置默认值
          setCourseList([{ id: 1, name: "", name_en: "", desc: "", desc_en: "", price: 0, cost_price: 0 }]);
        }

        // 设置头像预览
        if (typeof girlData.avatar === 'object' && girlData.avatar?.url) {
          setImagePreview(girlData.avatar.url);
        } else if (typeof girlData.avatar === 'string') {
          setImagePreview(girlData.avatar);
        }
      }
    } catch (error: any) {
      toast.error("获取技师详情失败: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理搜索
  const handleSearch = () => {
    setPage(1); // 重置到第一页
    fetchGirls();
  };

  // 重置筛选
  const handleReset = () => {
    setKeyword("");
    setStatus(null);
    setNationality(null);
    setCategoryId(null);
    setIsShow(null);
    setPage(1);
    // 重置后自动获取数据
    setTimeout(() => fetchGirls(), 0);
  };

  // 列表页 对显示字段的开关
  const handleToggleShow = async (id: string, isShow: boolean) => {
    try {
      // 设置正在更新的技师 ID
      setUpdatingShowId(id);

      // 调用 Supabase 更新显示状态
      const { error } = await supabase
        .from('girls')
        .update({ is_show: isShow })
        .eq('id', id);

      if (error) throw error;

      // 更新本地状态
      setGirls(prevGirls =>
        prevGirls.map(girl =>
          girl.id === id ? { ...girl, is_show: isShow } : girl
        )
      );

      // 显示成功提示
      toast.success(`技师${isShow ? '已显示' : '已隐藏'}`);

    } catch (error: any) {
      toast.error(`更新显示状态失败: ${error.message}`);
    } finally {
      // 清除正在更新的技师 ID
      setUpdatingShowId(null);
    }
  };

  // 获取头像URL
  const getAvatarUrl = (avatar: string | { url: string | null }) => {
    if (typeof avatar === 'string') return avatar;
    return avatar?.url || "/placeholder-avatar.jpg";
  };

  // 获取状态标签
  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0: return { label: "在线", className: "bg-green-100 text-green-800" };
      case 1: return { label: "忙碌", className: "bg-yellow-100 text-yellow-800" };
      case 2: return { label: "离线", className: "bg-gray-100 text-gray-800" };
      default: return { label: "未知", className: "bg-gray-100 text-gray-800" };
    }
  };

  // 格式化日期
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 计算总页数
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl font-bold">技师管理</CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">总计: {totalCount} 位技师</span>
          </div>
        </CardHeader>

        {/* 筛选工具栏 */}
        <CardContent className="pb-4">
          <div className="flex flex-col space-y-4 md:flex-row md:items-end md:space-x-4 md:space-y-0">
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">搜索技师</p>
              <div className="flex space-x-2">
                <Input
                  placeholder="输入名称搜索..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-1" />
                  搜索
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <div className="w-32">
                <Select
                  value={status !== null ? status.toString() : "_empty_"}
                  onValueChange={(val) => setStatus(val === "_empty_" ? null : parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem
                        key={option.label}
                        value={option.value !== null ? option.value.toString() : "_empty_"}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-32">
                <Select
                  value={nationality || "_empty_"}
                  onValueChange={(val) => setNationality(val === "_empty_" ? null : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="国籍" />
                  </SelectTrigger>
                  <SelectContent>
                    {nationalityOptions.map((option) => (
                      <SelectItem
                        key={option.label}
                        value={option.value || "_empty_"}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-36">
                <Select
                  value={categoryId || "_empty_"}
                  onValueChange={(val) => setCategoryId(val === "_empty_" ? null : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_empty_">全部分类</SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id}
                      >
                        {category.name_zh}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-32">
                <Select
                  value={isShow !== null ? isShow.toString() : "_empty_"}
                  onValueChange={(val) => setIsShow(val === "_empty_" ? null : parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="显示状态" />
                  </SelectTrigger>
                  <SelectContent>
                    {isShowOptions.map((option) => (
                      <SelectItem
                        key={option.label}
                        value={option.value !== null ? option.value.toString() : "_empty_"}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" onClick={handleReset} className="h-10">
                重置筛选
              </Button>

              <Button
                className="ml-auto h-10 flex items-center gap-1 bg-green-600 hover:bg-green-700"
                onClick={() => {
                  resetForm(); // 重置表单，确保是干净状态
                  setIsAddOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                <span>添加技师</span>
              </Button>
            </div>
          </div>
        </CardContent>

        {/* 表格 */}
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">ID</TableHead>
                  <TableHead className="w-[80px]">头像</TableHead>
                  <TableHead>中文名称</TableHead>
                  <TableHead>英文名称</TableHead>
                  <TableHead className="w-[120px]">分类</TableHead>
                  <TableHead className="w-[100px]">国籍</TableHead>
                  <TableHead className="w-[80px]">状态</TableHead>
                  <TableHead className="w-[80px] text-center">显示</TableHead>
                  <TableHead
                    className="cursor-pointer w-[180px]"
                    onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                  >
                    <div className="flex items-center gap-1">
                      创建时间
                      {sortDirection === "asc"
                        ? <ArrowUp className="h-3 w-3" />
                        : <ArrowDown className="h-3 w-3" />
                      }
                    </div>
                  </TableHead>
                  <TableHead className="text-right w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      <div className="flex justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                      </div>
                      <div className="mt-2">加载中...</div>
                    </TableCell>
                  </TableRow>
                ) : girls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      暂无技师数据
                    </TableCell>
                  </TableRow>
                ) : (
                  girls.map((girl) => {
                    const statusInfo = getStatusLabel(girl.status);
                    return (
                      <TableRow key={girl.id}>
                        <TableCell className="font-medium">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">
                                  {girl.id.toString().substr(-5)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>完整ID: {girl.id}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                            <img
                              src={getAvatarUrl(girl.avatar)}
                              alt={girl.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder-avatar.jpg";
                              }}
                            />
                          </div>
                        </TableCell>
                        <TableCell>{girl.name}</TableCell>
                        <TableCell>{girl.name_en}</TableCell>
                        <TableCell>{girl.category?.name_zh || "-"}</TableCell>
                        {/* 表格中国籍单元格的修改 */}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-lg">{girl.nationality}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusInfo.className}`}>
                            {statusInfo.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {updatingShowId === girl.id ? (
                              <div className="w-9 h-5 flex justify-center">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                              </div>
                            ) : (
                              <Switch
                                checked={girl.is_show}
                                onCheckedChange={(checked) => handleToggleShow(girl.id, checked)}
                                className="data-[state=checked]:bg-green-500"
                                disabled={updatingShowId !== null}
                                aria-label={girl.is_show ? "显示" : "隐藏"}
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(girl.created_at)}</TableCell>
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
                                onClick={() => handleOpenAlbum(girl)}
                              >
                                <ImageIcon className="h-4 w-4" />
                                <span>相册</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex items-center gap-2"
                                onClick={() => handleEditGirl(girl)}
                              >
                                <Pencil className="h-4 w-4" />
                                <span>编辑</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex items-center gap-2 text-destructive"
                                onClick={() => handleDeleteClick(girl)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>删除</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500 w-45">
              共 {totalCount} 条记录，第 {page} / {totalPages} 页
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage(page > 1 ? page - 1 : 1)}
                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  // 计算显示哪些页码按钮
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setPage(pageNum)}
                        isActive={page === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
                    className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      {/* 添加到 GirlListPage 组件返回的 JSX 中 */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "编辑技师信息" : "添加新技师"}</DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="details">详细信息</TabsTrigger>
              <TabsTrigger value="courses">课程价格</TabsTrigger>
              <TabsTrigger value="media">照片与标签</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit}>
              <TabsContent value="basic" className="space-y-4">
                {/* 基础信息表单字段 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">中文名称 <span className="text-red-500">*</span></Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name_en">英文名称 <span className="text-red-500">*</span></Label>
                    <Input
                      id="name_en"
                      name="name_en"
                      value={formData.name_en}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">年龄</Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      min="18"
                      max="60"
                      value={formData.age}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city_id">城市</Label>
                    <Select
                      value={formData.city_id.toString()}
                      onValueChange={(value) => setFormData({ ...formData, city_id: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择城市" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">曼谷</SelectItem>
                        <SelectItem value="1">芭提雅</SelectItem>
                        <SelectItem value="2">清迈</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">性别</Label>
                    <Select
                      value={formData.gender.toString()}
                      onValueChange={(value) => setFormData({ ...formData, gender: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择性别" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">女</SelectItem>
                        <SelectItem value="1">男</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nationality">国籍</Label>
                    <Select
                      value={formData.nationality}
                      onValueChange={(value) => setFormData({ ...formData, nationality: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择国籍" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="🇹🇭">🇹🇭 泰国</SelectItem>
                        <SelectItem value="🇻🇳">🇻🇳 越南</SelectItem>
                        <SelectItem value="🇨🇳">🇨🇳 中国</SelectItem>
                        <SelectItem value="🇯🇵">🇯🇵 日本</SelectItem>
                        <SelectItem value="🇰🇷">🇰🇷 韩国</SelectItem>
                        <SelectItem value="🇷🇺">🇷🇺 俄罗斯</SelectItem>
                        <SelectItem value="🇺🇦">🇺🇦 乌克兰</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="height">身高(cm)</Label>
                    <Input
                      id="height"
                      name="height"
                      type="number"
                      min="140"
                      max="200"
                      value={formData.height}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bwh">三围</Label>
                    <Input
                      id="bwh"
                      name="bwh"
                      placeholder="例: 34D/26/36"
                      value={formData.bwh}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category_id">分类 <span className="text-red-500">*</span></Label>
                    <Select
                      key={`category-select-${formData.category_id}`}
                      value={String(formData.category_id)}
                      onValueChange={(value) => {
                        console.log("选择的分类ID:", value);
                        setFormData({ ...formData, category_id: value });
                      }}
                      required
                    >
                      <SelectTrigger id="category_id">
                        <SelectValue placeholder="选择分类" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={String(category.id)}>
                            {category.name_zh}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="max-h-[500px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                  {/* 详细信息表单字段 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zhaobei">罩杯</Label>
                      <Select
                        value={formData.zhaobei}
                        onValueChange={(value) => setFormData({ ...formData, zhaobei: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择罩杯" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="C-">C-</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                          <SelectItem value="E">E</SelectItem>
                          <SelectItem value="E+">E+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="boobs">胸部类型</Label>
                      <Select
                        value={formData.boobs.toString()}
                        onValueChange={(value) => setFormData({ ...formData, boobs: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择胸部类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">真胸</SelectItem>
                          <SelectItem value="1">硅胶</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="complexion">肤色</Label>
                      <Select
                        value={formData.complexion.toString()}
                        onValueChange={(value) => setFormData({ ...formData, complexion: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择肤色" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">自然肤</SelectItem>
                          <SelectItem value="1">白皙肤</SelectItem>
                          <SelectItem value="2">小麦肤</SelectItem>
                          <SelectItem value="3">棕色肤</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="badge">徽章</Label>
                      <Select
                        value={formData.badge}
                        onValueChange={(value) => setFormData({ ...formData, badge: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择徽章" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hot">无</SelectItem>
                          <SelectItem value="top">明星</SelectItem>
                          <SelectItem value="new">新人</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience">经验(年)</Label>
                      <Input
                        id="experience"
                        name="experience"
                        type="number"
                        min="0"
                        max="20"
                        value={formData.experience}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="min_price">最低价格 <span className="text-red-500">*</span></Label>
                      <Input
                        id="min_price"
                        name="min_price"
                        type="number"
                        value={formData.min_price}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="on_time">上班时间</Label>
                      <Input
                        id="on_time"
                        name="on_time"
                        type="time"
                        value={formData.on_time.substring(0, 5)}
                        onChange={(e) => setFormData({ ...formData, on_time: e.target.value + ":00" })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="off_time">下班时间</Label>
                      <Input
                        id="off_time"
                        name="off_time"
                        type="time"
                        value={formData.off_time.substring(0, 5)}
                        onChange={(e) => setFormData({ ...formData, off_time: e.target.value + ":00" })}
                      />
                    </div>

                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="profile">中文简介</Label>
                        <Textarea
                          id="profile"
                          name="profile"
                          value={formData.profile}
                          onChange={handleInputChange}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profile_en">英文简介</Label>
                        <Textarea
                          id="profile_en"
                          name="profile_en"
                          value={formData.profile_en}
                          onChange={handleInputChange}
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="language_zh">语言能力(中文)</Label>
                        <LanguageMultiSelect
                          value={formData.language.zh}
                          onChange={(value) => handleNestedChange('language', 'zh', value)}
                          options={zhLanguageOptions}
                          placeholder="请选择语言能力..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="language_en">语言能力(英文)</Label>
                        <LanguageMultiSelect
                          value={formData.language.en}
                          onChange={(value) => handleNestedChange('language', 'en', value)}
                          options={enLanguageOptions}
                          placeholder="Select languages..."
                        />
                      </div>
                    </div>

                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="position_lat">位置(纬度)</Label>
                        <Input
                          id="position_lat"
                          type="number"
                          step="0.0001"
                          value={formData.position.lat}
                          onChange={(e) => handleNestedChange('position', 'lat', parseFloat(e.target.value))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="position_lon">位置(经度)</Label>
                        <Input
                          id="position_lon"
                          type="number"
                          step="0.0001"
                          value={formData.position.lon}
                          onChange={(e) => handleNestedChange('position', 'lon', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="courses" className="space-y-4">
                {/* 课程信息 - 添加最大高度和滚动 */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">课程信息</h3>
                    <Button type="button" onClick={addCourse} variant="outline" size="sm">
                      添加课程
                    </Button>
                  </div>

                  {/* 添加滚动容器 */}
                  <div className="max-h-[450px] overflow-y-auto pr-2 space-y-4" style={{ scrollbarWidth: 'thin' }}>
                    {courseList.map((course, index) => (
                      <div key={index} className="border rounded-md p-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">课程 #{index + 1}</h4>
                          {courseList.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCourse(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              删除
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>中文名称</Label>
                            <Input
                              value={course.name}
                              onChange={(e) => updateCourse(index, 'name', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>英文名称</Label>
                            <Input
                              value={course.name_en}
                              onChange={(e) => updateCourse(index, 'name_en', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>中文描述</Label>
                            <Input
                              value={course.desc}
                              onChange={(e) => updateCourse(index, 'desc', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>英文描述</Label>
                            <Input
                              value={course.desc_en}
                              onChange={(e) => updateCourse(index, 'desc_en', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>价格</Label>
                            <Input
                              type="number"
                              value={course.price}
                              onChange={(e) => updateCourse(index, 'price', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>成本价</Label>
                            <Input
                              type="number"
                              value={course.cost_price || 0}
                              onChange={(e) => updateCourse(index, 'cost_price', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="media" className="space-y-4">
                {/* 照片上传和标签 */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label> 头像上传 <span className="text-red-500">*</span></Label>
                      <div className="border rounded-md p-4 text-center">
                        <Input
                          id="avatar"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <Label htmlFor="avatar" className="cursor-pointer block">
                          {imagePreview ? (
                            <div className="relative mx-auto w-40 h-40">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-full object-cover rounded-md"
                              />
                            </div>
                          ) : (
                            <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center">
                              <span className="text-gray-500 mb-2">点击上传头像</span>
                              <span className="text-xs text-gray-400">建议尺寸: 700x1200</span>
                            </div>
                          )}
                        </Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="is_show">显示状态</Label>
                        <Switch
                          id="is_show"
                          checked={formData.is_show}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_show: checked })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="is_medical">体检报告</Label>
                        <Switch
                          id="is_medical"
                          checked={formData.is_medical}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_medical: checked })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">状态</Label>
                      <Select
                        value={formData.status.toString()}
                        onValueChange={(value) => setFormData({ ...formData, status: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择状态" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">在线</SelectItem>
                          <SelectItem value="1">忙碌</SelectItem>
                          <SelectItem value="2">离线</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tags_zh">标签(中文)</Label>
                      <Input
                        id="tags_zh"
                        placeholder="例: 深度舒缓,运动按摩"
                        value={formData.tags.zh}
                        onChange={(e) => handleNestedChange('tags', 'zh', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">多个标签使用逗号分隔</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags_en">标签(英文)</Label>
                      <Input
                        id="tags_en"
                        placeholder="例: deep_relax,sport_massage"
                        value={formData.tags.en}
                        onChange={(e) => handleNestedChange('tags', 'en', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">多个标签使用逗号分隔</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "提交中..." : "保存技师"}
                </Button>
              </DialogFooter>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>您确定要删除技师 "<span className="font-semibold">{girlToDelete?.name}</span>" 吗？</p>
            <p className="text-sm text-gray-500 mt-2">此操作不可撤销。</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={isLoading}
            >
              {isLoading ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 相册对话框 */}
      <GirlAlbumDialog
        girlId={currentGirlId}
        girlName={currentGirlName}
        open={isAlbumOpen}
        onOpenChange={setIsAlbumOpen}
      />
    </>
  );
}