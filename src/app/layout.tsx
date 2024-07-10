import type { Metadata } from "next";
import AmplitudeInitializer from "@/components/AmplitudeInitializer";

import { Inter } from "next/font/google";
import "./globals.css";
import localFont from "next/font/local";

const inter = Inter({ subsets: ["latin"] });
const pretendard = localFont({
  src: "../static/fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  title: "뉴맨틀",
  description: "단어 맞추기 게임",
  openGraph: {
    title: "뉴맨틀 - 단어 맞추기 게임",
    description:
      "꼬맨틀을 개선한 새로운 단어 맞추기 게임, 뉴맨틀에 도전해보세요!",
    url: "https://newmantle.kr",
    siteName: "뉴맨틀",
    images: [
      {
        url: "/newmantle_opengraph.png", // app 디렉토리 내의 이미지 경로
        width: 1200,
        height: 630,
        alt: "뉴맨틀 - 단어 맞추기 게임",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="kr">
      <body className={pretendard.className}>
        <AmplitudeInitializer />
        {children}
      </body>
    </html>
  );
}
