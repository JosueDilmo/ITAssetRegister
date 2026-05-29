import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

interface InputRootProps extends ComponentProps<'div'> {
  error?: boolean
}
export function InputRoot({
  className,
  error = false,
  ...props
}: InputRootProps) {
  return (
    <div
      data-error={error}
      className={twMerge(
        'group flex items-center h-12 w-full gap-2 px-4 bg-gray-200 border border-gray-300 rounded-xl focus-within:border-blue data-[error=true]:border-red',
        className
      )}
      {...props}
    />
  )
}

interface InputIconProps extends ComponentProps<'span'> {}
export function InputIcon({ className, ...props }: InputIconProps) {
  return (
    <span
      className={twMerge(
        'text-gray-100/50 group-focus-within:text-blue group-[&:not(:has(input:placeholder-shown))]:text-gray-100 group-data-[error=true]:text-red',
        className
      )}
      {...props}
    />
  )
}

interface InputFieldProps extends ComponentProps<'input'> {}
export function InputField({ className, ...props }: InputFieldProps) {
  return (
    <input
      className={twMerge('flex-1 outline-0 placeholder-gray-100/40 text-gray-50', className)}
      {...props}
    />
  )
}
