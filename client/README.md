# TatvaFlow CRM frontend

The client is a React + TypeScript single-page application built with Vite. Its screens are React components in `src/*.tsx`; visual styles are in `src/*.css`.

## Run locally

Install dependencies and start Vite:

```powershell
npm.cmd install
npm.cmd run dev
```

Start the API separately from the repository's `server/` directory:

```powershell
cd ..\server
npm.cmd run dev
```

The client defaults to `http://localhost:4000/api`. To use another API base URL, configure `VITE_API_URL` in the frontend environment, for example:

```text
VITE_API_URL=http://localhost:4000/api
```

## Available views

- **Dashboard:** current lead metrics and recent records.
- **Leads:** create, search, filter, update status, and delete leads through the API.
- **Pipeline:** group lead values by current status.
- **Activities:** add, complete, and remove follow-ups in the current page session.
- **Reports:** calculate counts and deal-value summaries from API lead data.
- **Settings:** toggle compact lead-table rows and refresh data.

The backend stores lead records in memory only. Activities and the compact-row preference are frontend session state; they are not sent to the backend or retained after the page is reloaded. Authentication and database persistence are not implemented.

## Frontend checks

```powershell
npm.cmd run build
npm.cmd run lint
```

`build` runs the TypeScript project checks before producing the Vite production bundle.
