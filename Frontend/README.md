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

- `VITE_API_URL` sets the backend URL for authentication. When it is not set, authentication and app data use the local demo mode.
- `VITE_CONTACT_EMAIL` enables the contact form by opening the visitor's default email app. The website does not send contact messages itself.

Demo-mode articles, bookmarks, comments, feedback and reports are stored in the browser's local storage.
