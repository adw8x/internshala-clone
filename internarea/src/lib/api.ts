import axios from 'axios';
import { localizeServerError } from './i18n/serverErrors';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const data = error?.response?.data;
    if (data && typeof data.error === "string") {
      const localized = localizeServerError(data.error);
      if (localized) data.error = localized;
    }
    return Promise.reject(error);
  }
);

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
