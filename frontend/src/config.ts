// In production set VITE_API_URL to your Railway backend URL (e.g. https://your-app.railway.app)
export const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';
