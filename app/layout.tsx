import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "柔霧工作室｜客戶預約與同意管理",
  description: "霧眉客戶建檔、術前同意與服務紀錄管理。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant-TW"><body>{children}</body></html>;
}