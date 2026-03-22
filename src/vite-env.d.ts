/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHAT_API_URL?: string
  /** Google AI Studio key — exposed in the browser bundle; use for local/hackathon only. */
  readonly VITE_GEMINI_API_KEY?: string
  /**
   * Set to `"true"` only when the ProEdge API is running (e.g. `localhost:3001`).
   * If unset, the app uses local profile state and does not call `/api/*` (no proxy errors).
   */
  readonly VITE_USE_BACKEND_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
