'use client'
import { toast } from 'react-toastify'

import { useEffect } from 'react'

export function ShowAccessDeniedMessage() {
  useEffect(() => {
    toast.error('You do not have permission to access this page.')
  }, [])

  return <div className="flex items-center justify-center h-full" />
}
