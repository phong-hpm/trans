// env.ts — Centralised environment flags derived from Vite's import.meta.env

const ENV = {
  isDev: import.meta.env.MODE === 'development',
  backendUrl: (import.meta.env.VITE_BACKEND_URL as string) ?? '',
};

export default ENV;
