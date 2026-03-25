# Entanglr - Live Chat Application Build Plan

## Context

Build a full-stack real-time chat application as a **learning project**. The user wants professor-style teaching: full code shown for each file with explanations, one phase at a time, following a contract-first dev-flow (Understand → Design Endpoints → Write Schemas → Implement → Test → Iterate). The repo is currently empty (just a README.md).

---

## Final Folder Structure (what we're building toward)

```
entanglr/
├── package.json                    # npm workspaces root
├── tsconfig.base.json              # shared TS config
├── .gitignore
├── .prettierrc
│
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env / .env.example
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── index.ts                # HTTP server + Socket.io attach
│       ├── app.ts                  # Express app factory
│       ├── config/                 # env.ts, prisma.ts, redis.ts, cloudinary.ts, swagger.ts
│       ├── middleware/             # authenticate.ts, validate.ts, upload.ts, errorHandler.ts
│       ├── lib/                    # apiError.ts, apiResponse.ts, jwt.ts, password.ts, cloudinaryUpload.ts
│       ├── modules/
│       │   ├── auth/               # schema, service, controller, routes
│       │   ├── user/               # schema, service, controller, routes
│       │   ├── conversation/       # schema, service, controller, routes
│       │   └── message/            # schema, service, controller, routes
│       ├── socket/
│       │   ├── index.ts            # Socket.io setup + Redis adapter
│       │   ├── handlers/           # chatHandler, typingHandler, presenceHandler
│       │   └── services/           # presenceService (Redis SET ops)
│       └── types/
│           └── express.d.ts
│
├── client/
│   ├── package.json
│   ├── vite.config.ts / tailwind.config.ts
│   └── src/
│       ├── api/                    # Axios client + endpoint functions
│       ├── hooks/                  # TanStack Query wrappers
│       ├── stores/                 # Zustand (authStore, chatStore, presenceStore)
│       ├── socket/                 # socketManager, socketEventHandlers
│       ├── components/             # ui/, layout/, auth/, sidebar/, chat/, profile/
│       ├── pages/                  # LoginPage, RegisterPage, ChatPage
│       ├── lib/utils.ts
│       └── types/index.ts
```

---

## Prisma Schema (all models)

```prisma
model User {
  id, email (unique), username (unique), displayName, passwordHash,
  avatarUrl?, bio?, lastSeenAt, createdAt, updatedAt
  -> memberships[], messages[]
}

enum ConversationType { DM, GROUP }

model Conversation {
  id, type (DM|GROUP), name?, avatarUrl?, createdBy, createdAt, updatedAt
  -> members[], messages[]
}

model ConversationMember {
  id, conversationId, userId, role (ADMIN|MEMBER), joinedAt, lastReadAt
  @@unique([conversationId, userId])
}

enum MessageType { TEXT, IMAGE, FILE }

model Message {
  id, conversationId, senderId, content?, type, fileUrl?, fileName?, fileSize?,
  createdAt, updatedAt
  @@index([conversationId, createdAt])
}
```

Key decisions: `cuid()` IDs, `lastReadAt` on membership (not a separate ReadReceipt table), composite index for fast message queries.

---

## Socket.io Event Map

**Client → Server:** `conversation:join`, `conversation:leave`, `message:send` (with tempId for optimistic UI), `message:read`, `typing:start`, `typing:stop`

**Server → Client:** `message:new`, `message:read_update`, `typing:update`, `user:online`, `user:offline`, `user:presence_list`, `error`

**Connection:** Client connects with `auth: { token }` in handshake. Server verifies JWT, tracks presence in Redis, broadcasts online/offline.

---

## Phases (one at a time, in order)

### Phase 1: Project Setup & Tooling

**Goal:** Monorepo skeleton with TypeScript, linting, and dev scripts.
**Concepts:** npm workspaces, tsconfig extends, ESLint, Prettier, `tsx` dev runner
**Files:**

- `package.json` — root workspace config
- `tsconfig.base.json` — shared strict TS settings
- `.gitignore`, `.prettierrc`
- `server/package.json`, `server/tsconfig.json`, `server/src/index.ts`
- `client/` — scaffolded via `npm create vite@latest`
  **Deps (root):** typescript, eslint, prettier (dev)
  **Deps (server):** tsx (dev), @types/node (dev)

### Phase 2: Database Design

**Goal:** Full Prisma schema with all models, first migration, PrismaClient singleton.
**Concepts:** Relational modeling, enums, junction tables, `@@index`, `@@map`, migrations
**Files:**

- `server/.env`, `server/.env.example`
- `server/prisma/schema.prisma` — all models above
- `server/src/config/prisma.ts` — singleton with dev hot-reload guard
  **Deps (server):** prisma (dev), @prisma/client

### Phase 3: Backend Foundation

**Goal:** Express app with middleware pipeline, error handling, env validation, OpenAPI docs.
**Concepts:** App factory pattern, middleware ordering, Zod env validation, custom ApiError, standardized responses, Swagger UI
**Files:**

- `server/src/app.ts` — Express factory (helmet, cors, morgan, json, routes, swagger, error handler)
- `server/src/config/env.ts` — Zod-validated env vars
- `server/src/config/swagger.ts` — OpenAPIRegistry + swagger-ui-express at `/api-docs`
- `server/src/middleware/validate.ts` — generic Zod validation middleware
- `server/src/middleware/errorHandler.ts` — global error handler
- `server/src/lib/apiError.ts` — custom error class with static factories
- `server/src/lib/apiResponse.ts` — `successResponse()`, `createdResponse()`
- `server/src/index.ts` — updated to use app factory
  **Deps (server):** express, cors, zod, @asteasolutions/zod-to-openapi, swagger-ui-express, dotenv, helmet, morgan + their @types

