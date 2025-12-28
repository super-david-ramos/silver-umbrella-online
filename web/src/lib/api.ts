import { getToken } from './auth'

function getAuthHeaders() {
  const token = getToken()
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  }
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = getAuthHeaders()
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Request failed')
  }

  return res.json()
}

export const api = {
  notes: {
    list: () => fetchApi<any[]>('/notes'),
    get: (id: string) => fetchApi<any>(`/notes/${id}`),
    create: (data: { title?: string }) =>
      fetchApi<any>('/notes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { title?: string; pinned?: boolean }) =>
      fetchApi<any>(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchApi<void>(`/notes/${id}`, { method: 'DELETE' }),
  },
  blocks: {
    update: (id: string, data: any) =>
      fetchApi<any>(`/blocks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    create: (noteId: string, data: any) =>
      fetchApi<any>(`/notes/${noteId}/blocks`, { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchApi<void>(`/blocks/${id}`, { method: 'DELETE' }),
  },
}
