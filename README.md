# daymark

A full-stack todo app built with Next.js and MongoDB. It uses a shared workspace with no login required.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `MONGODB_URI` to your MongoDB Atlas connection string and choose a database name.
3. Set `GEMINI_API_KEY` and use `GEMINI_MODEL=gemini-flash-lite-latest` for the Study Coach.
4. Install and run the app:

```bash
npm install
npm run dev
```

Open http://localhost:3000. Todos are stored in the `todos` collection, and daily check-ins are stored in `daily_progress`.

The Study Coach only sends todo, productivity, time-management, study, planning, focus, homework, and exam-related prompts to Gemini. Other questions are rejected before the Gemini request and return `Can't help with that you can ask a different question`.

## Deploy to your website

Deploy this Next.js app to Vercel, Render, Railway, or any Node-compatible host. Add `MONGODB_URI`, `MONGODB_DB`, `GEMINI_API_KEY`, and `GEMINI_MODEL` in the host's project settings, then point your domain's DNS at the host.

Do not commit `.env.local` or MongoDB credentials. For MongoDB Atlas, add the hosting provider's outbound IP range to Network Access, or use `0.0.0.0/0` only when your provider requires dynamic outbound IPs and the database credentials are tightly scoped.
