import localFont from "next/font/local";

export const poppins = localFont({
  src: [
    {
      path: "../../public/fonts/poppins-regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/poppins-semibold.ttf",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-poppins",
  display: "swap",
  preload: false,
  adjustFontFallback: "Arial",
  fallback: ["Pretendard", "Apple SD Gothic Neo", "sans-serif"],
});

export const poppinsBrand = localFont({
  src: "../../public/fonts/poppins-semibold.ttf",
  weight: "600",
  display: "block",
  adjustFontFallback: "Arial",
  variable: "--font-brand",
});
