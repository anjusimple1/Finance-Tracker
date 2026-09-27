import { api } from './api';

export async function fetchTransactions() {
  const { data } = await api.get('/transactions');
  return data;
}

export async function createTransaction(body) {
  const { data } = await api.post('/transactions', body);
  return data;
}

export async function updateTransaction(id, body) {
  const { data } = await api.put(`/transactions/${id}`, body);
  return data;
}

export async function deleteTransaction(id) {
  const { data } = await api.delete(`/transactions/${id}`);
  return data;
}
