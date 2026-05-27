'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { postApiTicketsIdComments } from '@/http/api'
import { Button } from '@/shared/components/button'

const schema = z.object({
  body: z.string().min(1, 'Comment cannot be empty'),
})
type FormData = z.infer<typeof schema>

interface Props {
  ticketId: string
  onCommentAdded: () => void
}

export function AddCommentForm({ ticketId, onCommentAdded }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setSubmitError(null)
    try {
      await postApiTicketsIdComments(ticketId, { body: data.body })
      reset()
      onCommentAdded()
    } catch {
      setSubmitError('Failed to post comment. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <textarea
        {...register('body')}
        rows={3}
        placeholder="Add a comment..."
        className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
      />
      {errors.body && (
        <p className="text-xs text-red-400">{errors.body.message}</p>
      )}
      {submitError && (
        <p className="text-xs text-red-400">{submitError}</p>
      )}
      <Button type="submit" disabled={isSubmitting} className="h-10 w-auto px-4 text-sm disabled:opacity-50">
        {isSubmitting ? 'Posting...' : 'Post Comment'}
      </Button>
    </form>
  )
}
