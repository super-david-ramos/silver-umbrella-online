import { supabase } from './supabase'

async function getAuthHeaders(accessToken?: string) {
  if (accessToken) {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  }
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  }
}

interface FetchApiOptions extends RequestInit {
  accessToken?: string
}

async function fetchApi<T>(path: string, options?: FetchApiOptions): Promise<T> {
  const { accessToken, ...restOptions } = options || {}
  const headers = await getAuthHeaders(accessToken)
  const res = await fetch(`/api${path}`, {
    ...restOptions,
    headers: { ...headers, ...restOptions?.headers },
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Request failed')
  }

  return res.json()
}

export interface UserInitResponse {
  initialized: boolean
  created?: boolean
  user: {
    id: string
    email: string
  }
  workspace: {
    id: string
    name: string
    role: string
  }
  tutorialNoteId?: string
}

export const api = {
  user: {
    init: (accessToken?: string) => fetchApi<UserInitResponse>('/user/init', { method: 'POST', accessToken }),
    me: () => fetchApi<{ user: any; workspace: any }>('/user/me'),
  },
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
