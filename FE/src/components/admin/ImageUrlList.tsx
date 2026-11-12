import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

function isValidHttpUrl(v: string) {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function ImageUrlList({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const urls = value.length > 0 ? value : [""];
  const [touched, setTouched] = useState<boolean[]>(() => urls.map(() => false));

  const update = (i: number, v: string) => {
    const next = [...urls];
    next[i] = v;
    onChange(next);
  };

  const add = () => {
    onChange([...urls, ""]);
    setTouched((t) => [...t, false]);
  };

  const remove = (i: number) => {
    const next = urls.filter((_, idx) => idx !== i);
    onChange(next.length > 0 ? next : [""]);
    setTouched((t) => t.filter((_, idx) => idx !== i));
  };

  const markTouched = (i: number) => {
    setTouched((t) => {
      const next = [...t];
      next[i] = true;
      return next;
    });
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">Ảnh sản phẩm (URL)</label>
      <div className="space-y-3">
        {urls.map((url, i) => {
          const trimmed = url.trim();
          const valid = trimmed === "" ? true : isValidHttpUrl(trimmed);
          const showError = touched[i] && trimmed !== "" && !valid;
          return (
            <div key={i} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => update(i, e.target.value)}
                    onBlur={() => markTouched(i)}
                    placeholder="https://example.com/image.jpg"
                    className={
                      "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 " +
                      (showError
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-200 focus:border-pink-500 focus:ring-pink-100")
                    }
                  />
                  {showError && (
                    <p className="mt-1 text-xs text-red-600">
                      URL không hợp lệ. Vui lòng nhập đường dẫn http(s) hợp lệ.
                    </p>
                  )}
                </div>
                {urls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="rounded-md border border-slate-200 p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                    aria-label="Xóa ảnh"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              {valid && trimmed !== "" && (
                <div className="mt-3">
                  <img
                    src={trimmed}
                    alt={`Ảnh ${i + 1}`}
                    className="h-28 w-28 rounded-md border border-slate-200 object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-pink-400 hover:text-pink-600"
      >
        <Plus className="h-4 w-4" /> Thêm URL ảnh
      </button>
    </div>
  );
}

export function sanitizeImageUrls(urls: string[]): string[] {
  return urls.map((u) => u.trim()).filter((u) => {
    if (!u) return false;
    try {
      const p = new URL(u).protocol;
      return p === "http:" || p === "https:";
    } catch {
      return false;
    }
  });
}
