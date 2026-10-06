import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Lulu Studio紋繡美學", description: "Lulu Studio紋繡美學客戶管理與一次性同意書系統" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="zh-Hant-TW"><body>{children}</body></html>; }