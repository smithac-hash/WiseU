import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/axios';

const QUERY_KEYS = {
  expenses: 'expenses',
  dailySummary: 'dailySummary',
  monthlySummary: 'monthlySummary',
};

export const useGetExpenses = (params = {}) => {
  const query = new URLSearchParams();
  if (params.month) query.set('month', params.month);
  if (params.category) query.set('category', params.category);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);

  return useQuery({
    queryKey: [QUERY_KEYS.expenses, params],
    queryFn: async () => {
      const { data } = await api.get(`/api/expenses?${query.toString()}`);
      return data;
    },
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense) => {
      const { data } = await api.post('/api/expenses', expense);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.expenses] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dailySummary] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.monthlySummary] });
      toast.success('Expense added!');
    },
    onError: (error) => {
      const data = error.response?.data;
      if (data?.error === 'BUDGET_EXCEEDED') {
        toast.error(`❌ ${data.message} Only ₹${data.remaining} remaining. Expense not added.`);
        return;
      }
      toast.error(data?.error || 'Failed to add expense');
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data } = await api.put(`/api/expenses/${id}`, updates);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.expenses] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dailySummary] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.monthlySummary] });
      toast.success('Expense updated!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update expense');
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/api/expenses/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.expenses] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dailySummary] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.monthlySummary] });
      toast.success('Expense deleted');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete expense');
    },
  });
};

export const useDailySummary = (date) => {
  return useQuery({
    queryKey: [QUERY_KEYS.dailySummary, date],
    queryFn: async () => {
      const { data } = await api.get(`/api/expenses/summary/daily?date=${date}`);
      return data;
    },
    enabled: !!date,
  });
};

export const useMonthlySummary = (month) => {
  return useQuery({
    queryKey: [QUERY_KEYS.monthlySummary, month],
    queryFn: async () => {
      const { data } = await api.get(`/api/expenses/summary/monthly?month=${month}`);
      return data;
    },
    enabled: !!month,
  });
};

export const useCalendarData = (month) => {
  return useQuery({
    queryKey: ['calendarData', month],
    queryFn: async () => {
      const { data } = await api.get(`/api/expenses/calendar?month=${month}`);
      return data;
    },
    enabled: !!month,
  });
};
