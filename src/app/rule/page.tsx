import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { HINT_LIMIT_RANK } from "@/utils/gameRules";

// 유저용 게임 규칙. 내용 기준: docs/spec/rules.md (R-1 ~ R-9)

export const metadata: Metadata = {
  title: "게임 규칙 - 뉴맨틀",
  description: "뉴맨틀 플레이 방법과 순위, 힌트, 포기, 기록 규칙을 안내합니다.",
};

const ORIGINAL_GAME_URL = "https://semantle-ko.newsjel.ly/";

// 질문 + 짧은 답을 나열한다 (접고 펴는 FAQ 아님)
interface Section {
  question: string;
  paragraphs: React.ReactNode[];
}

const sections: Section[] = [
  {
    question: "어떻게 플레이해요?",
    paragraphs: [
      "매일 정답 단어가 하나 있어요. 단어를 입력하면 정답과 얼마나 비슷한지 유사도와 순위를 알려줘요. 순위를 참고해 더 가까운 단어를 찾아 정답을 맞혀보세요.",
      "게임에서 쓰는 단어 목록에 없는 단어를 입력하면 \"없는 단어\"라고 알려줘요. 이때는 시도 횟수에 들어가지 않아요.",
    ],
  },
  {
    question: "순위와 힌트는 뭐예요?",
    paragraphs: [
      "순위는 1위부터 999위까지예요. 1위는 정답 다음으로 정답과 가장 가까운 단어예요. 1000위 밖의 단어는 \"순위 밖\"으로 표시돼요.",
      `막힐 때는 힌트를 눌러보세요. 지금까지 찾은 단어보다 정답에 더 가까운 단어를 알려줘요. ${HINT_LIMIT_RANK}위 이내의 단어를 찾으면 더 이상 힌트를 받을 수 없고, 힌트를 사용한 횟수는 기록에 남아요.`,
    ],
  },
  {
    question: "정답은 언제 바뀌어요?",
    paragraphs: ["매일 밤 12시(한국 시간)에 바뀌어요."],
  },
  {
    question: "포기하면 어떻게 돼요?",
    paragraphs: [
      "정답이 공개돼요. 시도 횟수는 포기할 때까지 입력한 횟수로 기록되고, 그 뒤에 입력한 단어는 기록되지 않아요.",
    ],
  },
  {
    question: "정답을 맞힌 뒤에도 입력할 수 있어요?",
    paragraphs: ["단어를 더 입력해볼 수 있지만 기록에는 남지 않아요."],
  },
  {
    question: "기록은 얼마나 남아요?",
    paragraphs: [
      "로그인하지 않으면 기록은 7일 뒤에 사라져요. 7일 안에 로그인하면 그동안의 기록이 계정으로 옮겨져요. 로그인하면 캘린더와 요약 통계가 계속 남아요.",
    ],
  },
  {
    question: "친구와 겨룰 수 있어요?",
    paragraphs: ["결과를 공유하면 링크를 받은 친구와 시도 횟수를 비교할 수 있어요."],
  },
  {
    question: "꼬맨틀과는 어떤 관계예요?",
    paragraphs: [
      <>
        뉴맨틀은 꼬맨틀의 개선된 버전이에요. 개선된 모델로 더 의미 있는 유사도를
        보여줘요.{" "}
        <a
          href={ORIGINAL_GAME_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          꼬맨틀 바로가기
        </a>
      </>,
    ],
  },
];

export default function RulePage() {
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
            게임 규칙
          </h1>
        </div>

        <div className="w-full max-w-2xl space-y-8 pb-16">
          {sections.map((section) => (
            <section key={section.question}>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">{section.question}</h2>
              <div className="space-y-2">
                {section.paragraphs.map((paragraph, i) => (
                  <p key={i} className="text-gray-600 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <Link href="/" className="text-sm text-gray-500 hover:text-blue-600 hover:underline">
          게임하러 가기
        </Link>
      </main>
    </div>
  );
}
