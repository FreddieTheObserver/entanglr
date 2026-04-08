# Practical API Development Flow

A step-by-step guide for building REST APIs — solo or with a team.

---

## Phase 1: Understand the Feature

Before touching code or schemas, answer these questions:

- What problem does this feature solve?
- Who uses it? (web frontend, mobile app, third-party?)
- What data does the client need?
- What actions can the user perform?

**Solo:** Write this down briefly, even just bullet points.
**Team:** Discuss with frontend/mobile devs and product. Agree before moving on.

---

## Phase 2: Design the Endpoints (Contract First)

List out your endpoints in plain text:

```
GET    /resources          - list all
GET    /resources/:id      - get one
POST   /resources          - create
PATCH  /resources/:id      - update
DELETE /resources/:id      - delete
```

For each endpoint define:

```
POST /todos
  Request body:  { title: string, description?: string }
  Success:       201 { id, title, description, completed, createdAt }
  Errors:        400 validation error
```

**Solo:** Spend 10-15 minutes on this. It saves hours later.
**Team:** Share this with everyone — frontend, mobile, QA. Get sign-off before coding.

---

## Phase 3: Write the Schemas (Zod + OpenAPI)

Translate your design into Zod schemas and createRoute() definitions.
This is your living contract — it validates requests AND generates docs.

```ts
// Schema
export const CreateTodoSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

// Route
export const createTodoRoute = createRoute({
  method: "post",
  path: "/todos",
  request: { body: { content: { "application/json": { schema: CreateTodoSchema } } } },
  responses: { 201: { ... } },
});
```

**Solo:** This IS your documentation. Write it carefully.
**Team:** Commit this to a shared branch immediately so frontend can see the contract at /swagger.
         Frontend can now mock against the spec while you build the implementation.

---

## Phase 4: Build the Implementation

Now write the actual code, in this order:

```
Model      → DB queries (Prisma)
Service    → Business logic, throws errors
Controller → HTTP handling, calls service
Routes     → Mount on OpenAPIHono
```

Each layer only talks to the layer directly below it.
Controller never touches Prisma. Service never touches HTTP.

---

## Phase 5: Test the Endpoints

Open Swagger UI at /swagger and manually test every endpoint:

- Happy path (valid input, expected output)
- Edge cases (missing fields, wrong types)
- Error cases (not found, conflict, etc.)

**Solo:** Do this yourself before calling the feature done.
**Team:** Share the /swagger URL with QA. They can test directly without needing a frontend.

---

## Phase 6: Iterate

If requirements change:

1. Update the schema first (todos.schema.ts)
2. Update the implementation to match
3. Never change implementation without updating the schema

This keeps your docs always in sync with your code.

---

## Summary

```
Understand → Design endpoints → Write schemas → Implement → Test → Iterate
```

| Phase         | Solo                        | Team                                  |
|---------------|-----------------------------|---------------------------------------|
| Understand    | Write bullet points         | Align with product + frontend         |
| Design        | Plain text, 10-15 min       | Get sign-off from all stakeholders    |
| Schemas       | Write carefully, it's your docs | Commit early so frontend can mock |
| Implement     | Model → Service → Controller | Can happen in parallel with frontend |
| Test          | Swagger UI manually         | QA uses Swagger UI                    |
| Iterate       | Schema first, always        | Communicate breaking changes first    |

---

## Golden Rules

1. Design before you code.
2. Schema is the contract — never let code drift from it.
3. Errors are part of the design — define them upfront.
4. If you are on a team, the /swagger page is everyone's source of truth.
5. A breaking change (removing a field, changing a type) must be communicated before merging.
