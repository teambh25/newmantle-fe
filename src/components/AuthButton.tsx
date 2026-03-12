import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthButton() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const signOut = async () => {
        'use server'
        const supabase = createClient()
        await supabase.auth.signOut()
        return redirect('/')
    }

    return user ? (
        <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700 font-medium">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}님
            </span>
            <form action={signOut}>
                <button className="text-sm px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-semibold">
                    로그아웃
                </button>
            </form>
        </div>
    ) : (
        <a href="/login" className="text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition font-semibold">
            로그인
        </a>
    )
}
