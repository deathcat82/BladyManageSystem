import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lulu Studio 紋繡美學｜預約與客戶管理",
  description: "Lulu Studio 紋繡美學的客戶同意書、預約與服務紀錄管理 Demo。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant-TW"><body>{children}</body></html>;
}