import React, { useState } from 'react';
import { UploadSimple, Trash } from '@phosphor-icons/react';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';

interface ImageUploadProps {
  previewUrl: string | null;
  onUpload: (storageId: string | null, previewUrl: string | null) => void;
}

export default function ImageUpload({ previewUrl, onUpload }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const generateUploadUrl = useMutation(api.lots.generateUploadUrl);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setIsUploading(true);
    
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      onUpload(storageId, objectUrl);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Ошибка при загрузке фото");
    } finally {
      setIsUploading(false);
    }
  };

  if (previewUrl) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-[#E8E4DE] bg-[#F9F8F6] aspect-video">
        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={() => onUpload(null, null)}
          className="absolute top-3 right-3 bg-white/90 text-[#C93B25] p-2 rounded-lg hover:bg-white shadow-sm backdrop-blur-sm transition-colors active:scale-95"
        >
          <Trash className="h-5 w-5" weight="bold" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl border-2 border-dashed border-[#E8E4DE] bg-[#F9F8F6] hover:bg-[#F0EDE8] transition-colors aspect-video flex flex-col items-center justify-center text-[#7A7065] cursor-pointer group">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
      />
      {isUploading ? (
        <div className="flex flex-col items-center text-[#E04F33]">
          <div className="w-8 h-8 border-3 border-current border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-sm font-bold">Загрузка фото...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center p-4">
          <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-105 transition-transform">
            <UploadSimple className="h-6 w-6 text-[#E04F33]" weight="bold" />
          </div>
          <span className="text-sm font-bold text-[#2D2D2D]">Выберите фото для лота</span>
          <span className="text-xs text-[#7A7065] mt-1">JPEG, PNG до 5MB</span>
        </div>
      )}
    </div>
  );
}
