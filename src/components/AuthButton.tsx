'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { X } from 'lucide-react'

export default function AuthButton() {
    const [user, setUser] = useState<User | null>(null)
    const [nickname, setNickname] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showTooltip, setShowTooltip] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', user.id).single()
                if (profile?.nickname) setNickname(profile.nickname)
                setUser(user)
            }
            setIsLoading(false)
        }
        fetchUser()

        const dismissed = localStorage.getItem('login-tooltip-dismissed')
        if (!dismissed) setShowTooltip(true)
    }, [supabase])

    const dismissTooltip = () => {
        localStorage.setItem('login-tooltip-dismissed', '1')
        setShowTooltip(false)
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.reload()
    }

    if (isLoading) {
        return <div className="h-8 w-16 opacity-0"></div>
    }

    return user ? (
        <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700 font-medium whitespace-nowrap">
                {nickname || user.email?.split('@')[0]}님
            </span>
            <button
                onClick={handleSignOut}
                className="text-sm px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-semibold whitespace-nowrap"
            >
                로그아웃
            </button>
        </div>
    ) : (
        <div className="relative flex flex-col items-center">
            <a href="/login" className="text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition font-semibold whitespace-nowrap">
                로그인
            </a>
            {showTooltip && (
                <div
                    className="absolute top-full mt-1.5 bg-white text-gray-700 text-xs rounded-md px-2 py-1.5 whitespace-nowrap leading-tight text-center shadow-md border border-gray-200 z-[9999] cursor-pointer"
                    onClick={dismissTooltip}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); dismissTooltip() }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-400 hover:bg-gray-500 text-white rounded-full flex items-center justify-center"
                    >
                        <X size={10} />
                    </button>
                    비로그인은<br />기록이 날아가요 😲
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-l border-t border-gray-200 rotate-45" />
                </div>
            )}
        </div>
    )
}
