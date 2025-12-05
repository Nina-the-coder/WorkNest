# WorkNest

Monolithic repository for the WorkNest application (backend + frontend).

Quick overview:

- `backEnd/` — Express + MongoDB API server
- `frontEnd/` — Vite + React UI

Quick start (local):

1. Backend
   - cd `backEnd`
   - copy `.env.example` to `.env` and update values
   - `npm install`
   - `npm start` (or use `nodemon server.js` during development)
2. Frontend
   - cd `frontEnd`
   - copy `.env.example` to `.env` and update `VITE_BACKEND_URL`
   - `npm install`
   - `npm run dev`

See `backEnd/README.md` and `frontEnd/README.md` for more details.

# WorkNest

Employee Task, Quotation &amp; Order Management System
