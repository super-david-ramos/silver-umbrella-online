import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useNotes() {
  return useQuery({
    queryKey: ['notes'],
    queryFn: api.notes.list,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.notes.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.notes.delete,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notes'] })
      const previous = queryClient.getQueryData(['notes'])

      queryClient.setQueryData(['notes'], (old: any[]) =>
        old?.filter((note) => note.id !== id)
      )

      return { previous }
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['notes'], context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
