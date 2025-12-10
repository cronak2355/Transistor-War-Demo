import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Transistor War",
  description: "Legacy vs Modern - 1v1 전략 게임",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
