import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useNote(id: string) {
  return useQuery({
    queryKey: ['note', id],
    queryFn: () => api.notes.get(id),
    enabled: !!id,
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; pinned?: boolean }) =>
      api.notes.update(id, data),
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: ['note', id] })
      const previous = queryClient.getQueryData(['note', id])

      queryClient.setQueryData(['note', id], (old: any) => ({
        ...old,
        ...data,
      }))

      return { previous }
    },
    onError: (_err, { id }, context) => {
      queryClient.setQueryData(['note', id], context?.previous)
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['note', id] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}

export function useUpdateBlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; content?: any; type?: string }) =>
      api.blocks.update(id, data),
    onSettled: () => {
      // Invalidate the parent note
      queryClient.invalidateQueries({ queryKey: ['note'] })
    },
  })
}
