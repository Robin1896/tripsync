'use client'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getUserName } from '../../lib/user'
import { Loader } from '../../components/Loader'

export default function JoinRedirectPage() {
  const { code } = useParams<{ code: string }>()
  const router   = useRouter()

  useEffect(() => {
    const name = getUserName()
    if (!name) {
      // No name yet → go to home with join flow pre-filled
      router.replace(`/?join=${code}`)
    } else {
      // Already have a name → go straight to lobby
      router.replace(`/lobby/${code}`)
    }
  }, [code, router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader msg="Uitnodiging verwerken…" />
    </div>
  )
}
