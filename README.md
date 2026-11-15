# FactCheck AI

A learning project for building a claim-checking app. At this stage, the React
page sends a claim to FastAPI. The backend searches the web with Tavily and
asks Gemini to summarize evidence on both sides. Treat the AI result as a
starting point, not definitive proof; read the linked sources.

## What is in the project?

- `frontend/`: React and TypeScript user interface, built and served by Vite.
- `backend/`: Python API built with FastAPI.
- `FactCheck AI – UI preview.html`: the original static design preview.

The browser sends JSON to `POST /api/claims`; FastAPI checks the input and sends
JSON back. `GET /api/health` is a simple way to check whether the backend is
running. FastAPI also generates interactive API documentation.

## Start the project on Windows

You need Node.js/npm and Python installed. Open **two PowerShell terminals**.

### Terminal 1: start the backend

```powershell
cd "C:\Users\Hotriya\Downloads\prac proj\backend"
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
Copy-Item .env.example .env
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

The virtual environment (`.venv`) keeps this project's Python packages
separate from other projects. `uvicorn` runs the API, and `--reload` restarts it
when you edit Python files.

Before starting the API for the first time, open `backend/.env` in VS Code and
replace the example values with your **new** Tavily and Gemini API keys:

```text
TAVILY_API_KEY=your_new_tavily_key
GEMINI_API_KEY=your_gemini_key
```

Keep `.env` private: it is ignored by Git. Never put these server keys in
frontend files, paste them into chat, or commit them to GitHub. If you create or
edit `.env` after the API has started, stop the API with Ctrl+C and run the
Uvicorn command again so the new values are loaded. Keep this terminal open.
Visit
<http://127.0.0.1:8000/docs> to try the API, or
<http://127.0.0.1:8000/api/health> to check its status.

### Terminal 2: start the frontend

```powershell
cd "C:\Users\Hotriya\Downloads\prac proj\frontend"
npm run dev
```

Open the address Vite prints (usually <http://localhost:5173>). Enter a claim
and submit it. The page shows the AI assessment, evidence for and against, and
links to the Tavily sources.

### Run the checks

In the backend folder:

```powershell
.\.venv\Scripts\python.exe -m pytest
```

In the frontend folder:

```powershell
npm run lint
npm run build
```

## API behavior

Send a `POST` request to `/api/claims` with JSON like:

```json
{ "claim": "The moon is made of cheese." }
```

The API trims whitespace and accepts claims from 3 to 500 characters. It
returns an AI-generated verdict, confidence, evidence summaries, limitations,
and source URLs. If either server key is missing, it returns an explicit
configuration error instead of pretending the claim was checked.

## Google sign-in and saved history

The app uses Supabase Auth for Google sign-in. Signed-in users' submitted
claims are saved in Supabase; Guest mode does not save claims. The database
table uses Row Level Security (RLS), so each signed-in user can read only
their own history. Claims are saved after the local API accepts them; they
are not fact-check results yet.

To turn sign-in on:

1. Create a Supabase project.
2. In the Supabase SQL Editor, run the contents of `supabase/schema.sql` once.
   This creates the history table and its user-only access rules.
3. In Supabase Authentication settings, enable Google as a provider. Set up a
   Google OAuth client in Google Cloud. Add the callback URL shown by Supabase
   to Google's authorized redirect URIs, and enter the Google client ID and
   secret in Supabase (not in this project).
4. In Supabase URL Configuration, allow these local app URLs:
   `http://localhost:5173/**` and `http://127.0.0.1:5173/**`.
5. Copy `frontend/.env.example` to `frontend/.env.local`. Replace the example
   values with the Supabase Project URL and public anon/publishable key from
   your project's API settings:

   ```text
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-anon-key
   ```

6. Restart Vite, open the app, and click **Sign in**.

The public anon key is designed for browser use with RLS enabled. Never put a
Supabase `service_role` key or Google client secret in frontend code or
`frontend/.env.local`.

## Host the app

The backend is prepared for Render in `render.yaml`; the React frontend can be
deployed to Vercel. Deploy the backend first, then set the frontend's API URL.

### Render: deploy the FastAPI backend

1. Push the project to GitHub. Do not commit any `.env` files.
2. In Render, choose **New → Blueprint**, connect the GitHub repository, and
   select this repository. Render will read `render.yaml`.
3. Enter the new Tavily and Gemini keys when Render asks for
   `TAVILY_API_KEY` and `GEMINI_API_KEY`. These belong in Render's environment
   variables, not in `render.yaml`.
4. Create the service and wait for its deploy to finish. Copy its public URL,
   for example `https://factcheck-ai-api.onrender.com`.
5. In the service's environment settings, set `FRONTEND_ORIGINS` to the
   Vercel site URL after the frontend is deployed.

### Vercel: deploy the React frontend

1. In Vercel, choose **Add New → Project** and import the same GitHub
   repository.
2. Set **Root Directory** to `frontend`. Use `npm run build` as the build
   command and `dist` as the output directory.
3. Add the environment variable `VITE_API_URL` with the Render backend URL
   (for example `https://factcheck-ai-api.onrender.com`, without `/api`).
4. Deploy the project and copy its public URL.
5. Add that exact Vercel URL to Render's `FRONTEND_ORIGINS`, then redeploy the
   backend. This allows the browser site to call the API.

Google sign-in is optional for the first deployment; Guest mode works without
it. Add the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` variables in
Vercel only after Supabase Google sign-in has been configured. Never put
Tavily or Gemini server keys in Vercel.

## Learning roadmap

1. Connect the React form to FastAPI (complete).
2. Configure Supabase Google sign-in and user-specific claim history (current
   milestone; requires your Supabase and Google setup).
3. Add Groq as an alternative AI provider, keeping all API keys on the backend.
4. Learn SQLAlchemy and Alembic for backend-owned database changes.
5. Add browser tests with Playwright.
6. Package and deploy the app with Docker, Render, and Vercel.
7. Use Git and GitHub to track and share changes.
