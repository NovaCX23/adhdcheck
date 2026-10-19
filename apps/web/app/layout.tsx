import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "ADHDCheck · Nu mai ghici dacă e „doar o fază”",
  description:
    "Un joc de 14 minute cu licurici care îți arată dacă merită o evaluare de specialitate pentru copilul tău (6–12 ani). Nu este un diagnostic.",
  openGraph: {
    title: "ADHDCheck",
    description:
      "Un joc de 14 minute care te ajută să decizi dacă merită o evaluare de specialitate. Pentru părinții copiilor de 6–12 ani.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1430",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className={`${fredoka.variable} ${nunito.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
