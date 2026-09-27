# Personal Finance Tracker (MERN)

Production-style full-stack app: **MongoDB**, **Express**, **React (Vite)**, **Node.js**. Users register, sign in with JWT, and manage income/expense transactions with a dashboard, charts, and responsive UI.

---

## Prerequisites

- **Node.js** 18 or newer  
- **MongoDB** running locally, or a **MongoDB Atlas** connection string  
- **npm** (comes with Node)

---

## ENSURE (verification)

From the **repository root** (`fsd_project`), after cloning or pulling changes:

```bash
npm install
npm run ensure
```

This script:

1. Runs `npm install` in **backend** and **frontend**  
2. Runs `node --check` on every `backend/src/**/*.js` file  
3. Runs `npm run build` in **frontend** (catches broken imports / bundler errors)

If all steps succeed, dependencies resolve, backend syntax is valid, and the React app builds for production. You still need **MongoDB** and a **`backend/.env`** file to run the API at runtime.

---

## Project structure

```
fsd_project/
├── README.md
├── package.json              # root scripts: dev, ensure, install:all
├── scripts/
│   └── ensure.mjs            # npm run ensure — verify install, syntax, build
├── .gitignore
├── backend/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── config/
│       │   └── db.js
│       ├── controllers/
│       │   ├── authController.js
│       │   └── transactionController.js
│       ├── middleware/
│       │   └── auth.js
│       ├── models/
│       │   ├── User.js
│       │   └── Transaction.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   └── transactionRoutes.js
│       └── utils/
│           └── generateToken.js
└── frontend/
    ├── .env.example
    ├── .gitignore
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── chart/
        │   └── setup.js
        ├── config/
        │   └── authStorage.js
        ├── context/
        │   └── AuthContext.jsx
        ├── components/
        │   ├── Layout.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── Spinner.jsx
        │   └── charts/
        │       ├── IncomeExpenseDoughnut.jsx
        │       ├── ExpenseCategoryBarChart.jsx
        │       └── DailyCashflowLineChart.jsx
        ├── pages/
        │   ├── HomePage.jsx
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   └── DashboardPage.jsx
        └── services/
            ├── api.js
            ├── authService.js
            └── transactionService.js
```

Source code for the app lives in the `backend/` and `frontend/` folders above.

---

## Environment variables

### Backend (`backend/.env`)

Copy from `backend/.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/personal_finance_tracker
JWT_SECRET=change_this_to_a_long_random_string_in_production
JWT_EXPIRE=30d
```

- **`MONGO_URI`** — Local MongoDB or Atlas URI (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/dbname`).  
- **`JWT_SECRET`** — Long random string in production.  
- **`PORT`** — API port (default `5000`).  
- **`JWT_EXPIRE`** — JWT lifetime (e.g. `30d`).

### Frontend (`frontend/.env` — optional)

Copy from `frontend/.env.example`. Development usually **does not** need a `.env` file: Vite proxies `/api` to `http://localhost:5000`.

For production or custom API URL:

```env
VITE_API_URL=https://your-api.example.com/api
```

The value must include the `/api` prefix if your API is mounted at `/api`.

---

## Install and run

### 1. MongoDB

- **Local:** start `mongod` (or MongoDB Service) so `MONGO_URI` is reachable.  
- **Atlas:** create a cluster, user, and network access; use the connection string in `MONGO_URI`.

### 2. Backend

```bash
cd backend
copy .env.example .env
# Edit .env — set MONGO_URI and JWT_SECRET
npm install
npm run dev
```

API listens on **http://localhost:5000** (or your `PORT`). Health check: `GET http://localhost:5000/api/health`.

### 3. Frontend

In a **second** terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually **http://localhost:5173**). The dev server proxies `/api` to the backend.

### 4. Optional: one command from repo root

From the project root (`fsd_project`):

```bash
npm install
npm run install:all
```

Create `backend/.env` as above, then:

```bash
npm run dev
```

This runs the API and the Vite dev server together (requires `concurrently` installed by the root `npm install`).

### 5. Production build (frontend)

```bash
cd frontend
npm run build
npm run preview
```

Serve the `frontend/dist` folder with any static host (Nginx, etc.) and point `VITE_API_URL` at your deployed API.

---

## API overview

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/api/health` | No |
| `POST` | `/api/auth/register` | No |
| `POST` | `/api/auth/login` | No |
| `GET` | `/api/transactions` | Bearer JWT |
| `POST` | `/api/transactions` | Bearer JWT |
| `PUT` | `/api/transactions/:id` | Bearer JWT |
| `DELETE` | `/api/transactions/:id` | Bearer JWT |

Send `Authorization: Bearer <token>` for protected routes.

---

## Tech stack

- **Backend:** Express, Mongoose, bcryptjs, JWT, CORS  
- **Frontend:** React 18, Vite, React Router, Axios, Tailwind CSS, Chart.js, react-hot-toast  

---

## License

ISC (backend `package.json`). Use and modify as needed for your project.
