import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { copy } from "@/lib/copy";
import { poppins, poppinsBrand } from "@/lib/fonts";
import "./globals.css";

const sans = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
});

const serif = Noto_Serif_KR({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: copy.app.name,
  description: copy.app.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${sans.variable} ${serif.variable} ${poppins.variable} ${poppinsBrand.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
