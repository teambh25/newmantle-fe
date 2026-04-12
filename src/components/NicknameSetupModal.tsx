'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function NicknameSetupModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [nickname, setNickname] = useState('')
  const [isDuplicate, setIsDuplicate] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userContext, setUserContext] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserContext(session.user)
        const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', session.user.id).single()
        if (!profile?.nickname) {
          setIsOpen(true)
        }
      }
    }
    checkUser()
  }, [supabase])

  useEffect(() => {
    if (!nickname) {
      setIsDuplicate(null)
      return
    }

    setIsChecking(true)
    const timeout = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select('nickname').eq('nickname', nickname).single()
      setIsDuplicate(!!data)
      setIsChecking(false)
    }, 500)

    return () => clearTimeout(timeout)
  }, [nickname, supabase])

  const handleSubmit = async () => {
    if (!nickname || isDuplicate || isChecking || !userContext) return
    setIsSubmitting(true)

    // 1. Insert into profiles
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userContext.id,
      nickname
    })

    if (profileError) {
      // if it's a constraint violation
      if (profileError.code === '23505') {
        setIsDuplicate(true)
      } else {
        alert('오류가 발생했습니다: ' + profileError.message)
      }
      setIsSubmitting(false)
      return
    }

    // Update complete
    setIsOpen(false)
    window.location.reload()
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>환영합니다!</DialogTitle>
          <DialogDescription>
            뉴맨틀에서 사용할 닉네임을 설정해주세요.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Input
            placeholder="닉네임 입력"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={10}
          />
          {nickname && (
            <p className={`text-sm ${isDuplicate ? 'text-red-500' : 'text-green-500'}`}>
              {isChecking ? '확인 중...' :
                isDuplicate ? '이미 사용 중인 닉네임입니다.' :
                  '사용 가능한 닉네임입니다.'}
            </p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!nickname || isDuplicate === true || isChecking || isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 font-semibold"
          >
            {isSubmitting ? '저장 중...' : '시작하기'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
