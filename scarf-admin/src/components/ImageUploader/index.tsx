import React, { useState, useRef, useCallback } from "react";
import { Button, message, Spin, Image } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

const API_URL = "http://localhost:8787";

interface ImageUploaderProps {
  value?: string;
  onChange?: (url: string) => void;
  folder?: string;
  disabled?: boolean;
  maxSize?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  folder = "uploads",
  disabled = false,
  maxSize = 5 * 1024 * 1024, // 5MB
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
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

      onChange?.(result.url);
      message.success("تصویر با موفقیت آپلود شد");
      return true;
    } catch (error) {
      message.error(error instanceof Error ? error.message : "خطا در آپلود تصویر");
      return false;
    } finally {
      setUploading(false);
    }
  }, [folder, maxSize, onChange]);

  const handleRemove = useCallback(() => {
    onChange?.("");
  }, [onChange]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
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
    <div className="image-uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      {value ? (
        <div className="image-uploader-preview">
          <Image
            src={value}
            alt="Preview"
            style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }}
            preview={{
              visible: previewVisible,
              onVisibleChange: setPreviewVisible,
            }}
          />
          <div className="image-uploader-actions">
            <Button
              size="small"
              onClick={() => setPreviewVisible(true)}
              disabled={disabled}
            >
              مشاهده
            </Button>
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={handleRemove}
              disabled={disabled}
            >
              حذف
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`image-uploader-dropzone ${disabled ? "disabled" : ""}`}
          onClick={!disabled ? handleClick : undefined}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files?.[0];
            if (file) {
              handleUpload(file);
            }
          }}
        >
          {uploading ? (
            <Spin tip="در حال آپلود..." />
          ) : (
            <>
              <PlusOutlined style={{ fontSize: 24, color: "#999" }} />
              <p style={{ margin: "8px 0 0", color: "#999" }}>
                کلیک کنید یا فایل را اینجا بکشید
              </p>
              <p style={{ margin: "4px 0 0", color: "#999", fontSize: 12 }}>
                PNG, JPEG, WebP, AVIF - حداکثر {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </>
          )}
        </div>
      )}

      <style>{`
        .image-uploader {
          width: 100%;
        }
        .image-uploader-preview {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .image-uploader-actions {
          display: flex;
          gap: 8px;
        }
        .image-uploader-dropzone {
          border: 2px dashed #d9d9d9;
          border-radius: 8px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.3s;
        }
        .image-uploader-dropzone:hover {
          border-color: #1890ff;
        }
        .image-uploader-dropzone.disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
};
