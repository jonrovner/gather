# Gather - Frontend

Gather is a web application designed to help families and groups easily organize events, split costs, and assign responsibilities.  
This frontend is built with **React**, **TypeScript**, **Vite**, and **TailwindCSS**, and integrates **Auth0** for authentication.

## Live Demo

👉 [https://gather-beryl.vercel.app/](https://gather-beryl.vercel.app/)

## Features

- Create new events with name, description, location, and date
- Assign items ("needs") to the event (e.g., food, drinks, supplies)
- Invite peoploe
- Accept invitation
- Claim needs
- Assign cost to claimed needs
- Split estimated costs among participants
- Auth0-based login and secure session management
- Dark mode support

## Tech Stack

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Auth0 React SDK](https://auth0.com/docs/libraries/auth0-react)

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- A configured Auth0 Application (SPA type)
- Access to the Gather backend API

### Installation

```bash
git clone https://github.com/yourusername/gather-frontend.git
cd gather-frontend
npm install
```

- Create a .env file with:

```bash
VITE_API_URL=https://gather-plop.onrender.com
VITE_AUTH0_DOMAIN=your-auth0-domain
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_AUDIENCE=your-auth0-audience
```

### Running the app locally

```bash
npm run build
```