# daymark

A full-stack todo app built with Next.js, MongoDB, and signed HTTP-only sessions.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `MONGODB_URI` to your MongoDB Atlas connection string and choose a database name.
3. Set `AUTH_SECRET` to a long random value.
4. Install and run the app:

```bash
npm install
npm run dev
```

Open http://localhost:3000. User accounts and todos are stored in the `users` and `todos` MongoDB collections. Passwords are hashed before storage, and each todo query is scoped to the logged-in user.

## Deploy to your website

Deploy this Next.js app to Vercel, Render, Railway, or any Node-compatible host. Add the same three environment variables in the host's project settings, then point your domain's DNS at the host.

Do not commit `.env.local` or MongoDB credentials. For MongoDB Atlas, add the hosting provider's outbound IP range to Network Access, or use `0.0.0.0/0` only when your provider requires dynamic outbound IPs and the database credentials are tightly scoped.
