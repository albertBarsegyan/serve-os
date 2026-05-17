# Platform Feature Layer

This feature implements the frontend contract from `FRONTEND_API_CONTRACT.md` (excluding auth and business creation).

## Structure

- `api/platform.types.ts`
  - Domain enums and API DTOs.
- `lib/schemas/platform.schemas.ts`
  - Zod request schemas for form and payload validation.
- `lib/constants/platform-query-keys.ts`
  - Shared TanStack Query keys.
- `lib/query-options.ts`
  - Reusable query options.
- `model/platform-hooks.ts`
  - Mutations with cache invalidation.
- `src/shared/api/platform/platform-api.ts`
  - HTTP client functions mapped to contract endpoints.

## Usage

```ts
import { useQuery } from '@tanstack/react-query'
import { tablesQueryOptions } from '#/features/platform/lib/query-options.ts'
import { useCreateTableMutation } from '#/features/platform/model/platform-hooks.ts'

const tablesQuery = useQuery(tablesQueryOptions())
const createTableMutation = useCreateTableMutation()
```

```ts
import { createTableSchema } from '#/features/platform/lib/schemas/platform.schemas.ts'

const parsed = createTableSchema.parse({
  number: 12,
  capacity: 4,
  qrCode: 'table-12-qr',
  isActive: true,
})
```

