'use client'

import { useAuthUser } from '@/hooks/useAuthUser'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useAutoDismiss } from '@/hooks/useAutoDismiss'

interface AuthButtonProps {
    /** 다른 안내(첫 방문 모달)가 떠 있는 동안 로그인 말풍선을 숨긴다 */
    hideTooltip?: boolean
    /** 말풍선 정렬. 화면 오른쪽 끝에 있으면 "end"로 버튼 오른쪽에 맞춰 화면 밖으로 잘리지 않게 (docs/tasks/ui/plan.md 10장) */
    tooltipAlign?: 'center' | 'end'
    /** 결과창이 열린 동안 로그인 버튼을 어두운 배경 위로 띄우고 저장 안내 말풍선 (docs/tasks/ui/result-box.md 요구사항 8) */
    spotlight?: boolean
}

const SPOTLIGHT_TOOLTIP_ID = 'login-spotlight-tooltip'

export default function AuthButton({ hideTooltip = false, tooltipAlign = 'center', spotlight = false }: AuthButtonProps) {
    const { user, displayName, isLoading } = useAuthUser()
    const [showTooltip, setShowTooltip] = useState(false)

    useEffect(() => {
        const dismissed = localStorage.getItem('login-tooltip-dismissed')
        if (!dismissed) setShowTooltip(true)
    }, [])

    const dismissTooltip = () => {
        localStorage.setItem('login-tooltip-dismissed', '1')
        setShowTooltip(false)
    }

    // 보인 지 5초 뒤 닫은 것과 같이 처리 (docs/tasks/ui/plan.md 8장)
    // 강조 말풍선이 떠 있는 동안 기존 말풍선은 숨긴다 (5초 카운트도 멈춤)
    const tooltipVisible = !isLoading && !user && showTooltip && !hideTooltip && !spotlight
    const spotlightVisible = !isLoading && !user && spotlight
    useAutoDismiss(tooltipVisible, dismissTooltip)

    if (isLoading) {
        return <div className="h-8 w-16 opacity-0"></div>
    }

    // 로그아웃은 설정 메뉴에 있다 (docs/tasks/ui/plan.md 1장). 헤더에는 닉네임만, 길면 말줄임
    return user ? (
        <span
            className="flex items-center text-sm text-gray-900 font-medium whitespace-nowrap min-w-0"
            title={`${displayName}님`}
        >
            <span className="truncate max-w-[7rem]">{displayName}</span>님
        </span>
    ) : (
        <div className="relative flex flex-col items-center">
            {/* 강조: 모달 배경(z-50) 위로 올리고, 모달이 막은 클릭(body pointer-events: none)도 받는다 */}
            <a
                href="/login"
                aria-describedby={spotlightVisible ? SPOTLIGHT_TOOLTIP_ID : undefined}
                className={`text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition font-semibold whitespace-nowrap ${spotlightVisible ? 'relative z-[60] pointer-events-auto ring-2 ring-white shadow-[0_0_18px_6px_rgba(147,197,253,0.75)]' : ''}`}
            >
                로그인
            </a>
            {spotlightVisible && (
                <div
                    id={SPOTLIGHT_TOOLTIP_ID}
                    className={`absolute top-full mt-2.5 ${tooltipAlign === 'end' ? 'right-0' : ''} bg-white text-gray-800 text-xs sm:text-sm font-medium rounded-md px-2.5 py-1.5 whitespace-nowrap leading-tight shadow-lg z-[9999]`}
                >
                    로그인해서 오늘의 플레이 기록을 저장하세요!
                    <div className={`absolute -top-1 ${tooltipAlign === 'end' ? 'right-6' : 'left-1/2 -translate-x-1/2'} w-2 h-2 bg-white rotate-45`} />
                </div>
            )}
            {tooltipVisible && (
                <div
                    className={`absolute top-full mt-1.5 ${tooltipAlign === 'end' ? 'right-0' : ''} bg-white text-gray-700 text-xs rounded-md px-2 py-1.5 whitespace-nowrap leading-tight text-center shadow-md border border-gray-200 z-[9999] cursor-pointer`}
                    onClick={dismissTooltip}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); dismissTooltip() }}
                        aria-label="로그인 안내 닫기"
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-400 hover:bg-gray-500 text-white rounded-full flex items-center justify-center"
                    >
                        <X size={10} />
                    </button>
                    비로그인은<br />기록이 날아가요 😲
                    <div className={`absolute -top-1 ${tooltipAlign === 'end' ? 'right-6' : 'left-1/2 -translate-x-1/2'} w-2 h-2 bg-white border-l border-t border-gray-200 rotate-45`} />
                </div>
            )}
        </div>
    )
}
