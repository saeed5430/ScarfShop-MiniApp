import React, { useState, useRef, useCallback } from "react";
import { Button, message, Spin, Image } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

const API_URL = "http://localhost:8787";

export interface ImageData {
  url: string;
  fileId: string;
}

interface MultiImageUploaderProps {
  value?: ImageData[];
  onChange?: (images: ImageData[]) => void;
  folder?: string;
  disabled?: boolean;
  maxSize?: number;
  maxCount?: number;
}

export const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({
  value = [],
  onChange,
  folder = "uploads",
  disabled = false,
  maxSize = 5 * 1024 * 1024, // 5MB
  maxCount = 8,
}) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      message.error("فقط فایل‌های تصویری مجاز هستند (PNG, JPEG, WebP, AVIF)");
      return false;
    }

    // Validate file size
    if (file.size > maxSize) {
      message.error(`حجم فایل نباید بیشتر از ${Math.round(maxSize / 1024 / 1024)} مگابایت باشد`);
      return false;
    }

    // Validate max count
    if (value.length >= maxCount) {
      message.error(`حداکثر ${maxCount} تصویر مجاز است`);
      return false;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      formData.append("fileName", file.name);

      const response = await fetch(`${API_URL}/api/upload/image`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      const newImage: ImageData = {
        url: result.url,
        fileId: result.fileId,
      };

      onChange?.([...value, newImage]);
      message.success("تصویر با موفقیت آپلود شد");
      return true;
    } catch (error) {
      message.error(error instanceof Error ? error.message : "خطا در آپلود تصویر");
      return false;
    } finally {
      setUploading(false);
    }
  }, [folder, maxSize, maxCount, value, onChange]);

  const handleRemove = useCallback(async (index: number) => {
    const image = value[index];
    if (!image?.fileId) {
      // No fileId, just remove from list
      const newImages = value.filter((_, i) => i !== index);
      onChange?.(newImages);
      return;
    }

    setDeleting(image.fileId);

    try {
      // Delete from ImageKit
      const response = await fetch(`${API_URL}/api/upload/image/${image.fileId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Delete failed");
      }

      // Remove from list
      const newImages = value.filter((_, i) => i !== index);
      onChange?.(newImages);
      message.success("تصویر حذف شد");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "خطا در حذف تصویر");
    } finally {
      setDeleting(null);
    }
  }, [value, onChange]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        handleUpload(files[i]);
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [handleUpload]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="multi-image-uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        multiple
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      <div className="multi-image-list">
        {value.map((image, index) => (
          <div key={image.fileId || index} className="multi-image-item">
            <Image
              src={image.url}
              alt={`Image ${index + 1}`}
              style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }}
              preview={true}
            />
            {!disabled && (
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                className="multi-image-delete"
                onClick={() => handleRemove(index)}
                loading={deleting === image.fileId}
                disabled={deleting !== null}
              />
            )}
          </div>
        ))}

        {!disabled && value.length < maxCount && (
          <div
            className={`multi-image-add ${uploading ? "uploading" : ""}`}
            onClick={!uploading ? handleClick : undefined}
          >
            {uploading ? (
              <Spin size="small" />
            ) : (
              <>
                <PlusOutlined style={{ fontSize: 20, color: "#999" }} />
                <span style={{ fontSize: 12, color: "#999" }}>افزودن</span>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ color: "#999", fontSize: 12, marginTop: 8 }}>
        حداکثر {maxCount} تصویر - فرمت‌های JPG, PNG, WebP, AVIF
      </div>

      <style>{`
        .multi-image-uploader {
          width: 100%;
        }
        .multi-image-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .multi-image-item {
          position: relative;
          width: 80px;
          height: 80px;
        }
        .multi-image-delete {
          position: absolute;
          top: -8px;
          right: -8px;
        }
        .multi-image-add {
          width: 80px;
          height: 80px;
          border: 2px dashed #d9d9d9;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.3s;
        }
        .multi-image-add:hover {
          border-color: #1890ff;
        }
        .multi-image-add.uploading {
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
