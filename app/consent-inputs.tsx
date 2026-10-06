"use client";
import { PointerEvent, useEffect, useRef, useState } from "react";
const changeList = (list:string[], item:string) => list.includes(item) ? list.filter(value=>value!==item) : [...list,item];
export function SignaturePad({ onChange }: { onChange: (value: string) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  useEffect(() => {
    const element = canvas.current, context = element?.getContext("2d");
    if (!element || !context) return;
    const ratio = window.devicePixelRatio || 1;
    element.width = element.clientWidth * ratio; element.height = element.clientHeight * ratio;
    context.scale(ratio, ratio); context.lineWidth = 2.2; context.lineCap = "round"; context.lineJoin = "round";
  }, []);
  const point = (event: PointerEvent<HTMLCanvasElement>) => { const rect = event.currentTarget.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
  const clear = () => { const element = canvas.current, context = element?.getContext("2d"); if (element && context) context.clearRect(0, 0, element.width, element.height); setHasInk(false); onChange(""); };
  return <div className="signature"><canvas ref={canvas} aria-label="手寫簽名欄" onPointerDown={(event) => { const context = canvas.current?.getContext("2d"); if (!context) return; drawing.current = true; event.currentTarget.setPointerCapture(event.pointerId); const p = point(event); context.beginPath(); context.moveTo(p.x, p.y); }} onPointerMove={(event) => { if (!drawing.current) return; const element = canvas.current, context = element?.getContext("2d"); if (!element || !context) return; const p = point(event); context.lineTo(p.x, p.y); context.stroke(); setHasInk(true); onChange(element.toDataURL("image/png")); }} onPointerUp={() => { drawing.current = false; }} /><div><span>{hasInk ? "已完成簽名" : "請在上方手寫簽名"}</span><button type="button" onClick={clear}>清除簽名</button></div></div>;
}

export function CheckGroup({ title, items, selected, update, required = false }: { title: string; items: string[]; selected: string[]; update: (items: string[]) => void; required?: boolean }) {
  return <section className="contract-block"><h2>{title}{required && <em>＊</em>}</h2>{items.map((item) => <label className="big-check" key={item}><input type="checkbox" checked={selected.includes(item)} onChange={() => { const isNone = item === "以上皆非"; const next = isNone ? (selected.includes(item) ? [] : [item]) : changeList(selected.filter((entry) => entry !== "以上皆非"), item); update(next); }} /><span>{item}</span></label>)}</section>;
}

