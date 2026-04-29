# Error Handling Architecture

This document describes the comprehensive error handling system implemented throughout the ServeOS application.

## Overview

The error handling system is built on TanStack Router's error boundaries and is designed to catch, display, and recover from errors gracefully at multiple levels.

## Architecture Layers

### 1. **Root Level Error Boundary** (`src/routes/__root.tsx`)
- **Purpose**: Catches all unhandled errors in the entire application
- **Components**: 
  - `errorComponent`: Displays full-page error UI with error details in development mode
  - `notFoundComponent`: Displays 404 page for missing routes
- **Display**: Beautiful centered error card with "Try Again" and "Go Home" buttons
- **Features**:
  - Automatic error logging in development
  - Stack trace visibility in dev mode
  - Graceful recovery with retry functionality

### 2. **Layout Route Error Boundaries** 
Implemented for major layout routes:
- `/admin` - Admin dashboard layout (`src/routes/admin.tsx`)
- `/auth` - Authentication pages layout (`src/routes/auth.tsx`)

Each layout-level error boundary:
- Maintains the layout structure
- Displays error in context
- Prevents entire app from breaking

### 3. **Page-Level Error Boundaries**
All individual page routes have error components:
- Admin pages: dashboard, orders, tables, menu, kitchen, staff, settings
- Auth pages: sign-in, sign-up
- Public pages: landing page, about page
- Customer pages: menu
- Staff pages: kitchen display, staff workspace

Each route has:
```typescript
export const Route = createFileRoute('/path')({
  component: PageComponent,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})
```

### 4. **Query-Level Error Handling**
Via TanStack Query error defaults in `src/integrations/tanstack-query/root-provider.tsx`:
- `retry: 1` - Automatic retry for failed queries
- `staleTime: 30s` - Fresh data fetching strategy
- Error state propagates to route error boundaries

### 5. **Utility Functions** (`src/shared/libs/utils/error.utils.ts`)
- `getErrorMessage()` - Extract human-readable error messages
- `handleRouteError()` - Log and notify route errors
- `handleQueryError()` - Log and notify query errors
- `createErrorHandler()` - Create reusable error handlers

## UI Components

### ErrorBoundary (`src/shared/ui/ErrorBoundary.tsx`)
Main error display component with two modes:

**Error Mode** (default):
- Alert icon with red accent
- Error message display
- Development stack trace (collapsible)
- Try Again button - Retries the last operation
- Go Home button - Navigates to home page

**Not Found Mode** (`isNotFound={true}`):
- Warning icon with yellow accent
- "Page Not Found" heading
- Helpful description
- Go Home button
- Go Back button

### LoadingSpinner (`src/shared/ui/LoadingSpinner.tsx`)
For better UX during data loading:
- `LoadingSpinner` - Animated spinner with optional message
- `LoadingSkeleton` - Skeleton loaders for data sections

### NotFoundPage (`src/shared/ui/NotFoundPage.tsx`)
Dedicated 404 page for missing routes with branded UI.

## Error Handling Flow

```
User Action
    ↓
Route Guard (beforeLoad)
    ↓ Error? → Route Error Boundary → Display
    ↓ OK
Component Renders
    ↓
Query/Mutation
    ↓ Failed? → Error Handler → Toast Notification
    ↓ Success
Component Updates
```

## Implementation Patterns

### In Page Routes
```typescript
import { ErrorBoundary } from '#/shared/ui/ErrorBoundary'

export const Route = createFileRoute('/admin/dashboard')({
  component: AdminDashboardPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})
```

### In Layout Routes
```typescript
function LayoutErrorComponent({ error }: { error: Error }) {
  return (
    <div className='layout-structure'>
      <Header />
      <main>
        <ErrorBoundary error={error} />
      </main>
    </div>
  )
}

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
  errorComponent: LayoutErrorComponent,
})
```

### In Components with Query Errors
The toast system automatically shows errors from failed mutations via TanStack Query's built-in error handling. Errors include:
- Network failures
- Server errors (500, etc.)
- Validation errors (400, 422, etc.)
- Timeout errors

## Error Messages

Error messages are:
- **Extracted** from API responses or exception messages
- **Displayed** via Toast notifications (top-right)
- **Logged** to console in development mode
- **Contextual** - Specific to the operation that failed

## Development Mode Features

When `import.meta.env.DEV` is true:

1. **Full Stack Traces**: Displayed in collapsible section on error page
2. **Console Logging**: All errors logged with context
3. **Detailed Error Messages**: Full error objects available for inspection
4. **Visual Distinction**: Error cards styled clearly

Production mode hides technical details for users.

## Toast Notifications

The app uses `sonner` for toast notifications:
- **Errors** - Red/pink toasts from failed operations
- **Success** - Green toasts from successful operations
- **Position** - Top-right corner
- **Auto-dismiss** - After 3-4 seconds

## Testing Error Scenarios

To test error handling:

1. **Route Error**: Manually throw in a route's `beforeLoad`
2. **Component Error**: Throw in component render (caught by error boundary)
3. **Query Error**: Call invalid API endpoint
4. **404 Error**: Navigate to non-existent route
5. **Network Error**: Use DevTools to simulate network failure

## Best Practices

### ✅ DO
- Add error boundaries to all route pages
- Use descriptive error messages
- Log errors in development mode
- Provide recovery actions (retry, go home)
- Show user-friendly messages, not technical jargon

### ❌ DON'T
- Swallow errors silently
- Leave users confused without feedback
- Expose sensitive technical details to users
- Make errors hard to recover from
- Mix error handling concerns

## Coverage Summary

| Layer | Status | Coverage |
|-------|--------|----------|
| Root | ✅ | Global app errors + 404 |
| Layout Routes | ✅ | Admin, Auth |
| Page Routes | ✅ | All 15+ routes |
| Query Errors | ✅ | All mutations + queries |
| UI Components | ✅ | ErrorBoundary, NotFound, Loading |
| Utilities | ✅ | Error logging & extraction |

## Future Enhancements

- [ ] Sentry integration for production error tracking
- [ ] Error rate monitoring dashboard
- [ ] Automatic error recovery strategies
- [ ] User feedback form on error pages
- [ ] Automated error notifications to support team
