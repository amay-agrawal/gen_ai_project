import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './api';

// Auth
export const useUser = () => 
  useQuery({
    queryKey: ['user'],
    queryFn: async () => apiClient.get('/auth/me'),
    retry: false,
  });

// Dashboard
export const useDashboardSummary = () =>
  useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => apiClient.get('/dashboard/summary'),
  });

export const useDailyChart = () =>
  useQuery({
    queryKey: ['dashboard', 'charts', 'daily'],
    queryFn: async () => apiClient.get('/dashboard/charts/daily'),
  });

export const useCompanyTrends = () =>
  useQuery({
    queryKey: ['dashboard', 'charts', 'trends'],
    queryFn: async () => apiClient.get('/dashboard/charts/response-trends'),
  });

// Contacts / CRM
export const useContacts = (page = 1, limit = 20, search = '') =>
  useQuery({
    queryKey: ['contacts', page, limit, search],
    queryFn: async () => apiClient.get('/contacts', { params: { page, limit, search } }),
  });

export const useCreateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => apiClient.post('/contacts', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  });
};

// Campaigns / Voice
export const useParseVoice = () =>
  useMutation({
    mutationFn: async (transcript) => apiClient.post('/voice/parse', { transcript }),
  });

export const useGenerateEmail = () =>
  useMutation({
    mutationFn: async (data) => apiClient.post('/email/generate', data),
  });

export const useGenerateBulkEmail = () =>
  useMutation({
    mutationFn: async (data) => apiClient.post('/email/generate-bulk', data),
  });

export const useDrafts = () =>
  useQuery({
    queryKey: ['campaign-drafts'],
    queryFn: async () => apiClient.get('/email/drafts'),
  });

export const useApproveDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draftId) => apiClient.post(`/email/${draftId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-drafts'] });
    },
  });
}

export const useSendEmails = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draftIds) => apiClient.post('/email/send', { draftIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-drafts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// RAG / Knowledge
export const useDocuments = () =>
  useQuery({
    queryKey: ['documents'],
    queryFn: async () => apiClient.get('/documents'),
  });

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData) => 
      apiClient.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => apiClient.delete(`/documents/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });
}

// Reply Inbox
export const useInbox = (page = 1, limit = 20) =>
  useQuery({
    queryKey: ['inbox', page, limit],
    queryFn: async () => apiClient.get('/replies/inbox', { params: { page, limit } }),
  });

export const useSyncInbox = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => apiClient.post('/replies/sync'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });
};

export const useReplySuggest = () =>
  useMutation({
    mutationFn: async (messageId) => apiClient.post(`/replies/${messageId}/suggest`),
  });
