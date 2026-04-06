# Discord Bot Hosting Panel

Pelna aplikacja webowa do zarzadzania i hostowania botow Discord.

Projekt zawiera:

- `frontend` - panel admina w React + Vite + Tailwind CSS
- `backend` - Express API z JWT, SQLite, PM2 i Socket.IO
- `backend/storage` - lokalne dane aplikacji, boty i tymczasowe uploady

## Co potrafi aplikacja

- rejestracja i logowanie uzytkownikow
- JWT auth i chronione endpointy
- tworzenie botow w osobnych katalogach
- upload ZIP / RAR
- upload pojedynczych plikow
- upload calego folderu projektu
- edycja `.env`
- `npm install` z backendu
- start / stop / restart przez PM2
- status online / offline
- metryki CPU / RAM / uptime
- logi przez REST API
- logi live przez Socket.IO

## Struktura projektu

```text
.
|-- backend
|   |-- src
|   |   |-- app.js
|   |   |-- index.js
|   |   |-- config
|   |   |-- controllers
|   |   |-- middleware
|   |   |-- routes
|   |   |-- services
|   |   `-- utils
|   |-- storage
|   |   |-- bots
|   |   `-- tmp
|   |-- .env.example
|   `-- package.json
|-- frontend
|   |-- src
|   |   |-- components
|   |   |-- context
|   |   |-- hooks
|   |   |-- lib
|   |   `-- pages
|   |-- .env.example
|   `-- package.json
|-- package.json
`-- README.md
```

## Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express, Socket.IO
- Auth: JWT + bcrypt
- Baza: SQLite
- Procesy botow: PM2

## Wymagania

- Node.js 20 LTS lub 22 LTS
- npm
- PM2 globalnie:

```bash
npm install -g pm2
```

## Instalacja

1. Skopiuj pliki env:

### Linux / macOS

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Windows PowerShell

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

2. Zainstaluj zaleznosci:

```bash
npm install
```

Jesli w PowerShell masz blokade `npm.ps1`, uzyj:

```powershell
npm.cmd install
```

3. Uruchom tryb developerski:

```bash
npm run dev
```

Na Windows przy problemie z `npm`:

```powershell
npm.cmd run dev
```

## Adresy dev

- frontend: `http://localhost:5173`
- backend API: `http://localhost:4000/api`
- healthcheck: `http://localhost:4000/api/health`

## Produkcja

1. Zbuduj frontend:

```bash
npm run build
```

2. Uruchom backend:

```bash
npm run start
```

Jesli istnieje katalog `frontend/dist`, backend automatycznie serwuje zbudowany frontend.

## Jak dziala hosting botow

Dla kazdego bota tworzony jest osobny katalog:

```text
backend/storage/bots/bot-{id}-{slug}/
```

W katalogu znajduja sie:

- kod bota
- `.env` jesli go dodasz w projekcie lub zapiszesz z panelu
- `.runtime/stdout.log`
- `.runtime/stderr.log`
- `.runtime/install.log`

## Obslugiwane tryby startu

- jezeli `package.json` ma `scripts.start`, backend odpala `npm run start`
- jezeli nie ma `scripts.start`, backend probuje uzyc `main` z `package.json`
- jezeli nie ma `main`, backend szuka np. `index.js`, `src/index.js`, `bot.js`

## API

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Przyklad body:

```json
{
  "email": "user@example.com",
  "password": "supersecret123"
}
```

### Boty

- `GET /api/bots`
- `POST /api/bots`
- `GET /api/bots/:botId`
- `DELETE /api/bots/:botId`
- `POST /api/bots/:botId/upload`
- `GET /api/bots/:botId/env`
- `PUT /api/bots/:botId/env`
- `POST /api/bots/:botId/install`
- `PUT /api/bots/:botId/startup`
- `POST /api/bots/:botId/startup/detect`
- `POST /api/bots/:botId/start`
- `POST /api/bots/:botId/stop`
- `POST /api/bots/:botId/restart`
- `GET /api/bots/:botId/logs?lines=200`
- `GET /api/bots/:botId/status`

### Przyklad tworzenia bota

```http
POST /api/bots
Authorization: Bearer <JWT>
Content-Type: application/json
```

```json
{
  "name": "Support Sentinel"
}
```

### Przyklad zapisu .env

```http
PUT /api/bots/1/env
Authorization: Bearer <JWT>
Content-Type: application/json
```

```json
{
  "raw": "TOKEN=your_discord_token\nCLIENT_ID=123456789\n"
}
```

### Przyklad zapisu startupu

```http
PUT /api/bots/1/startup
Authorization: Bearer <JWT>
Content-Type: application/json
```

```json
{
  "runtimeMode": "node",
  "entryFile": "index.js",
  "prestartCommand": "npm run build"
}
```

Dozwolone komendy przed startem:

- `npm install`
- `npm run <skrypt>`
- `node <plik>`

### Upload

Endpoint `POST /api/bots/:botId/upload` przyjmuje `multipart/form-data`:

- `archive` - pojedynczy ZIP albo RAR
- `files` - pliki lub caly katalog projektu

Przy archiwach aplikacja automatycznie usuwa zbedny wspolny katalog nadrzedny, jesli np. ZIP lub RAR zawiera wszystko pod sciezka typu `projekt/projekt/...`.

### Logi live

Socket.IO korzysta z JWT przekazanego w `auth.token`.

Eventy:

- `logs:subscribe`
- `logs:init`
- `logs:chunk`
- `logs:error`
- `logs:unsubscribe`

## Bezpieczenstwo

- backend nie wykonuje dowolnych komend usera
- dozwolone sa tylko kontrolowane akcje `npm install`, `start`, `stop`, `restart`
- upload ma blokade path traversal
- sekrety sa trzymane tylko w `.env`
- kazdy bot ma osobny katalog i osobne logi

## Dalszy rozwoj

- plany per user
- quota storage
- snapshoty botow
- 2FA
- reverse proxy + HTTPS
