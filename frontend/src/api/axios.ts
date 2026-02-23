import axios from 'axios';
import { supabase } from '@/src/api/supabaseClient';

const api = axios.create({
  // https://cybersieve-api.fly.dev/api
  // http://127.0.0.1:8000/api
  baseURL: 'https://cybersieve-api.fly.dev/api',
  headers: {
    'Content-Type': 'application/json',
  },
});


// Add a request interceptor
api.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
