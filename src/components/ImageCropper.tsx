"use client";

import { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ImageCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  onCropComplete: (croppedImage: string) => void;
}

const ASPECT_RATIO = 3 / 4; // 3:4宽高比

export function ImageCropper({ open, onOpenChange, imageUrl, onCropComplete }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // 当图片加载时设置初始裁剪区域
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // 创建一个居中的3:4比例的裁剪区
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        ASPECT_RATIO,
        width,
        height
      ),
      width,
      height
    );
    
    setCrop(crop);
  };

  // 生成预览图
  useEffect(() => {
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current &&
      previewCanvasRef.current
    ) {
      // 在Canvas上绘制裁剪后的图像
      const ctx = previewCanvasRef.current.getContext('2d');
      if (!ctx) return;

      const image = imgRef.current;
      
      // 设置Canvas尺寸
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      previewCanvasRef.current.width = completedCrop.width;
      previewCanvasRef.current.height = completedCrop.height;
      
      // 应用旋转和缩放
      ctx.save();
      ctx.translate(completedCrop.width / 2, completedCrop.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);
      ctx.translate(-completedCrop.width / 2, -completedCrop.height / 2);
      
      // 绘制裁剪区域
      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );
      
      ctx.restore();
    }
  }, [completedCrop, rotation, scale]);

  // 保存裁剪后的图像
  const handleSave = () => {
    if (previewCanvasRef.current && completedCrop?.width && completedCrop?.height) {
      const croppedImageUrl = previewCanvasRef.current.toDataURL('image/jpeg', 0.85);
      onCropComplete(croppedImageUrl);
      onOpenChange(false);
    }
  };

  // 重置裁剪区域
  const handleReset = () => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const newCrop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          ASPECT_RATIO,
          width,
          height
        ),
        width,
        height
      );
      setCrop(newCrop);
      setRotation(0);
      setScale(1);
    }
  };

  // 旋转图片
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // 缩放图片
  const handleScale = (newScale: number[]) => {
    setScale(newScale[0]);
  };

  // 缩放增减
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>裁剪头像图片 (3:4)</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4">
          {imageUrl && (
            <div className="relative">
              <ReactCrop
                crop={crop}
                onChange={(c: Crop) => setCrop(c)}
                onComplete={(c: PixelCrop) => setCompletedCrop(c)}
                aspect={ASPECT_RATIO}
                className="max-h-[500px] overflow-auto"
              >
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="待裁剪图片"
                  style={{ 
                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                    maxHeight: '500px',
                  }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            </div>
          )}

          <div className="flex items-center space-x-4 w-full max-w-md">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleZoomOut} 
              disabled={scale <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <div className="flex-1">
              <Slider 
                value={[scale]} 
                min={0.5} 
                max={3} 
                step={0.01} 
                onValueChange={handleScale} 
              />
            </div>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleZoomIn} 
              disabled={scale >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRotate}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="hidden">
            <canvas
              ref={previewCanvasRef}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset}>重置</Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSave}>确认裁剪</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 