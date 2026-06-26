# IdeaBoard

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL 17](https://www.postgresql.org/) running locally
- [VS Code](https://code.visualstudio.com/) with the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (for the frontend)

## Setup

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Configure environment

Create `server/.env`:

```
PORT=3000
```

### 3. Create the database

In your terminal:

```bash
psql postgres
```

Then, at the `postgres=#` prompt, run:

```sql
CREATE DATABASE ideaboarddb;
\q
```

### 4. Run migrations

Back in your terminal, from the `server/` folder:

```bash
npm run migrate
```

Verify the tables were created:

```bash
psql ideaboarddb -c "\dt"
```

You should see `users`.

## Running the app

### Backend

From the `server/` folder:

```bash
npm run dev
```

The API runs at `http://localhost:3000`.

### Frontend

- Right-click `frontend/index.html` in VS Code and choose **Open with Live Server**.
- Or open the file directly in your browser: `path-to-project/frontend/index.html`

## Useful commands

| Command           | What it does                   |
| ----------------- | ------------------------------ |
| `npm run dev`     | Start the API with auto-reload |
| `npm run build`   | Compile TypeScript to `dist/`  |
| `npm run start`   | Run the compiled build         |
| `npm run migrate` | Apply database migrations      |

### Inspecting the database

```bash
psql ideaboarddb        # open a SQL shell on the database
```

Inside the shell:

```
\dt              list tables
\d users         describe a table
\c ideaboarddb   switch database
\q               quit
```
