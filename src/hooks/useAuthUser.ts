'use client'

import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { useEffect, useMemo, useState } from 'react'

type AuthInfo = { user: User | null; nickname: string | null }

// 헤더의 여러 컴포넌트(계정 영역, 통계 아이콘, 설정 메뉴)가 동시에 마운트되므로,
// 진행 중인 조회 하나를 같이 쓴다. 끝나면 비워서 다음 마운트는 새로 조회한다.
let inflight: Promise<AuthInfo> | null = null

function fetchAuthInfo(supabase: ReturnType<typeof createClient>): Promise<AuthInfo> {
    if (!inflight) {
        inflight = (async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return { user: null, nickname: null }
            const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', user.id).single()
            return { user, nickname: profile?.nickname ?? null }
        })().finally(() => {
            inflight = null
        })
    }
    return inflight
}

/** 로그인 유저와 닉네임. 헤더 계정 영역·통계 아이콘·설정 메뉴가 같이 쓴다 */
export function useAuthUser() {
    const supabase = useMemo(() => createClient(), [])
    const [user, setUser] = useState<User | null>(null)
    const [nickname, setNickname] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        fetchAuthInfo(supabase).then(({ user, nickname }) => {
            if (cancelled) return
            setUser(user)
            setNickname(nickname)
            setIsLoading(false)
        })
        return () => {
            cancelled = true
        }
    }, [supabase])

    const signOut = async () => {
        await supabase.auth.signOut()
        window.location.reload()
    }

    const displayName = user ? (nickname || user.email?.split('@')[0] || '') : null

    return { user, displayName, isLoading, signOut }
}
