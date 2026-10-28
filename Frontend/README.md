# News Platform frontend

The frontend is a React single-page app built with Vite and React Router.

## Source layout

- `src/pages/` contains route-level screens, grouped by feature.
- `src/components/` contains reusable interface pieces grouped by layout, news, and dashboard.
- `src/context/` and `src/hooks/` contain shared app state and hooks.
- `src/services/` contains API and authentication helpers.
- `src/data/` and `src/utils/` contain demo content and shared utilities.
- `src/style/` contains all global, site, authentication, and dashboard styles. Keep presentation rules in CSS files rather than JSX inline styles.

## Run locally

```sh
npm install
npm run dev
```

Run the production build and linter with `npm run build` and `npm run lint`.

## Configuration

- Authentication uses the backend at `http://localhost:5000` during local development; Vite proxies `/api` requests there. Set `VITE_API_URL` to use a different backend URL, and set the backend's `CLIENT_URL` to the frontend origin for cross-origin requests.
- Set `VITE_DEMO_MODE=true` to use the local demo authentication instead of the backend.
- `VITE_CONTACT_EMAIL` enables the contact form by opening the visitor's default email app. The website does not send contact messages itself.

Demo-mode articles, bookmarks, comments, feedback and reports are stored in the browser's local storage.
