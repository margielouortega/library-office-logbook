# Library Office Log Book Management System

A responsive visitor log book web application built with **React JS + Vite** for the frontend and **Node.js + Express.js** for the backend. Visitor records are stored strictly in a local JSON file (`backend/data/visitors.json`). This project does **not** use SQLite, MySQL, MongoDB, or another database.

## Main features

- Register visitors with full name, purpose, office/school, date, time-in, optional time-out, and remarks.
- View visitor records and history.
- Record time-out with one click.
- Edit and delete visitor records.
- Search by visitor name, purpose, or office.
- Filter history and reports by **per day**, **per month**, and office/school.
- Dashboard counts for today's visits, visitors currently inside, and monthly visits.
- Export filtered history/reports to CSV.
- Responsive layout for desktop and mobile.
- ACT Dean's Office is included in the office/school choices.

## Project structure

```text
library-office-logbook/
├── backend/
│   ├── data/
│   │   └── visitors.json
│   ├── .gitignore
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── screenshots/
└── README.md
```

## Requirements

- Node.js 18 or newer
- npm
- VS Code (recommended)

## Run in VS Code

Open the extracted `library-office-logbook` folder in VS Code.

### Terminal 1 — Backend

```bash
cd backend
npm install
node server.js
```

The API runs at `http://localhost:5000`.

### Terminal 2 — Frontend

Open a **new terminal** in VS Code:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

Keep both terminals running while using the application.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check API status |
| GET | `/api/visitors` | Get all visitor records |
| GET | `/api/visitors?date=YYYY-MM-DD` | Filter by date |
| GET | `/api/visitors?month=YYYY-MM` | Filter by month |
| GET | `/api/visitors?office=ACT%20Dean's%20Office` | Filter by office |
| GET | `/api/visitors/:id` | Get one record |
| POST | `/api/visitors` | Add a visitor |
| PUT | `/api/visitors/:id` | Edit a visitor |
| PATCH | `/api/visitors/:id/time-out` | Record time-out |
| DELETE | `/api/visitors/:id` | Delete a visitor |
| GET | `/api/reports/summary` | Get report totals and records |

## JSON storage

The backend automatically creates `backend/data/visitors.json` if it does not exist. Records are saved as JSON objects in that file. Back up this file regularly.

**Important:** JSON-file storage is suitable for a classroom/demo project and a single backend instance. It is not designed for multiple server instances or heavy concurrent production use. On hosting platforms such as Render, the local filesystem may be temporary unless a persistent disk is configured. For a class demonstration, run the backend locally or configure persistent storage before relying on hosted records.

## Deploying

### Frontend (Vercel)

1. Push the complete project to GitHub.
2. In Vercel, import the repository.
3. Set **Root Directory** to `frontend`.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Add environment variable `VITE_API_URL` with your deployed backend URL followed by `/api`, for example `https://YOUR-BACKEND.onrender.com/api`.
7. Deploy.

### Backend (Render)

1. Create a new **Web Service** and connect the same GitHub repository.
2. Set **Root Directory** to `backend`.
3. Build command: `npm install`.
4. Start command: `node server.js`.
5. Add environment variable `FRONTEND_URL` with your Vercel site URL (optional; CORS is permissive by default in this classroom starter).
6. Deploy and copy the backend URL.
7. If you need JSON records to persist across deploys/restarts, attach a Render persistent disk and update the data path in `server.js` to a directory on that disk. Without a persistent disk, hosted JSON data may be lost when the service restarts or redeploys.

## Screenshots for submission

Run the app locally and capture screenshots using Windows Snipping Tool (`Win + Shift + S`) or your browser screenshot feature. Suggested screenshots:
1. Dashboard overview.
2. Visitor registration form.
3. Visitor history with day/month filter.
4. Reports page with filtered records and CSV export.

Place your screenshots in the `screenshots/` folder before submitting.

## Testing checklist

- [ ] Backend starts using `node server.js`.
- [ ] Frontend starts using `npm run dev` in a second terminal.
- [ ] Add a visitor and confirm it appears in the table.
- [ ] Edit the visitor details.
- [ ] Record time-out and confirm status changes to Completed.
- [ ] Search for a visitor by name or purpose.
- [ ] Filter records per day and per month.
- [ ] Filter by ACT Dean's Office or another office.
- [ ] Export filtered report to CSV.
- [ ] Delete a test record and confirm it disappears.

## Oral explanation guide

- **Frontend:** React displays the dashboard, registration form, visitor tables, filters, and reports.
- **Backend:** Express provides REST API endpoints that receive requests from React and manage visitor records.
- **Integration:** React uses `fetch()` to send HTTP requests to the backend API.
- **Storage:** Express reads and writes JSON data in `backend/data/visitors.json`; no SQL database is used.