### Phase 4: Authentication

**Goal:** Register, login, JWT auth middleware. First full contract-first feature cycle.
**Concepts:** bcrypt hashing, JWT sign/verify, Bearer token pattern, extending Express Request type
**Endpoints:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
**Files:**

- `server/src/lib/jwt.ts`, `server/src/lib/password.ts`
- `server/src/middleware/authenticate.ts`
- `server/src/modules/auth/auth.schema.ts` — Zod + OpenAPI registration
- `server/src/modules/auth/auth.service.ts` — register(), login()
- `server/src/modules/auth/auth.controller.ts`
- `server/src/modules/auth/auth.routes.ts`
- `server/src/types/express.d.ts`
  **Deps (server):** bcrypt, jsonwebtoken + their @types

### Phase 5: User Profiles

**Goal:** Profile CRUD, avatar upload via Cloudinary, user search.
**Concepts:** Multer file uploads, Cloudinary SDK, PATCH semantics, query param validation
**Endpoints:** `GET /api/users/me`, `PATCH /api/users/me`, `POST /api/users/me/avatar`, `GET /api/users/search`, `GET /api/users/:id`
**Files:**

- `server/src/config/cloudinary.ts`
- `server/src/lib/cloudinaryUpload.ts`
- `server/src/middleware/upload.ts`
- `server/src/modules/user/` — schema, service, controller, routes
  **Deps (server):** multer, cloudinary + @types/multer

### Phase 6: Conversations

**Goal:** Create DMs and groups, list conversations, manage members.
**Concepts:** M:N through junction tables, nested Prisma writes, DM uniqueness, authorization checks, transactions
**Endpoints:** `POST /api/conversations`, `GET /api/conversations`, `GET /api/conversations/:id`, `PATCH /api/conversations/:id`, `POST /api/conversations/:id/members`, `DELETE /api/conversations/:id/members/:userId`
**Files:** `server/src/modules/conversation/` — schema, service, controller, routes

### Phase 7: Messages

**Goal:** Send messages (text + file attachments), cursor-based pagination.
**Concepts:** Cursor pagination (why not offset for chat), Cloudinary for message files, updating conversation `updatedAt`
**Endpoints:** `POST /api/conversations/:conversationId/messages`, `GET /api/conversations/:conversationId/messages`
**Files:** `server/src/modules/message/` — schema, service, controller, routes

### Phase 8: Real-time Layer (Socket.io + Redis)

**Goal:** Live messaging, typing indicators, online presence.
**Concepts:** WebSockets vs HTTP, Socket.io rooms/middleware, Redis SET for presence, `@socket.io/redis-adapter`, event-driven handlers
**Files:**

- `server/src/config/redis.ts`
- `server/src/socket/index.ts` — io setup + Redis adapter + auth middleware
- `server/src/socket/handlers/` — chatHandler, typingHandler, presenceHandler
- `server/src/socket/services/presenceService.ts`
- `server/src/index.ts` — refactored to `http.createServer(app)` + Socket.io
  **Deps (server):** socket.io, @socket.io/redis-adapter, ioredis

### Phase 9: Frontend (3 sub-phases)

**9A — Setup + Auth UI:** Tailwind, React Router, Zustand auth store, Axios client, TanStack Query, login/register pages, reusable UI components
**9B — Chat UI + REST:** Sidebar, conversation list, message list, message input, file preview, infinite scroll, all API integrations
**9C — Real-time:** Socket.io client manager, event handlers → Zustand/Query cache updates, typing indicator, online status dots
**Deps (client):** tailwindcss, @tailwindcss/vite, react-router-dom, zustand, @tanstack/react-query, axios, socket.io-client, clsx, tailwind-merge, react-hot-toast, date-fns, lucide-react

### Phase 10: Deployment

**Goal:** Backend on Railway/Render, frontend on Vercel, production config.
**Concepts:** Build scripts, `prisma migrate deploy`, CORS for production, health check endpoint, env vars across services
**Files:** `server/src/modules/health/health.routes.ts`, `client/vercel.json`, updated README.md

---

## Key Architectural Decisions

1. **`app.ts` vs `index.ts` separation** — testability + Socket.io sharing in Phase 8
2. **Zustand for client state, TanStack Query for server state** — clear separation of concerns
3. **Cursor pagination for messages** — stable under real-time inserts (no duplicates/gaps)
4. **`tempId` for optimistic UI** — client shows message instantly, reconciles on server ack
5. **Redis for presence** — works across multiple server instances (vs Socket.io in-memory)
6. **`lastReadAt` on membership** — avoids a massive ReadReceipt table

---

## Verification (per phase)

- **Phase 1:** `npm run dev` works in both server and client
- **Phase 2:** `npx prisma migrate dev` succeeds, Prisma Studio shows tables
- **Phase 3:** `GET /api-docs` shows Swagger UI, error handler returns JSON errors
- **Phase 4:** Register → Login → Use token on `/auth/me` → all via Swagger UI
- **Phase 5:** Update profile, upload avatar, search users → all via Swagger UI
- **Phase 6:** Create DM, create group, list conversations → Swagger UI
- **Phase 7:** Send messages, paginate history → Swagger UI
- **Phase 8:** Connect via Socket.io client (Postman/test script), send message, see real-time delivery
- **Phase 9:** Full browser testing: register, login, create chat, send messages, see real-time updates
- **Phase 10:** End-to-end on production URLs

---

## Teaching Approach

For each phase, I will:

1. Explain **what** we're building and **why** (the concepts)
2. Show the **full code** for each file with its folder path
3. Explain **why the code is written that way** (design decisions, patterns)
4. Tell you what to **type/run** to verify it works
5. Wait for you to complete it before moving to the next phase
