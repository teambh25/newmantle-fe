'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BarChart3, X } from 'lucide-react'
import { useAuthUser } from '@/hooks/useAuthUser'
import { useAutoDismiss } from '@/hooks/useAutoDismiss'

/** 통계 페이지를 한 번 알려줬는지. `/stats`에 들어가도 저장한다 (docs/tasks/ui/plan.md 5장) */
export const STATS_TOOLTIP_DISMISSED_KEY = 'stats-tooltip-dismissed'

export function markStatsTooltipDismissed() {
    try {
        localStorage.setItem(STATS_TOOLTIP_DISMISSED_KEY, '1')
    } catch {
        // 저장소를 쓸 수 없으면 이번 방문에서만 닫힌다
    }
}

interface StatsLinkProps {
    /** 다른 안내(첫 방문 모달)가 떠 있는 동안 통계 말풍선을 숨긴다 */
    hideTooltip?: boolean
}

/** 헤더 통계 아이콘. 로그인 유저에게는 최초 1회 통계 페이지 안내 말풍선을 띄운다 */
export default function StatsLink({ hideTooltip = false }: StatsLinkProps) {
    const { user } = useAuthUser()
    const [showTooltip, setShowTooltip] = useState(false)

    useEffect(() => {
        let dismissed: string | null = '1'
        try {
            dismissed = localStorage.getItem(STATS_TOOLTIP_DISMISSED_KEY)
        } catch {
            // 저장소를 못 읽으면 띄우지 않는다
        }
        if (!dismissed) setShowTooltip(true)
    }, [])

    const dismissTooltip = () => {
        markStatsTooltipDismissed()
        setShowTooltip(false)
    }

    // 보인 지 5초 뒤 닫은 것과 같이 처리 (docs/tasks/ui/plan.md 8장)
    const tooltipVisible = !!user && showTooltip && !hideTooltip
    useAutoDismiss(tooltipVisible, dismissTooltip)

    return (
        <div className="relative flex flex-col items-center">
            <Link
                href="/stats"
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                title="통계"
            >
                <BarChart3 size={20} />
            </Link>
            {tooltipVisible && (
                <div
                    className="absolute top-full mt-1.5 bg-white text-gray-700 text-xs rounded-md px-2 py-1.5 whitespace-nowrap leading-tight text-center shadow-md border border-gray-200 z-[9999] cursor-pointer"
                    onClick={dismissTooltip}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); dismissTooltip() }}
                        aria-label="통계 안내 닫기"
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-400 hover:bg-gray-500 text-white rounded-full flex items-center justify-center"
                    >
                        <X size={10} />
                    </button>
                    내 정답 기록을<br />볼 수 있어요 📊
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-l border-t border-gray-200 rotate-45" />
                </div>
            )}
        </div>
    )
}
