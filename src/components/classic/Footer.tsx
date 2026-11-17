import React from "react";
import { Github } from "lucide-react";

// 배경은 전체 폭, 내용은 게임 화면과 같은 폭(max-w-2xl)으로 가운데 정렬 (docs/tasks/ui/footer/plan.md)
const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-6 py-4 bg-gray-100">
      <div className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center gap-2">
        <div className="flex space-x-4">
          <a href="/terms" className="text-sm text-blue-600 hover:underline">
            이용약관
          </a>
          <a href="#" className="text-sm text-blue-600 hover:underline">
            개인정보처리방침
          </a>
          <a href="mailto:teambh25@gmail.com" className="text-sm text-blue-600 hover:underline">
            문의하기
          </a>
        </div>
        {/* 원작 출처 표기 */}
        <p className="text-center text-xs text-gray-400">
          <a
            href="https://github.com/teambh25/newmantle-fe"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="소스코드 (GitHub)"
            title="소스코드 (GitHub)"
            className="inline-flex align-middle hover:text-gray-600"
          >
            <Github size={14} aria-hidden="true" />
          </a>{" "}
          뉴맨틀은{" "}
          <a
            href="https://semantle-ko.newsjel.ly/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-gray-600"
          >
            꼬맨틀
          </a>
          에서 영감을 받아 만들었어요.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
