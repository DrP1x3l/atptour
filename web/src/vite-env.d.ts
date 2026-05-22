/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string;
  readonly VITE_APP_SECRET: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
