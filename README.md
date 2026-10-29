# TatvaFlow CRM

TatvaFlow is a full-stack CRM portfolio project built with React, TypeScript, Vite, Node.js, and Express.

## Features

- Dashboard with lead counts, pipeline totals, recent leads, and a time-aware greeting.
- Lead management with create, search, status filtering, status updates, and deletion.
- Pipeline grouped by lead status, with counts and deal-value totals.
- Session-only follow-up activities linked to leads.
- Reports calculated from the leads returned by the API.
- A compact-row display preference for the current browser session.
- Express API validation and automated API tests.

## Requirements

- Node.js and npm (use a Node version supported by the installed Vite release).

## Installation and startup

Install dependencies once in each project directory:

```powershell
cd .\server
npm.cmd install

cd ..\client
npm.cmd install
```

Start the backend in one terminal:

```powershell
cd .\server
npm.cmd run dev
```

Start the frontend in a second terminal:

```powershell
cd .\client
npm.cmd run dev
```

The API listens on `http://localhost:4000` by default, and Vite prints the local frontend URL when it starts. Set `PORT` to change the backend port. Set `VITE_API_URL` in the frontend environment if the API is hosted at a different base URL; its default is `http://localhost:4000/api`.

## Checks

Run backend tests and type checking:

```powershell
cd .\server
npm.cmd test
npm.cmd run typecheck
```

Build and lint the frontend:

```powershell
cd .\client
npm.cmd run build
npm.cmd run lint
```

## Architecture

- `client/` is a React + TypeScript single-page application built with Vite. Its screens are React components in `.tsx` files and styles live in `.css` files.
- `server/` is a TypeScript Express API. The client calls its `/api` endpoints using `fetch`.
- Lead records are held in a server-process in-memory array and initialized with sample records in `server/src/leads.ts`.
- Follow-up activities and display preferences are held in frontend page state only.

## API

All routes are relative to `/api`.

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/health` | Returns API health and service name. |
| `GET` | `/leads` | Returns `{ data, total }`. Optional `search` matches name, company, or email; optional `status` filters by `New`, `Contacted`, `Qualified`, or `Won`. |
| `POST` | `/leads` | Creates a lead and returns `{ data }` with HTTP `201`. Required fields: `name`, `company`, `email`, and positive numeric `value`; `status` defaults to `New`. |
| `PATCH` | `/leads/:id` | Updates one or more lead fields and returns `{ data }`. An empty update or invalid field returns HTTP `400`; a missing lead returns `404`. |
| `DELETE` | `/leads/:id` | Deletes a lead and returns HTTP `204`; a missing lead returns `404`. |

Invalid lead data returns HTTP `400` with an `error` message and validation details where available.

## Known limitations

- **No database is configured.** Leads live only for the lifetime of the backend process and are lost when it restarts. This project does not claim PostgreSQL or other durable persistence.
- Follow-up activities are not API-backed; they disappear when the page is reloaded.
- Compact-row preferences are not saved beyond the current page session.
- Authentication, authorization, roles, and multi-tenant isolation are not implemented.
