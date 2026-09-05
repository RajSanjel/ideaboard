# IdeaBoard

Web-based college feedback and suggestion board.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL 17](https://www.postgresql.org/) running locally
- [VS Code](https://code.visualstudio.com/) with the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (for the frontend)

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

Create `backend/.env`:

```
PORT=3000
DATABASE_URL=postgresql://localhost/ideaboarddb
JWT_PRIVATE_KEY=...
JWT_PUBLIC_KEY=...
JWT_LIFETIME=7d
```

### 3. Create the database

```bash
psql postgres
```

At the `postgres=#` prompt:

```sql
CREATE DATABASE ideaboarddb;
\q
```

### 4. Run migrations

From the `backend/` folder:

```bash
npm run migrate
```

Verify the tables:

```bash
psql ideaboarddb -c "\dt"
```

You should see `users`, `suggestions`, `comments`, `suggestion_votes`, and `comment_votes`.

## Running the app

### Backend

From the `backend/` folder:

```bash
npm run dev
```

The API runs at `http://localhost:3000`.

### Frontend

Point the frontend API base URL at port **3000** (`frontend/js/config/api.js` → `http://localhost:3000`).

Then either:

- Right-click `frontend/index.html` in VS Code and choose **Open with Live Server**, or
- Open `frontend/index.html` directly in the browser.

## Useful commands

| Command           | What it does                   |
| ----------------- | ------------------------------ |
| `npm run dev`     | Start the API with auto-reload |
| `npm run build`   | Compile TypeScript to `dist/`  |
| `npm run start`   | Run the compiled build         |
| `npm run migrate` | Apply database migrations      |

### Inspecting the database

```bash
psql ideaboarddb
```

```
\dt              list tables
\d users         describe a table
\c ideaboarddb   switch database
\q               quit
```
