import type { Metadata } from "next";
import { Inter, Anton } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Suhbah Soccer — Where Football Meets Faith",
    template: "%s | Suhbah Soccer",
  },
  description:
    "Elite youth soccer training combined with Islamic character development in Redmond, WA. Building champions on and off the pitch.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${anton.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
