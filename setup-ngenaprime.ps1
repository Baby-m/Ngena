# Script para criar a estrutura inicial do projeto NgenaPrime
# Corre este script DENTRO da pasta do repositório já clonado (ex: C:\Users\User\Ngena)
# Como correr: clica com o botão direito na pasta > "Abrir no Terminal" e escreve:
#   powershell -ExecutionPolicy Bypass -File setup-ngenaprime.ps1

$dirs = @(
  "apps/web/src/app/(public)",
  "apps/web/src/app/participant",
  "apps/web/src/app/organizer",
  "apps/web/src/app/gate",
  "apps/web/src/app/admin",
  "apps/web/src/components",
  "apps/web/src/features",
  "apps/web/src/hooks",
  "apps/web/src/lib",
  "apps/web/src/services",
  "apps/web/src/utils",
  "apps/web/public",

  "apps/api/src/modules/auth",
  "apps/api/src/modules/users",
  "apps/api/src/modules/organizers",
  "apps/api/src/modules/events",
  "apps/api/src/modules/gates",
  "apps/api/src/modules/employees",
  "apps/api/src/modules/ticket-types",
  "apps/api/src/modules/tickets",
  "apps/api/src/modules/orders",
  "apps/api/src/modules/payments",
  "apps/api/src/modules/checkins",
  "apps/api/src/modules/realtime",
  "apps/api/src/common",
  "apps/api/src/config",
  "apps/api/prisma/migrations",
  "apps/api/test",

  "packages/ui",
  "packages/contracts",
  "packages/types",
  "packages/config",

  "docs/architecture",
  "docs/database",
  "docs/decisions",
  "docs/api",

  ".github/workflows",
  ".github/ISSUE_TEMPLATE"
)

foreach ($d in $dirs) {
  New-Item -ItemType Directory -Force -Path $d | Out-Null
}

# Ficheiro .gitkeep em pastas vazias, para o Git as conseguir "ver" (Git ignora pastas vazias)
foreach ($d in $dirs) {
  $gitkeep = Join-Path $d ".gitkeep"
  if (-not (Test-Path $gitkeep)) {
    New-Item -ItemType File -Force -Path $gitkeep | Out-Null
  }
}

# Ficheiros de configuração base na raiz
if (-not (Test-Path "package.json")) {
@"
{
  "name": "ngenaprime",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
"@ | Out-File -Encoding utf8 "package.json"
}

if (-not (Test-Path "pnpm-workspace.yaml")) {
@"
packages:
  - "apps/*"
  - "packages/*"
"@ | Out-File -Encoding utf8 "pnpm-workspace.yaml"
}

if (-not (Test-Path "turbo.json")) {
@"
{
  "`$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": { "cache": false, "persistent": true },
    "build": { "outputs": ["dist/**", ".next/**"] }
  }
}
"@ | Out-File -Encoding utf8 "turbo.json"
}

if (-not (Test-Path ".env.example")) {
@"
DATABASE_URL="postgresql://user:password@localhost:5432/ngenaprime"
JWT_SECRET="troca-isto-por-um-segredo-forte"
PORT=3333
"@ | Out-File -Encoding utf8 ".env.example"
}

if (-not (Test-Path ".gitignore")) {
@"
node_modules/
.env
dist/
.next/
.turbo/
*.log
"@ | Out-File -Encoding utf8 ".gitignore"
}

if (-not (Test-Path "FLOWPASS_PROJECT_CONTEXT.md")) {
@"
# NgenaPrime — Contexto do Projeto

Sistema de venda, gestão e validação de acessos para eventos.

Ver documentação em /docs para arquitetura, base de dados e decisões técnicas.
"@ | Out-File -Encoding utf8 "FLOWPASS_PROJECT_CONTEXT.md"
}

Write-Host "Estrutura do NgenaPrime criada com sucesso!"
