'use client'
import { useRouter } from 'next/navigation'
import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

interface ButtonProps extends ComponentProps<'button'> {
  routeId?: string
}

export function Button({ routeId, className, ...props }: ButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (routeId) {
      router.push(`manager/${routeId}`)
    }
  }
  return (
    <button
      onClick={handleClick}
      className={twMerge(
        'flex justify-between items-center font-heading px-5 h-12 w-full bg-gray-500 text-blue font-semibold rounded-xl cursor-pointer transition-colors duration-300 hover:text-gray-900 hover:bg-blue',
        className
      )}
      {...props}
    />
  )
}
