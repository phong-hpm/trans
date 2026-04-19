// env.ts — Centralised environment flags derived from Vite's import.meta.env

const ENV = { isDev: import.meta.env.DEV as boolean };

export default ENV;
