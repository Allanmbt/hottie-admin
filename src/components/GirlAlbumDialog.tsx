// components/GirlAlbumDialog.tsx
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Play, XCircle, Plus, Image as ImageIcon, ArrowUp, ArrowDown } from "lucide-react";
import Dropzone from "react-dropzone";
import { AspectRatio } from "@/components/ui/aspect-ratio";
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

interface Album {
  id: string;
  girl_id: string;
  url: string;
  thumbnail: string | null;
  type: "image" | "video";
  index: number;
  created_at: string;
}

interface GirlAlbumDialogProps {
  girlId: string | null;
  girlName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GirlAlbumDialog({
  girlId,
  girlName,
  open,
  onOpenChange,
}: GirlAlbumDialogProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadPreviews, setUploadPreviews] = useState<{ file: File; preview: string }[]>([]);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);
  const [previewItem, setPreviewItem] = useState<Album | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // 获取相册数据
  const fetchAlbums = useCallback(async () => {
    if (!girlId) {
      console.error("Missing girlId, cannot fetch albums");
      return;
    }

    console.log("正在获取相册，girlId:", girlId); // 添加日志

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("albums")
        .select("*")
        .eq("girl_id", girlId)
        .order("index", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log("获取到相册数据:", data?.length || 0, "条记录");
      setAlbums(data || []);
    } catch (error: any) {
      toast.error("获取相册失败: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [girlId]);

  useEffect(() => {
    if (open && girlId) {
      console.log("对话框打开，girlId:", girlId); // 添加日志
      fetchAlbums();
    } else if (open && !girlId) {
      console.error("对话框打开但girlId无效"); // 添加错误日志
    }
  }, [open, fetchAlbums, girlId]);

  useEffect(() => {
    if (!open) {
      // 对话框关闭时清理状态
      setUploadFiles([]);
      setUploadPreviews([]);
      setAlbums([]);
    }
  }, [open]);

  // 生成视频缩略图
  const generateVideoThumbnail = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");

      // 设置视频属性
      video.preload = "metadata";
      video.playsInline = true;
      video.muted = true;

      // 获取缩略图的函数
      const captureFrame = () => {
        // 检查视频是否已加载足够数据
        if (video.readyState < 2) {
          console.log("视频尚未准备好，等待...");
          return; // 视频未准备好，继续等待
        }

        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnail = canvas.toDataURL("image/jpeg", 0.8);

            // 检查是否为黑屏（简单检测）
            const imageData = ctx.getImageData(0, 0, 20, 20);
            let isDark = true;

            // 检查前20x20像素是否都很暗
            for (let i = 0; i < imageData.data.length; i += 4) {
              const r = imageData.data[i];
              const g = imageData.data[i + 1];
              const b = imageData.data[i + 2];
              const brightness = (r + g + b) / 3;

              if (brightness > 30) {
                isDark = false;
                break;
              }
            }

            if (isDark && video.currentTime < video.duration - 10) {
              // 如果是黑屏且视频还有剩余时间，尝试稍后的帧
              console.log(`${video.currentTime}秒是黑屏，尝试下一个时间点`);
              video.currentTime += 3; // 再往后3秒
              return; // 继续等待新的时间点
            }

            // 不是黑屏或已尝试足够多的时间点，返回缩略图
            video.pause();
            resolve(thumbnail);
          } else {
            reject("获取缩略图失败：Canvas上下文为空");
          }
        } catch (err) {
          console.error("生成缩略图出错:", err);
          reject("获取缩略图失败：" + err);
        }
      };

      // 视频状态事件监听
      video.addEventListener("loadeddata", () => {
        video.currentTime = 2; // 先尝试第2秒，这通常已经有内容了
      });

      video.addEventListener("seeked", captureFrame);
      video.addEventListener("error", () => reject("视频加载失败"));

      // 如果10秒后仍未生成缩略图，使用当前帧
      const timeoutId = setTimeout(() => {
        if (video.readyState >= 2) {
          captureFrame();
        } else {
          reject("视频加载超时");
        }
      }, 10000);

      // 设置视频源
      video.src = URL.createObjectURL(file);
      video.load();
    });
  };

  // 处理文件上传
  const handleFileDrop = async (acceptedFiles: File[]) => {
    const newPreviews = [];

    for (const file of acceptedFiles) {
      try {
        let preview;
        if (file.type.startsWith("video/")) {
          preview = await generateVideoThumbnail(file);
        } else {
          preview = URL.createObjectURL(file);
        }
        newPreviews.push({ file, preview });
      } catch (error) {
        console.error("预览生成失败:", error);
      }
    }

    setUploadFiles([...uploadFiles, ...acceptedFiles]);
    setUploadPreviews([...uploadPreviews, ...newPreviews]);
  };

  // 移除上传文件
  const removeUploadFile = (index: number) => {
    const newFiles = [...uploadFiles];
    const newPreviews = [...uploadPreviews];
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setUploadFiles(newFiles);
    setUploadPreviews(newPreviews);
  };

  // 上移相册项
  const moveItemUp = (index: number) => {
    if (index === 0) return; // 已经是第一个

    const newAlbums = [...albums];
    const temp = newAlbums[index];
    newAlbums[index] = newAlbums[index - 1];
    newAlbums[index - 1] = temp;

    // 更新顺序索引
    const updatedAlbums = newAlbums.map((album, idx) => ({
      ...album,
      index: idx
    }));

    setAlbums(updatedAlbums);
  };

  // 下移相册项
  const moveItemDown = (index: number) => {
    if (index === albums.length - 1) return; // 已经是最后一个

    const newAlbums = [...albums];
    const temp = newAlbums[index];
    newAlbums[index] = newAlbums[index + 1];
    newAlbums[index + 1] = temp;

    // 更新顺序索引
    const updatedAlbums = newAlbums.map((album, idx) => ({
      ...album,
      index: idx
    }));

    setAlbums(updatedAlbums);
  };

  // 打开预览
  const openPreview = (album: Album) => {
    setPreviewItem(album);
    setPreviewOpen(true);
  };

  // 保存相册（包括排序和新上传）
  const saveAlbums = async () => {
    if (!girlId) {
      toast.error("技师ID无效，无法保存相册");
      return;
    }

    // 添加额外验证，确保必要参数都有值
    if (!girlId || girlId.trim() === '') {
      console.error("无效的girlId:", girlId);
      toast.error("技师ID无效，无法保存相册");
      return;
    }

    setIsLoading(true);
    try {
      // 1. 保存排序
      if (albums.length > 0) {
        // 关键修改：确保每个更新项都包含girl_id
        const updates = albums.map((album, index) => ({
          id: album.id,
          girl_id: girlId, // 明确设置girl_id，防止null
          type: album.type || "image", // 确保type不为null
          url: album.url, // 保留原始URL，防止被设为NULL
          created_at: album.created_at || new Date().toISOString(), // 如果是必需的
          index
        }));

        console.log("更新相册排序:", updates);

        // 批量更新排序
        const { error } = await supabase
          .from("albums")
          .upsert(updates);

        if (error) {
          console.error("排序更新错误:", error);
          throw error;
        }
      }

      // 2. 上传新文件
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        const preview = uploadPreviews[i];

        // 明确检查文件类型并设置默认值
        const isVideo = file.type.startsWith("video/");
        const fileType = isVideo ? "video" : "image";

        console.log("处理文件:", file.name, "类型:", fileType);

        // 创建目录结构
        const dirPath = `albums/${girlId}`;

        // 2.1 上传文件到存储
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${dirPath}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('upload')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // 2.2 获取文件URL
        const { data: urlData } = supabase.storage
          .from('upload')
          .getPublicUrl(filePath);

        // 验证URL是否存在
        if (!urlData || !urlData.publicUrl) {
          console.error("无法获取文件URL:", filePath);
          throw new Error("上传文件成功但无法获取公共URL");
        }

        console.log("获取到的文件URL:", urlData.publicUrl);

        let thumbnailUrl = null;

        // 2.3 处理视频缩略图
        if (isVideo && preview) {
          // 将Base64缩略图转换为Blob并上传
          const thumbnailBlob = await fetch(preview.preview).then(r => r.blob());
          const thumbName = `thumb_${Date.now()}.jpg`;
          const thumbPath = `${dirPath}/thumbnails/${thumbName}`;

          const { error: thumbError } = await supabase.storage
            .from('upload')
            .upload(thumbPath, thumbnailBlob, {
              cacheControl: '3600',
              upsert: false
            });

          if (thumbError) throw thumbError;

          const { data: thumbUrlData } = supabase.storage
            .from('upload')
            .getPublicUrl(thumbPath);

          thumbnailUrl = thumbUrlData.publicUrl;
        }

        console.log("Inserting album with girlId:", girlId);

        // 2.4 保存到albums表
        const newIndex = albums.length + i;
        const { error: insertError } = await supabase
          .from('albums')
          .insert([{
            girl_id: girlId,
            url: urlData.publicUrl,
            thumbnail: thumbnailUrl,
            type: fileType,
            index: newIndex
          }]);

        if (insertError) {
          console.error("Insert error:", insertError);
          throw insertError;
        }
      }

      // 重新获取相册
      await fetchAlbums();

      // 清空上传列表
      setUploadFiles([]);
      setUploadPreviews([]);

      toast.success("相册保存成功");
    } catch (error: any) {
      console.error("保存失败:", error);
      toast.error("保存失败: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 删除照片/视频
  const handleDeleteAlbum = async () => {
    if (!albumToDelete) return;

    setIsLoading(true);
    try {
      // 1. 从存储中删除文件
      const url = albumToDelete.url;
      if (url.includes('upload/')) {
        const pathParts = url.split('upload/');
        if (pathParts.length > 1) {
          const filePath = pathParts[1];
          await supabase.storage
            .from('upload')
            .remove([filePath]);
        }
      }

      // 2. 删除缩略图（如果有）
      if (albumToDelete.thumbnail) {
        const thumbUrl = albumToDelete.thumbnail;
        if (thumbUrl.includes('upload/')) {
          const thumbParts = thumbUrl.split('upload/');
          if (thumbParts.length > 1) {
            const thumbPath = thumbParts[1];
            await supabase.storage
              .from('upload')
              .remove([thumbPath]);
          }
        }
      }

      // 3. 删除数据库记录
      const { error } = await supabase
        .from('albums')
        .delete()
        .eq('id', albumToDelete.id);

      if (error) throw error;

      // 4. 更新UI
      setAlbums(albums.filter(a => a.id !== albumToDelete.id));
      toast.success("删除成功");
    } catch (error: any) {
      toast.error("删除失败: " + error.message);
    } finally {
      setIsLoading(false);
      setDeleteAlertOpen(false);
      setAlbumToDelete(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>技师 {girlName} 相册管理</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* 现有照片和视频展示区 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">当前照片和视频 ({albums.length})</h3>
              {isLoading && albums.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-8 w-8 mx-auto animate-spin rounded-full border-b-2 border-primary"></div>
                  <p className="mt-2 text-sm text-gray-500">加载中...</p>
                </div>
              ) : albums.length === 0 ? (
                <div className="text-center py-12 border rounded-md">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="mt-2 text-gray-500">暂无相册内容</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {albums.map((album, index) => (
                    <div key={album.id} className="group relative">
                      <Card className="overflow-hidden cursor-pointer" onClick={() => openPreview(album)}>
                        <AspectRatio ratio={3 / 4} className="bg-muted">
                          {album.type === 'video' ? (
                            <div className="relative h-full">
                              <img
                                src={album.thumbnail || album.url}
                                alt="Video thumbnail"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Play className="h-10 w-10 text-white bg-black/50 rounded-full p-2" />
                              </div>
                            </div>
                          ) : (
                            <img
                              src={album.url}
                              alt="Photo"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </AspectRatio>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation(); // 防止触发父元素的点击事件
                              setAlbumToDelete(album);
                              setDeleteAlertOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                      <div className="mt-1 text-xs flex items-center justify-between">
                        <span>{index + 1}. {album.type}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveItemUp(index)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveItemDown(index)}
                            disabled={index === albums.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 上传新文件区域 */}
            <div className="space-y-4 mt-8">
              <h3 className="text-lg font-medium">上传新照片和视频</h3>
              <Dropzone
                onDrop={handleFileDrop}
                accept={{
                  'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
                  'video/*': ['.mp4', '.mov', '.webm']
                }}
                multiple
              >
                {({ getRootProps, getInputProps }) => (
                  <div
                    {...getRootProps()}
                    className="border-2 border-dashed rounded-md p-6 flex flex-col items-center cursor-pointer hover:border-primary"
                  >
                    <input {...getInputProps()} />
                    <Plus className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 text-center">
                      拖放文件到此处，或点击上传照片或视频
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      支持JPG, PNG, GIF图片和MP4, MOV, WEBM视频
                    </p>
                  </div>
                )}
              </Dropzone>

              {/* 上传预览 */}
              {uploadPreviews.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-medium">上传预览 ({uploadPreviews.length})</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {uploadPreviews.map((item, index) => (
                      <div key={index} className="group relative">
                        <Card className="overflow-hidden">
                          <AspectRatio ratio={3 / 4} className="bg-muted">
                            <img
                              src={item.preview}
                              alt="Upload preview"
                              className="w-full h-full object-cover"
                            />
                            {item.file.type.startsWith('video/') && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Play className="h-10 w-10 text-white bg-black/50 rounded-full p-2" />
                              </div>
                            )}
                          </AspectRatio>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/50 text-white hover:bg-black/70"
                            onClick={() => removeUploadFile(index)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </Card>
                        <div className="mt-1 text-xs text-center truncate">
                          {item.file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button
              onClick={saveAlbums}
              disabled={isLoading || (!albums.length && !uploadFiles.length) || !girlId}
            >
              {isLoading ? "保存中..." : "保存相册"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除这个{albumToDelete?.type === 'video' ? '视频' : '照片'}吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAlbum}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isLoading ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 预览对话框 */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {previewItem?.type === 'video' ? '视频预览' : '照片预览'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center">
            {previewItem?.type === 'video' ? (
              <video
                src={previewItem.url}
                controls
                className="max-h-[70vh] w-auto"
                autoPlay
              />
            ) : (
              <img
                src={previewItem?.url || ''}
                alt="Preview"
                className="max-h-[70vh] w-auto object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}