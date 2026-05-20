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
        'group flex items-center h-8 w-full gap-2 mb-2',
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
        'inline-block w-2 h-2 rounded-full bg-green-500 animate-status-dot shrink-0 group-data-[error=true]:bg-red',
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
        'flex-1 outline-0 text-green-500 text-xs uppercase tracking-widest font-mono group-data-[error=true]:text-red',
        goToAsset ? 'hover:underline hover:cursor-pointer' : '',
        className
      )}
      {...props}
    />
  )
}
