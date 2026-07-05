export interface CreateDisplayRequest {
  name: string
}

/** Returned only at creation/regeneration time — the raw token is embedded in `url`. */
export interface DisplayWithUrlResponse {
  id: string
  name: string
  url: string
}

/** Returned by the list endpoint — never includes the raw token or its hash. */
export interface DisplaySummaryResponse {
  id: string
  name: string
  createdAt: string
  revoked: boolean
}
