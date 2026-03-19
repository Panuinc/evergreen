# EverGreen API — Go Development Rules

Reference: "A Practical, Production-Ready Go Project Structure" by G (Medium, Dec 6, 2025)

These rules are mandatory. All Go development MUST follow these conventions exactly.

---

## Project Structure

```
evergreen-api/
├── cmd/
│   └── main.go                  # Entry point — bootstrap only, no business logic
│
├── internal/                    # Business-specific code (Go enforces private imports)
│   ├── handlers/                # HTTP handlers — HTTP + business logic (NO DB queries)
│   │   └── <domain>.go
│   │
│   ├── store/                   # Data persistence layer (Repository pattern)
│   │   └── <domain>.go          # DB queries for this domain
│   │
│   ├── routes/                  # Route registration — binds handlers to endpoints
│   │   └── routes.go
│   │
│   ├── services/                # Business logic layer (recommended addition)
│   │   └── <domain>_service.go
│   │
│   ├── clients/                 # External REST API clients (calls to other services)
│   │   └── <service>_client.go
│   │
│   ├── dto/                     # Request/Response DTOs (optional)
│   │   └── <domain>_dto.go
│   │
│   └── config/                  # Use this OR pkg/config — not both
│       └── loader.go
│
├── pkg/                         # Reusable helper libraries (no business logic)
│   ├── config/
│   │   └── config.go            # Load env vars, config structs
│   │
│   ├── logger/
│   │   └── logger.go            # Project-wide logger wrapper (slog/zap/zerolog)
│   │
│   ├── middleware/
│   │   ├── cors.go              # CORS setup
│   │   ├── auth.go              # Auth middleware
│   │   └── requestid.go         # X-Request-ID injection for tracing
│   │
│   ├── response/
│   │   └── json.go              # Unified JSON success/error response helpers
│   │
│   ├── utils/
│   │   ├── strings.go           # String utilities
│   │   └── conv.go              # Type conversion utilities
│   │
│   └── security/
│       ├── hash.go              # Password hashing (bcrypt/argon2)
│       └── jwt.go               # JWT sign/verify utilities
│
├── migrations/                  # SQL migration files
├── .air.toml                    # Live reload config (local dev)
├── .env                         # Local environment variables
├── go.mod
├── go.sum
└── Makefile                     # Build, run, lint, test automation
```

---

## Key Distinction: `internal/` vs `pkg/`

