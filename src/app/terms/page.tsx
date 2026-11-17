import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

// 이용약관 초안. 무료 웹게임이라 짧게 쓴다. [확인 필요] 항목은 운영자가 확정해야 한다.

export const metadata: Metadata = {
  title: "이용약관 - 뉴맨틀",
  description: "뉴맨틀 이용 조건과 단어 자료의 출처를 안내합니다.",
};

const OPENDICT_URL = "https://opendict.korean.go.kr/main";
const CC_LICENSE_URL = "https://creativecommons.org/licenses/by-sa/2.0/kr/";

interface Article {
  title: string;
  paragraphs: React.ReactNode[];
}

const articles: Article[] = [
  {
    title: "제1조 (목적)",
    paragraphs: ["이 약관은 뉴맨틀(이하 \"서비스\") 이용에 관한 기본 사항을 정합니다."],
  },
  {
    title: "제2조 (서비스 내용)",
    paragraphs: [
      "서비스는 매일 정해지는 정답 단어를 단어 간 유사도를 참고해 맞히는 무료 단어 게임입니다.",
    ],
  },
  {
    title: "제3조 (이용)",
    paragraphs: [
      "서비스는 가입 없이 이용할 수 있습니다. 로그인은 구글 계정으로만 할 수 있습니다.",
    ],
  },
  {
    title: "제4조 (단어 자료)",
    paragraphs: [
      <>
        서비스에서 사용하는 단어들은{" "}
        <a
          href={OPENDICT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          우리말샘
        </a>
        (국립국어원)의 자료를 바탕으로 합니다. 저작자는 국립국어원이며, 출처는 우리말샘입니다.
      </>,
      <>
        해당 자료는{" "}
        <a
          href={CC_LICENSE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          크리에이티브 커먼즈 저작자표시-동일조건변경허락 2.0 대한민국 라이선스
        </a>
        에 따라 이용합니다.
      </>,
    ],
  },
  {
    title: "제5조 (시행)",
    paragraphs: ["이 약관은 공개한 날부터 적용합니다."],
  },
];

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-background text-foreground">
      <main className="flex-grow flex flex-col items-center justify-start p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-2xl flex flex-row items-center mb-8 mt-2 sm:mt-0 gap-2">
          <Link
            href="/"
            aria-label="메인으로"
            className="-ml-2 w-10 h-10 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-600 leading-none">
            이용약관
          </h1>
        </div>

        <div className="w-full max-w-2xl space-y-8">
          {articles.map((article) => (
            <section key={article.title}>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">{article.title}</h2>
              <div className="space-y-2">
                {article.paragraphs.map((paragraph, i) => (
                  <p key={i} className="text-gray-600 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <Link href="/" className="mt-10 mb-16 text-base font-semibold text-blue-600 hover:underline">
          게임하러 가기
        </Link>
      </main>
    </div>
  );
}
