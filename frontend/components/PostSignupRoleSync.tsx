'use client'

import { useEffect } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { setUserRole } from '@/lib/api'

export function PostSignupRoleSync() {
  const { getToken } = useAuth()
  const { isSignedIn } = useUser()

  useEffect(() => {
    if (!isSignedIn) return
    const pendingRole = localStorage.getItem('pendingRole')
    if (!pendingRole) return

    async function syncRole() {
      try {
        const token = await getToken()
        if (!token) return // session not ready yet — keep pendingRole for next render
        await setUserRole(token, pendingRole as string)
        localStorage.removeItem('pendingRole') // only clear on success
      } catch {
        // Silent fail — will retry on next render while pendingRole remains
      }
    }
    syncRole()
  }, [isSignedIn, getToken])

  return null
}
