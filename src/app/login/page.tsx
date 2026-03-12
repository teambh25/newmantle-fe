'use client'

import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
    const supabase = createClient()

    const handleGoogleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                <h1 className="text-3xl font-bold mb-2 text-blue-600">뉴맨틀</h1>
                <p className="text-gray-500 mb-8 text-center text-sm">
                    소셜 계정으로 로그인하고<br />더 다양한 기능을 즐겨보세요!
                </p>

                <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    Google로 계속하기
                </button>

                <a href="/" className="mt-6 text-sm text-gray-500 hover:text-gray-700 underline underline-offset-4">
                    홈으로 돌아가기
                </a>
            </div>
        </div>
    )
}
