import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "daymark | Your day, in view",
  description: "A quiet, focused todo list for keeping your day visible.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
