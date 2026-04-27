/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_BASE_URL?: string
	/** Optional UUID used when not logged in (local dev) so staff queries still resolve a tenant. */
	readonly VITE_DEV_BUSINESS_ID?: string
	/** Optional default table for guest flow when not passed in the query string. */
	readonly VITE_DEV_DEFAULT_TABLE_ID?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
