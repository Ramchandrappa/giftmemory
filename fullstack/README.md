# GiftMemory – Thoughtful Gift Planner (full-stack)

A private planner for occasions, preferences, budgets and past gifts.
It warns about duplicate gift ideas and upcoming occasions.

This is the full-stack version, built with **React, Node.js + Express and MongoDB**.
Accounts and data are stored on the server, so you see the same planner on every device you log in from.

The original single-file version (browser storage only) is live at https://ramchandrappa.github.io/giftmemory/

Demo login: `demo@giftmemory.app` / `demo123`

## Tech stack
| Part | Technology |
|---|---|
| Frontend | React 18 + Vite (`client/`) |
| Backend API | Node.js + Express (`server/`) |
| Database | MongoDB (MongoDB Atlas in production) with Mongoose |
| Login | Passwords hashed with bcrypt, sessions use JWT tokens (7 days) |
| Security | Helmet headers, rate-limited login, input validation, each user can only read their own data |

## Features
- Dashboard with upcoming occasions and smart reminders
- People management with likes, dislikes and notes
- Occasion management (birthday, anniversary, festival, wedding, farewell)
- Gift ideas with idea → bought → given status and personalisation
- Budget management per occasion and per year
- Gift history with filters
- Duplicate gift detection and dislike warnings
- Light and dark themes, works on phone and desktop
- Animated login screen and colourful Noto emoji artwork, switched off for reduced motion

## Project structure
```
giftmemory-fullstack/
  client/                 React app (Vite)
    src/App.jsx           routing, header, saving to the API
    src/views/Views.jsx   screens: dashboard, browse, people, budget…
    src/components/       login, pop-up forms, cards, Noto emoji
    src/lib/logic.js      gift catalog, reminders, duplicate checks
    src/lib/api.js        calls to the Express API
  server/                 Express API
    src/index.js          starts the server, creates the demo account
    src/app.js            routes, security headers, serves the React build
    src/routes/auth.js    POST /api/auth/register, /login, GET /me
    src/routes/data.js    GET/PUT/DELETE /api/data
    src/models/           Mongoose models: User, GiftData
    test/api.test.js      automated API tests
  render.yaml             one-click deploy to Render
```

## API
| Method | Path | What it does |
|---|---|---|
| POST | `/api/auth/register` | Create an account `{ name, email, password }` → `{ token, user }` |
| POST | `/api/auth/login` | Log in `{ email, password }` → `{ token, user }` |
| GET | `/api/auth/me` | Current user (needs `Authorization: Bearer <token>`) |
| GET | `/api/data` | The user's planner `{ settings, recipients, occasions, gifts }` |
| PUT | `/api/data` | Save the user's planner |
| DELETE | `/api/data` | Delete the user's planner |
| GET | `/api/health` | Health check |

## Run it on your computer
Needs Node.js 22.9 or newer.

```bash
npm run install:all
npm install
npm run dev
```
Open http://localhost:5173. Without a `MONGODB_URI`, the server starts a temporary in-memory MongoDB (the first run downloads it, about 600 MB; data is lost when you stop the server).

To use your real database, copy `server/.env.example` to `server/.env` and fill in `MONGODB_URI` and `JWT_SECRET`.

Run the API tests:
```bash
npm test
```

## Deploy for free
1. **MongoDB Atlas**: create a free M0 cluster, add a database user, allow access from anywhere (`0.0.0.0/0`), and copy the connection string.
2. **GitHub**: push this folder to a new repository (never commit `.env`).
3. **Render**: New → Blueprint → pick the repository. Render reads `render.yaml` at the top of the repository (it builds from this `fullstack/` folder), generates `JWT_SECRET`, and asks for `MONGODB_URI` (paste the Atlas string).
4. Open the `onrender.com` link Render gives you. The free plan sleeps after 15 minutes without visitors, so the first visit afterwards takes about a minute.

## Credits
Emoji artwork: [Google Noto Emoji](https://github.com/googlefonts/noto-emoji) (images Apache 2.0; animated emoji CC BY 4.0).

## Author
Dakshitha Sree – S-Vyasa, CSE

## License
MIT – see [LICENSE](LICENSE).
