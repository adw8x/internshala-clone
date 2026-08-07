import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export type AuthUser = {
  uid?: string;
  name?: string | null;
  email?: string | null;
  photo?: string | null;
  phoneNumber?: string | null;
};

export function authHeaders(user: AuthUser | null | undefined) {
  if (!user || !user.uid) return {};
  return {
    'x-user-id': user.uid,
    'x-user-name': encodeURIComponent(user.name || ''),
    'x-user-photo': encodeURIComponent(user.photo || ''),
    'x-user-email': encodeURIComponent(user.email || ''),
  };
}

export default api;
