import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff Portal",
  description: "Visitor management and intercom platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
