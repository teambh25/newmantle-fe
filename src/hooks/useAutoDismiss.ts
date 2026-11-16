'use client'

import { useEffect, useRef } from 'react'

/** 헤더 말풍선(로그인·통계)이 보이는 시간 (docs/tasks/ui/header/plan.md 5) */
export const HEADER_TOOLTIP_MS = 5000

/**
 * 말풍선이 실제로 보이기 시작한 뒤 ms가 지나면 dismiss를 부른다.
 * 다른 안내 때문에 숨어 있는 동안(visible=false)은 세지 않는다.
 */
export function useAutoDismiss(visible: boolean, dismiss: () => void, ms = HEADER_TOOLTIP_MS) {
    const dismissRef = useRef(dismiss)
    dismissRef.current = dismiss

    useEffect(() => {
        if (!visible) return
        const timer = setTimeout(() => dismissRef.current(), ms)
        return () => clearTimeout(timer)
    }, [visible, ms])
}
