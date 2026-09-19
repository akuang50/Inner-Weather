/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_XAI_API_KEY?: string
  readonly VITE_XAI_MODEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
