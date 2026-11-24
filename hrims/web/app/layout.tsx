import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "شركة التضامن للتامين التجاري",
  description: "بوابة الموارد البشرية",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
