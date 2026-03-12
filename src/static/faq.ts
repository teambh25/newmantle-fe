export interface FAQ {
  question: string;
  answer: string;
}

export const faqs: FAQ[] = [
  {
    question: "어떻게 플레이하나요?",
    answer:
      "1. 정답일 것 같은 아무 단어나 입력해보세요. 2. 입력한 단어의 유사도를 확인하세요. 3. 유사도는 정답 단어와 비슷한 정도입니다. 4. 유사도가 더 높은 단어를 추측해서 계속 입력해보세요.",
  },
];
