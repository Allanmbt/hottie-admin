"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LanguageMultiSelect, { LanguageOption } from "@/components/LanguageMultiSelect";
import { ImageCropper } from "@/components/ImageCropper";

type Category = {
  id: string;
  name_zh: string;
  name_en: string;
};

type GirlFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode: boolean;
  currentGirlId: string | null;
  onSuccess: () => void;
  categories: Category[];
};

export function GirlFormDialog({
  open,
  onOpenChange,
  isEditMode,
  currentGirlId,
  onSuccess,
  categories,
}: GirlFormDialogProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 图片裁剪相关状态
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  
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

  const [courseList, setCourseList] = useState<Array<any>>([
    { id: 1, name: "", name_en: "", desc: "", desc_en: "", price: 0 }
  ]);

  // Form state
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

  // Reset form when dialog opens/closes or edit mode changes
  useEffect(() => {
    if (open) {
      if (isEditMode && currentGirlId) {
        fetchGirlDetail(currentGirlId);
      } else {
        resetForm();
      }
    }
  }, [open, isEditMode, currentGirlId]);

  // Get girl details for editing
  const fetchGirlDetail = async (id: string) => {
    try {
      setIsLoading(true);

      const { data: girlData, error } = await supabase
        .from("girls")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (girlData) {
        // Fill form data
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

        // Set course data
        if (girlData.course && Array.isArray(girlData.course) && girlData.course.length > 0) {
          setCourseList(girlData.course);
        } else {
          setCourseList([{ id: 1, name: "", name_en: "", desc: "", desc_en: "", price: 0, cost_price: 0 }]);
        }

        // Set avatar preview
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

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    // Handle number inputs
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

  // Handle nested object field changes
  const handleNestedChange = (parent: keyof typeof formData, child: string, value: any) => {
    setFormData({
      ...formData,
      [parent]: {
        ...(formData[parent] as Record<string, any>),
        [child]: value
      }
    });
  };

  // Reset form to defaults
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
    setActiveTab("basic");
  };

  // 重置表单时，需要同时清除图片裁剪相关状态
  const resetFormAndImage = () => {
    resetForm();
    setTempImageUrl(null);
  };

  // 处理图片裁剪完成
  const handleCropComplete = (croppedImageUrl: string) => {
    setImagePreview(croppedImageUrl);
    
    // 将裁剪后的base64图片转换为File对象
    fetch(croppedImageUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], "cropped-avatar.jpg", { type: "image/jpeg" });
        setImageFile(file);
      })
      .catch(error => {
        console.error("转换裁剪图片失败:", error);
        toast.error("处理裁剪图片时出错");
      });
  };

  // Upload image to storage
  const uploadImage = async () => {
    if (!imageFile) return null;

    try {
      // Create unique filename
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `images/${fileName}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from('upload')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('upload')
        .getPublicUrl(filePath);

      // Get image dimensions
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

  // Add new course
  const addCourse = () => {
    const newId = courseList.length > 0
      ? Math.max(...courseList.map(c => c.id)) + 1
      : 1;

    setCourseList([
      ...courseList,
      { id: newId, name: "", name_en: "", desc: "", desc_en: "", price: 0 }
    ]);
  };

  // Update course data
  const updateCourse = (index: number, field: string, value: any) => {
    const updatedCourses = [...courseList];
    updatedCourses[index] = {
      ...updatedCourses[index],
      [field]: field === 'price' ? Number(value) : value
    };
    setCourseList(updatedCourses);
  };

  // Remove course
  const removeCourse = (index: number) => {
    setCourseList(courseList.filter((_, i) => i !== index));
  };

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // 创建临时URL用于裁剪
      const tempUrl = URL.createObjectURL(file);
      setTempImageUrl(tempUrl);
      
      // 打开裁剪对话框
      setIsCropperOpen(true);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate avatar upload
    if (!imageFile && !imagePreview) {
      toast.error("请上传头像，头像为必填项");
      setActiveTab("media");
      return;
    }

    // Validate category selection
    if (!formData.category_id || formData.category_id === "0") {
      toast.error("请选择技师分类，分类为必填项");
      setActiveTab("basic");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare data for submission
      let submitData: any = {
        ...formData,
        category_id: parseInt(formData.category_id) || null,
        badge: formData.badge === "hot" ? "" : formData.badge,
      };

      // Process course data
      submitData.course = courseList;

      // Auto-calculate minimum price
      if (courseList && courseList.length > 0) {
        const validCourses = courseList.filter(course =>
          course.price && Number(course.price) > 0
        );

        if (validCourses.length > 0) {
          const lowestPrice = Math.min(...validCourses.map(course => Number(course.price)));
          submitData.min_price = lowestPrice;

          setFormData(prev => ({
            ...prev,
            min_price: lowestPrice
          }));
        }
      }

      // Handle avatar upload/update
      if (imageFile) {
        const avatarData = await uploadImage();
        submitData.avatar = avatarData || null;
      } else if (isEditMode && !imagePreview) {
        // Edit mode with cleared image preview
        submitData.avatar = null;
      } else if (!isEditMode) {
        // Add mode without image
        submitData.avatar = null;
      }
      // Otherwise keep existing avatar in edit mode

      let result;

      if (isEditMode && currentGirlId) {
        // Update existing record
        const { data, error } = await supabase
          .from('girls')
          .update(submitData)
          .eq('id', currentGirlId)
          .select();

        result = { data, error };
        if (!error) toast.success("技师信息更新成功");
      } else {
        // Create new record
        submitData.created_at = new Date().toISOString();
        const { data, error } = await supabase
          .from('girls')
          .insert([submitData])
          .select();

        result = { data, error };
        if (!error) toast.success("技师添加成功");
      }

      if (result.error) throw result.error;

      // Close dialog and reset form
      onOpenChange(false);
      resetForm();

      // Notify parent of success
      onSuccess();
    } catch (error: any) {
      toast.error((isEditMode ? "更新" : "添加") + "失败: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
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
                {/* 基本信息表单字段 */}
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
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
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
                          onChange={(value) => {
                            handleNestedChange('language', 'zh', value);
                          }}
                          options={zhLanguageOptions}
                          placeholder="请选择语言能力..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="language_en">语言能力(英文)</Label>
                        <LanguageMultiSelect
                          value={formData.language.en}
                          onChange={(value) => {
                            handleNestedChange('language', 'en', value);
                          }}
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
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">课程信息</h3>
                    <Button type="button" onClick={addCourse} variant="outline" size="sm">
                      添加课程
                    </Button>
                  </div>

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
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>头像上传 <span className="text-red-500">*</span></Label>
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
                              <span className="text-xs text-gray-400 mt-1">会自动裁剪为3:4比例</span>
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
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "提交中..." : (isEditMode ? "更新技师" : "添加技师")}
                </Button>
              </DialogFooter>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* 图片裁剪组件 */}
      <ImageCropper
        open={isCropperOpen}
        onOpenChange={setIsCropperOpen}
        imageUrl={tempImageUrl}
        onCropComplete={handleCropComplete}
      />
    </>
  );
} 