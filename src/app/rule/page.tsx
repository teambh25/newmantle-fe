import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { HINT_LIMIT_RANK } from "@/utils/gameRules";

// 유저용 게임 규칙. 내용 기준: docs/rules/user-guide.md (R-1 ~ R-9)

export const metadata: Metadata = {
  title: "게임 규칙 - 뉴맨틀",
  description: "뉴맨틀 플레이 방법과 순위, 힌트, 포기, 기록 규칙을 안내합니다.",
};

// 질문 + 짧은 답. 질문을 누르면 답이 펼쳐진다 (첫 항목만 열어 둠)
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
    question: "입력할 수 있는 단어는 어떤 단어예요?",
    paragraphs: [
      "완전한 한글 단어 중 명사, 동사, 형용사만 입력할 수 있어요. 활용된 형태는 안 되고 기본형으로 입력해야 해요 (예: 달리는, 달리고 → 달리다).",
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
    question: "정답은 어떻게 정해져요?",
    paragraphs: [
      "정답은 트렌드, 상식, 일상 용어 중에서 무작위로 정해지고, 매일 밤 12시(한국 시간)에 바뀌어요. 게임이 끝나면 결과창에서 정답의 카테고리와 그 단어가 쓰인 예문을 볼 수 있어요.",
    ],
  },
  {
    question: "포기하면 어떻게 돼요?",
    paragraphs: [
      "포기하면 정답이 공개돼요. 시도 횟수는 포기할 때까지 입력한 횟수로 기록돼요.",
    ],
  },
  {
    question: "정답을 맞히거나 포기한 뒤에도 입력할 수 있어요?",
    paragraphs: ["정답을 맞히거나 포기한 뒤에도 단어를 더 입력해볼 수 있지만, 기록에는 남지 않아요."],
  },
  {
    question: "기록은 얼마나 남아요?",
    paragraphs: [
      "로그인하지 않으면 기록은 7일 뒤에 사라져요. 7일 안에 로그인하면 그동안의 기록이 계정으로 옮겨지고, 캘린더와 요약 통계로 계속 볼 수 있어요.",
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

        <div className="w-full max-w-2xl divide-y divide-gray-200 border-y border-gray-200 mb-10">
          {sections.map((section, index) => (
            <details key={section.question} open={index === 0} className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-2 text-lg font-semibold text-gray-800 hover:text-blue-600">
                {section.question}
                <span
                  aria-hidden
                  className="text-gray-400 transition-transform group-open:rotate-45 text-2xl leading-none"
                >
                  +
                </span>
              </summary>
              <div className="space-y-2 pt-2 pr-6">
                {section.paragraphs.map((paragraph, i) => (
                  <p key={i} className="text-gray-600 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </details>
          ))}
        </div>

        <Link href="/" className="mb-16 text-base font-semibold text-blue-600 hover:underline">
          게임하러 가기
        </Link>
      </main>
    </div>
  );
}
