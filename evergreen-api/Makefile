build:
	@go build -o bin/server cmd/server/main.go

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
