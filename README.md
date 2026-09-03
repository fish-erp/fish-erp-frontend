# Fish ERP Frontend

Next.js administrator portal for managing fish feed and medicine ERP operations. The initial scope contains authentication and Users CRUD only.

## Local setup

```bash
cp .env.example .env
npm install
npm run dev
```

The frontend runs at `http://localhost:3000` and proxies backend requests through Next.js route handlers. Set the backend origin with:

```env
BACKEND_API_URL=http://localhost:8080
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Access and refresh tokens are stored in HttpOnly cookies. Only `ADMIN` and `SUPER_ADMIN` accounts can sign in to the portal. A `USER` login is rejected and its newly created backend session is revoked.

## Routes

- `/{locale}/login`
- `/{locale}/admin` redirects to `/{locale}/admin/users`
- `/{locale}/admin/users`
- `/{locale}/admin/users/:id`

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```
