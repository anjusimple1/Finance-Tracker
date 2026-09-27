import { api } from './api';

export async function loginRequest(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function registerRequest(name, email, password) {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data;
}
