# Registry Module — task runner.
#
# Recipes deliberately avoid shell built-ins (no if/for/cp/test) so the same
# Makefile works under sh, Git Bash and cmd.exe. Anything conditional is done
# through node, which is a prerequisite anyway.
#
# Requires: Docker, Node 20+, pnpm 11+ (corepack enable pnpm).

PNPM ?= pnpm
PORT ?= 3000

.DEFAULT_GOAL := help
.NOTPARALLEL:
.PHONY: help dev setup up down restart logs psql env install generate migrate \
        migrate-create seed reset studio build start lint typecheck check clean nuke

## dev: start Postgres, sync deps and schema, then run the dev server
dev: up install generate migrate
	@echo "==> Dev server on http://localhost:$(PORT)"
	$(PNPM) dev --port $(PORT)

## setup: same as dev but seeds demo data and stops before the server
setup: up install generate migrate seed
	@echo "==> Ready. Run: make dev"

## up: start Postgres and wait until it accepts connections
up: env
	@echo "==> Starting Postgres"
	docker compose up -d --wait

## down: stop Postgres (data is kept)
down:
	docker compose down

## restart: recreate the Postgres container
restart: down up

## logs: follow Postgres logs
logs:
	docker compose logs -f db

## psql: open a psql shell on the dev database
psql:
	docker compose exec db psql -U sms -d sms

## env: create .env pointing at the compose database if it is missing
env:
	@node -e "const f=require('fs');if(!f.existsSync('.env')){f.writeFileSync('.env','DATABASE_URL=postgresql://sms:sms@localhost:5432/sms?schema=public\n');console.log('==> Created .env for the local compose database')}"

## install: install dependencies with pnpm
install:
	@echo "==> Installing dependencies"
	$(PNPM) install

## generate: regenerate the Prisma client
generate:
	@echo "==> Generating Prisma client"
	$(PNPM) prisma generate

## migrate: apply pending migrations (non-interactive)
migrate:
	@echo "==> Applying migrations"
	$(PNPM) prisma migrate deploy

## migrate-create: create a new migration from schema changes (interactive)
migrate-create: up
	$(PNPM) prisma migrate dev

## seed: load demo data (replaces existing rows)
seed:
	@echo "==> Seeding demo data"
	$(PNPM) db:seed

## reset: drop, re-migrate and re-seed the database
reset: up
	$(PNPM) prisma migrate reset --force

## studio: open Prisma Studio
studio: up
	$(PNPM) prisma studio

## build: production build
build: generate
	$(PNPM) build

## start: serve the production build
start: up
	$(PNPM) start --port $(PORT)

## lint: ESLint
lint:
	$(PNPM) lint

## typecheck: TypeScript, no emit
typecheck:
	$(PNPM) exec tsc --noEmit

## check: typecheck, lint and build
check: typecheck lint build
	@echo "==> All checks passed"

## clean: remove build output
clean:
	@node -e "require('fs').rmSync('.next',{recursive:true,force:true});console.log('==> Removed .next')"

## nuke: clean, and delete node_modules and the database volume
nuke: clean
	docker compose down -v
	@node -e "require('fs').rmSync('node_modules',{recursive:true,force:true});console.log('==> Removed node_modules')"

## help: list targets
help:
	@node -e "const l=require('fs').readFileSync('Makefile','utf8').split(/\r?\n/).filter(x=>x.startsWith('## '));console.log('');for(const x of l){const i=x.indexOf(':');console.log('  make '+x.slice(3,i).padEnd(16)+x.slice(i+1).trim())}console.log('')"