| `internal/` | `pkg/` |
|---|---|
| Business-specific code | Reusable/generic helpers |
| Handlers, store, routes, services | Config, logger, middleware, response, utils |
| Cannot be imported externally (Go enforced) | Can be imported by external modules |
| **If it's business-specific → internal/** | **If it's reusable/generic → pkg/** |

---

## Rules — `cmd/`

1. **`cmd/main.go` is bootstrapping only.** Load config, init DB, wire handlers, start server.
2. **Zero business logic in main.go.** No SQL, no HTTP logic, no data transformation.
3. **Graceful shutdown** with `os.Signal` + `http.Server.Shutdown(ctx)`.

```go
// CORRECT main.go skeleton
func main() {
    cfg := config.Load()
    db := db.Connect(cfg.DatabaseURL)

    r := chi.NewRouter()
    routes.Register(r, db, cfg)

    srv := &http.Server{Addr: ":8080", Handler: r}
    // graceful shutdown...
}
```

---

## Rules — `internal/handlers/`

4. **Handlers deal with HTTP and business logic.** Never write SQL/DB queries here.
5. **Handlers do NOT define routes** — that belongs in `internal/routes/`.
6. **Handlers do NOT touch DB directly** — call store or service instead.

```go
// CORRECT handler pattern
func (h *UserHandler) CreateUser(c *gin.Context) {
    var dto dto.CreateUserRequest
    if err := c.ShouldBindJSON(&dto); err != nil {
        response.Error(c.Writer, http.StatusBadRequest, "invalid request")
        return
    }
    user, err := h.store.CreateUser(c.Request.Context(), dto)
    if err != nil {
        response.Error(c.Writer, http.StatusInternalServerError, "failed to create user")
        return
    }
    response.OK(c.Writer, user)
}
```

---

## Rules — `internal/store/`

7. **All DB queries live in store.** No SQL in handlers or services.
8. **Store is called by handlers or services only.**

```go
// CORRECT store pattern
func (s *Store) CreateUser(ctx context.Context, dto dto.CreateUserRequest) (User, error) {
    row := s.pool.QueryRow(ctx, `INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email`, dto.Name, dto.Email)
    // scan and return
}
```

---

## Rules — `internal/routes/`

9. **All route registration lives in `routes/`.** Handlers don't know their own paths.
10. **Routes are the bridge between the HTTP server and handlers.**

```go
// CORRECT routes pattern
func Register(r chi.Router, db *pgxpool.Pool, cfg *config.Config) {
    userHandler := handlers.NewUserHandler(db)
    hrHandler := handlers.NewHRHandler(db)

    r.Route("/api", func(r chi.Router) {
        r.Use(middleware.Auth)
        r.Mount("/users", userRoutes(userHandler))
        r.Mount("/hr", hrRoutes(hrHandler))
    })
}
```

---

## Rules — `internal/services/`

11. **Add a service layer ONLY when business logic is too complex for the handler.**
    - Multi-step transactions
    - Orchestrating multiple stores
    - Complex domain rules
12. **Simple CRUD does NOT need a service layer** — handler → store is sufficient.

---

## Rules — `pkg/` Packages

13. **`pkg/response/`** — Use centralized helpers for ALL HTTP responses. Never write raw `w.WriteHeader` + `json.Encode` in handlers.
    ```go
    response.OK(w, data)
    response.Created(w, data)
    response.Error(w, http.StatusBadRequest, "message")
    response.NotFound(w)
    ```

14. **`pkg/middleware/`** — All middleware has signature `func(http.Handler) http.Handler`. Auth, CORS, logging, rate limiting all live here.

15. **`pkg/config/`** — Single `Config` struct loaded from env vars. Call `os.Getenv` ONLY here, never inside handlers.

16. **`pkg/logger/`** — One logger wrapper for the entire project. Use structured logging (`slog`, `zap`, or `zerolog`). Never use `fmt.Println` in production code.

17. **`pkg/security/`** — JWT and password hashing utilities live here. Never implement auth crypto inline in handlers.

---

## Scaling: Feature-First Layout

When a domain grows large, split it into feature packages inside `internal/`:

```
internal/
├── users/
│   ├── handler.go      # HTTP handlers for users
│   ├── store.go        # DB queries for users
│   ├── routes.go       # Route registration for users
│   └── model.go        # User domain model/struct
│
├── products/
│   ├── handler.go
│   ├── store.go
│   ├── routes.go
│   └── model.go
│
└── auth/
    ├── handler.go
    ├── store.go
    ├── routes.go
    └── model.go
```

**Rule:** Each feature package owns its handler, store, routes, and model together.

---

## Makefile — Required Targets

Every Go project MUST have a `Makefile` with at minimum:

```makefile
build:
	@go build -o bin/server cmd/main.go

run: build
	@./bin/server

test:
	@go test -v ./...

migrate-up:
	@go run cmd/migrate/main.go up

migrate-down:
	@go run cmd/migrate/main.go down

lint:
	@golangci-lint run ./...
```

Use `make run`, `make test`, `make migrate-up` — never type the raw commands manually.

---

## Architecture Alternatives (when to use)

| Architecture | When to use |
|---|---|
| **Practical (this guide)** | Default. Small-to-medium APIs, ERP backends, internal tools |
| **Clean Architecture** | Large teams, complex domain, strict testability requirements |
| **Hexagonal (Ports & Adapters)** | Microservices that need to swap DB/transport easily |
| **Repository Pattern** | When you need mock repositories for testing |

**Default for this project: Practical structure with feature-first scaling.**

---

## Naming Conventions

- **Package names:** lowercase, single word, no underscores (`handlers`, `store`, `routes`, `middleware`)
- **File names:** `<domain>_handler.go`, `<domain>_store.go`, `<domain>_service.go`, `<domain>_dto.go`
- **When feature-first:** `handler.go`, `store.go`, `routes.go`, `model.go` (no prefix needed since package name is the domain)
- **Constructor:** `NewUserHandler(db)`, `NewHRStore(pool)`
- **Struct methods (handlers):** `ListUsers`, `CreateUser`, `GetUser`, `UpdateUser`, `DeleteUser`

---

## What NOT to Do

- Do NOT put business logic in `cmd/main.go`
- Do NOT write SQL in handlers — that belongs in `store/`
- Do NOT call `os.Getenv` inside handlers — use `pkg/config.Config`
- Do NOT write raw `w.WriteHeader` + `json.Encode` — use `pkg/response` helpers
- Do NOT put reusable utilities in `internal/` — they belong in `pkg/`
- Do NOT put business-specific code in `pkg/` — it belongs in `internal/`
- Do NOT use `panic()` for recoverable errors
- Do NOT use `fmt.Println` for logging — use `pkg/logger`
