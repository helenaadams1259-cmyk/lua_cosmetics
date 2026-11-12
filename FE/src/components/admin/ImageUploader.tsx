import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { Upload, X, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import {
  ACCEPTED_EXTENSIONS,
  isValidImageFile,
  uploadImages,
} from "@/lib/upload-service";

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
};

export function ImageUploader({ value, onChange, label = "Hình ảnh sản phẩm" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const invalid = files.filter((f) => !isValidImageFile(f));
    if (invalid.length > 0) {
      toast.error("Chỉ hỗ trợ ảnh định dạng JPG, PNG, WEBP");
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const urls = await uploadImages(files, setProgress);
      onChange([...value, ...urls]);
      toast.success(`Đã tải lên ${urls.length} ảnh`);
    } catch {
      toast.error("Tải ảnh lên thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition " +
          (dragOver
            ? "border-pink-500 bg-pink-50"
            : "border-slate-300 bg-slate-50 hover:border-pink-400 hover:bg-pink-50/50")
        }
      >
        {uploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
            <p className="text-sm text-slate-600">Đang tải ảnh... {progress}%</p>
            <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-pink-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-slate-400" />
            <p className="text-sm font-medium text-slate-700">
              Kéo và thả ảnh vào đây hoặc bấm để chọn
            </p>
            <p className="text-xs text-slate-500">Chỉ hỗ trợ JPG, PNG, WEBP</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          multiple
          className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
        />
      </div>

      {value.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {value.map((url, idx) => (
            <div
              key={idx}
              className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white"
            >
              <img src={url} alt={`Ảnh ${idx + 1}`} className="h-full w-full object-cover" />
              {idx === 0 && (
                <span className="absolute left-1 top-1 rounded bg-pink-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Ảnh chính
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(idx);
                }}
                title="Xóa ảnh"
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:border-pink-400 hover:text-pink-500"
          >
            <ImagePlus className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
}
