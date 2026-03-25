'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

export default function AuthButton() {
    const [user, setUser] = useState<User | null>(null)
    const supabase = createClient()

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        fetchUser()
    }, [supabase])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.reload()
    }

    return user ? (
        <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700 font-medium">
                {user.user_metadata?.nickname || user.email?.split('@')[0]}님
            </span>
            <button 
                onClick={handleSignOut}
                className="text-sm px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-semibold"
            >
                로그아웃
            </button>
        </div>
    ) : (
        <a href="/login" className="text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition font-semibold">
            로그인
        </a>
    )
}
