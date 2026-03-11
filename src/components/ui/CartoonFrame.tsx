import React from 'react';
import { cn } from "@/lib/utils";

interface CartoonFrameProps {
  children: React.ReactNode;
  className?: string;
  bgColor?: string;
  shadow?: boolean;
  label?: React.ReactNode;
}

export const CartoonFrame = ({ 
  children, 
  className = "", 
  bgColor = "bg-white",
  shadow = true,
  label,
}: CartoonFrameProps) => {
  return (
    <div className={cn("relative z-0", className)}>
      {/* 라벨 탭 */}
      {label && (
        <div className="absolute bottom-[calc(100%-4px)] left-0 px-3 pt-2 pb-0.5 border-[4px] border-b-0 border-game-brown bg-white text-xs sm:text-sm font-black uppercase tracking-widest rounded-t-sm z-20 leading-none">
          {label}
        </div>
      )}

      {/* 테두리와 배경 레이어 */}
      <div 
        className={`absolute inset-0 z-[-1] border-[4px] border-game-brown ${bgColor} rounded-sm`}
      />
      
      {/* 하드 섀도우 레이어 (선택 사항) */}
      {shadow && (
        <div 
          className="absolute inset-0 z-[-2] bg-game-brown translate-x-[6px] translate-y-[6px] rounded-sm"
        />
      )}
      
      {/* 실제 콘텐츠 */}
      <div className="relative z-10 w-full h-full text-game-brown">
        {children}
      </div>
    </div>
  );
};
