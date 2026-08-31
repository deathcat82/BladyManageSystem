"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type Photo = { id: string; stage: "before" | "after" | "supplementary"; created_at: string };
const label = { before: "術前", after: "術後", supplementary: "補充照" } as const;
const asDataUrl = (file: File) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error("無法讀取照片。")); reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("無法讀取照片。")); reader.readAsDataURL(file); });

export default function ServicePhotoManager({ serviceId, onNotice }: { serviceId: string; onNotice: (message: string, failed?: boolean) => void }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [csrf, setCsrf] = useState("");
  const [stage, setStage] = useState<Photo["stage"]>("before");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Photo | null>(null);
  const load = async () => {
    const response = await fetch("/api/service-photos?serviceId=" + encodeURIComponent(serviceId), { credentials: "same-origin", cache: "no-store" });
    const result = await response.json() as { photos?: Photo[]; csrf?: string; error?: string };
    if (!response.ok) throw new Error(result.error || "無法讀取服務照片。");
    setPhotos(result.photos || []); setCsrf(result.csrf || "");
  };
  // The state updates run only after the asynchronous fetch resolves.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load().catch((error) => onNotice(error instanceof Error ? error.message : "無法讀取服務照片。", true)); }, [serviceId]);
  const choose = (event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] || null);
  const upload = async () => {
    if (!file || !csrf) return onNotice("照片功能需要先通過管理端驗證。", true);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return onNotice("請選擇 JPG、PNG 或 WebP 格式。", true);
    try { setBusy(true); const dataUrl = await asDataUrl(file); const response = await fetch("/api/service-photos", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json", "x-photo-csrf": csrf }, body: JSON.stringify({ action: "upload", serviceId, stage, originalName: file.name, dataUrl }) }); const result = await response.json() as { error?: string }; if (!response.ok) throw new Error(result.error || "照片上傳失敗。"); setFile(null); await load(); onNotice(label[stage] + "照片已加入服務紀錄。"); } catch (error) { onNotice(error instanceof Error ? error.message : "照片上傳失敗。", true); } finally { setBusy(false); }
  };
  const remove = async (photo: Photo) => {
    if (!window.confirm("確定移除這張照片？")) return;
    try { setBusy(true); const response = await fetch("/api/service-photos", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json", "x-photo-csrf": csrf }, body: JSON.stringify({ action: "delete", photoId: photo.id }) }); const result = await response.json() as { error?: string }; if (!response.ok) throw new Error(result.error || "照片移除失敗。"); await load(); onNotice("照片已移除。"); } catch (error) { onNotice(error instanceof Error ? error.message : "照片移除失敗。", true); } finally { setBusy(false); }
  };
  const pair = useMemo(() => ({ before: photos.find((photo) => photo.stage === "before"), after: photos.find((photo) => photo.stage === "after") }), [photos]);
  return <section className="photo-manager"><div className="photo-heading"><div><p className="eyebrow">SERVICE PHOTOS</p><h3>術前術後照片</h3></div><span className="photo-count">{photos.length} 張</span></div>{pair.before && pair.after && <div className="photo-compare"><button type="button" onClick={() => setPreview(pair.before!)}><img src={"/api/service-photos/" + pair.before.id} alt="術前照片" /><span>術前</span></button><button type="button" onClick={() => setPreview(pair.after!)}><img src={"/api/service-photos/" + pair.after.id} alt="術後照片" /><span>術後</span></button></div>}<div className="photo-upload"><label>照片分類<select value={stage} onChange={(event) => setStage(event.target.value as Photo["stage"])}><option value="before">術前</option><option value="after">術後</option><option value="supplementary">補充照</option></select></label><label>選擇照片<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={choose} /></label><button type="button" className="button primary" disabled={!file || busy} onClick={() => void upload()}>{busy ? "處理中…" : "上傳照片"}</button></div>{!photos.length && <p className="photo-empty">尚未加入照片。請先加入術前照，完成服務後再補上術後照。</p>}<div className="photo-grid">{photos.map((photo) => <figure key={photo.id}><button type="button" onClick={() => setPreview(photo)}><img src={"/api/service-photos/" + photo.id} alt={label[photo.stage] + "照片"} /></button><figcaption>{label[photo.stage]}<button type="button" className="text-button" disabled={busy} onClick={() => void remove(photo)}>移除</button></figcaption></figure>)}</div>{preview && <div className="photo-lightbox" role="dialog" aria-modal="true" onClick={() => setPreview(null)}><div onClick={(event) => event.stopPropagation()}><button type="button" className="button secondary" onClick={() => setPreview(null)}>關閉預覽</button><img src={"/api/service-photos/" + preview.id} alt={label[preview.stage] + "照片預覽"} /></div></div>}</section>;
}

