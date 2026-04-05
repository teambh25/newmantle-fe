'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

export default function AuthButton() {
    const [user, setUser] = useState<User | null>(null)
    const [nickname, setNickname] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
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
    }, [supabase])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.reload()
    }

    if (isLoading) {
        // Return a stable minimum height/width skeleton or just empty to avoid flashing login/id
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
        <a href="/login" className="text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition font-semibold whitespace-nowrap">
            로그인
        </a>
    )
}
