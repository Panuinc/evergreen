"use client";

import { useState, useRef } from "react";
import { Button} from "@heroui/react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { uploadFile, uploadFiles, deleteFile } from "@/lib/supabaseStorage";
import { toast } from "sonner";
import Loading from "@/components/ui/Loading";

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
      <p className="text-xs font-light">{label}</p>

      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <div key={i} className="relative group">
              {accept.includes("image") ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={url}
                  alt={`upload-${i}`}
                  className="w-20 h-20 object-cover rounded-md border border-border"
                />
              ) : (
                <div className="w-20 h-20 flex items-center justify-center rounded-md border border-border bg-default-100">
                  <ImageIcon className="text-muted-foreground" />
                </div>
              )}
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-md cursor-pointer hover:border-primary transition-colors"
      >
        {uploading ? (
          <Loading />
        ) : (
          <>
            <Upload className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
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
