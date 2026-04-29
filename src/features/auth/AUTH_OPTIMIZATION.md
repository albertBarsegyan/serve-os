# Auth Token Optimization Guide

## Problem
The `/me` endpoint was being called every time on app load, even when the user was already signed out. This caused unnecessary API requests and slow initial load times.

## Solution
Implemented auth token tracking to skip the `/me` request when user is not authenticated.

## How It Works

### 1. Auth Token Storage (`src/features/auth/lib/utils/auth-token.ts`)

Provides utilities to manage auth state in memory:

```typescript
// Check if user has a token (before making /me request)
if (hasAuthToken()) {
  // Make /me request
}

// On successful login
setAuthToken(token)

// On logout
clearAuthToken()

// Initialize on app load
initializeAuthToken()
```

### 2. Root Route Optimization (`src/routes/__root.tsx`)

**Before:**
```typescript
beforeLoad: async ({ context }) => {
  // Always calls /me, even if user is logged out
  authUser = await context.queryClient.ensureQueryData({
    queryKey: [authQueryKey.ME],
    queryFn: authApi.me,
  })
}
```

**After:**
```typescript
beforeLoad: async ({ context }) => {
  // Only calls /me if token exists
  if (hasAuthToken()) {
    authUser = await context.queryClient.ensureQueryData({
      queryKey: [authQueryKey.ME],
      queryFn: authApi.me,
    })
  }
}
```

### 3. Login/Logout Hooks (`src/features/auth/model/auth-hooks.ts`)

Updated mutations to track auth state:

```typescript
// On successful login
onSuccess: (data) => {
  setAuthToken(data.token)
  invalidateQueries()
}

// On logout
onSuccess: () => {
  clearAuthToken()
  queryClient.clear()
}
```

## Benefits

✅ **Fewer API Calls**: No /me request when signed out
✅ **Faster Load Time**: Skip unnecessary async operation
✅ **Better UX**: Faster redirects for logged-out users
✅ **Reduced Server Load**: Less API traffic
✅ **Smart Caching**: Remembers state across page reloads

## Flow

```
User Opens App
    ↓
initializeAuthToken()
    ↓
hasAuthToken() → false (if signed out)
    ↓
Skip /me request
    ↓
Set authUser = null
    ↓
Redirect to login

---

User Signs In
    ↓
setAuthToken(token)
    ↓
hasAuthToken() → true
    ↓
Next page load calls /me
    ↓
authUser loaded from API
    ↓
Access to protected routes

---

User Signs Out
    ↓
clearAuthToken()
    ↓
hasAuthToken() → false
    ↓
Next page load skips /me
    ↓
authUser = null
    ↓
Redirect to login
```

## Token Detection Methods

The system checks for tokens in this order:

1. **In-Memory Cache**: Fastest, set on login/logout
2. **localStorage**: Fallback on first load
3. **Cookies**: Checked via `document.cookie` on init

### Supported Cookie Names

The system looks for these common auth cookie names:
- `auth_token`
- `token`
- `sessionid`

**To customize**, edit `initializeAuthToken()` in `auth-token.ts`:

```typescript
const cookieExists = document.cookie
  .split('; ')
  .some((cookie) => {
    const name = cookie.split('=')[0]
    return name === 'your_auth_cookie' // ← Update this
  })
```

## API Response Types

The system expects login responses with optional token:

```typescript
interface LoginResponseBody {
  token?: string  // Optional - token in response
  user?: User
}
```

If no token in response, the system assumes cookie-based auth.

## Usage in Components

### Check if User is Authenticated

```typescript
import { hasAuthToken } from '#/features/auth/lib/utils/auth-token'

if (hasAuthToken()) {
  // User is authenticated
}
```

### Manual Token Management


// After custom auth flow
setAuthToken(token)

// On logout
clearAuthToken()

// Get current token
const token = getAuthToken()
```

## Testing

### Verify Optimization Works

1. **Signed Out**: Open DevTools → Network, check if `/me` is called
   - ✅ Should NOT see `/me` request
   
2. **After Sign In**: Reload page
   - ✅ Should see `/me` request
   
3. **After Sign Out**: Reload page
   - ✅ Should NOT see `/me` request

### Clearing Storage (for testing)

```javascript
// Clear in-memory token
localStorage.removeItem('auth_token')

// Check current token
localStorage.getItem('auth_token')
```

## Server-Side Rendering

The auth token system safely handles SSR:

- No localStorage access on server
- Only uses cookies from request headers
- Gracefully falls back to null on server

## Future Enhancements

- [ ] Token refresh mechanism (auto-refresh before expiry)
- [ ] Token expiry tracking
- [ ] Secure token storage options
- [ ] Token rotation on app resume

## Files Changed

1. **Created:**
   - `src/features/auth/lib/utils/auth-token.ts`

2. **Modified:**
   - `src/routes/__root.tsx`
   - `src/features/auth/model/auth-hooks.ts`

## Performance Impact

**Before:** ~200-500ms delay (depending on API latency)
**After:** ~0ms when signed out (skip request)

This is especially noticeable on slow networks or when users frequently navigate from logged-out pages.
