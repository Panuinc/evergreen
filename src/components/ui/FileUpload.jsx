"use client";

import { useState, useRef } from "react";
import { Button, Spinner } from "@heroui/react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { uploadFile, uploadFiles, deleteFile } from "@/lib/supabaseStorage";
import { toast } from "sonner";

export default function FileUpload({
  label = "อัปโหลดไฟล์",
  accept = "image/*",
  multiple = false,
  value,
  onChange,
  folder = "uploads",
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      if (multiple) {
        const urls = await uploadFiles(folder, files);
        const current = Array.isArray(value) ? value : [];
        onChange([...current, ...urls]);
      } else {
        const url = await uploadFile(folder, files[0]);
        onChange(url);
      }
      toast.success("อัปโหลดไฟล์สำเร็จ");
    } catch (error) {
      toast.error("อัปโหลดล้มเหลว: " + (error.message || "ข้อผิดพลาดไม่ทราบสาเหตุ"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async (url) => {
    await deleteFile(url);
    if (multiple) {
      const current = Array.isArray(value) ? value : [];
      onChange(current.filter((u) => u !== url));
    } else {
      onChange("");
    }
  };

  const urls = multiple ? (Array.isArray(value) ? value : []) : value ? [value] : [];

  return (
    <div className="flex flex-col gap-2 w-full">
      <p className="text-sm font-medium">{label}</p>

      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <div key={i} className="relative group">
              {accept.includes("image") ? (
                <img
                  src={url}
                  alt={`upload-${i}`}
                  className="w-20 h-20 object-cover rounded-md border border-foreground/15"
                />
              ) : (
                <div className="w-20 h-20 flex items-center justify-center rounded-md border border-foreground/15 bg-default-100">
                  <ImageIcon size={24} className="text-default-400" />
                </div>
              )}
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-foreground/15 rounded-md cursor-pointer hover:border-primary transition-colors"
      >
        {uploading ? (
          <Spinner />
        ) : (
          <>
            <Upload size={16} className="text-default-400" />
            <span className="text-sm text-default-400">
              คลิกเพื่ออัปโหลดไฟล์
            </span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
