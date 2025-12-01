'use client'
import { useRouter } from 'next/navigation'
import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

interface BoxRootProps extends ComponentProps<'div'> {
  error?: boolean
  goToAsset?: string
}
export function BoxRoot({
  className,
  goToAsset,
  error = false,
  ...props
}: BoxRootProps) {
  return (
    <div
      data-error={error}
      className={twMerge(
        'group flex items-center h-8 w-full gap-2 mb-2 border-b-2 data-[error=true]:border-red',
        className
      )}
      {...props}
    />
  )
}

interface BoxIconProps extends ComponentProps<'span'> {}
export function BoxIcon({ className, ...props }: BoxIconProps) {
  return (
    <span
      className={twMerge(
        'text-green-900 group-data-[error=true]:text-red',
        className
      )}
      {...props}
    />
  )
}

interface BoxFieldProps extends ComponentProps<'span'> {
  goToAsset?: string
}
export function BoxField({ className, goToAsset, ...props }: BoxFieldProps) {
  const router = useRouter()
  const handleClick = () => {
    if (goToAsset) {
      router.push(`/manager/${goToAsset}`)
    }
  }
  return (
    <span
      onClick={handleClick}
      className={twMerge(
        'flex-1 outline-0 text-green-500 group-data-[error=true]:text-red',
        className
      )}
      {...props}
    />
  )
}
