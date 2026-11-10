# Deploying the prototype

> Prototype for client demo. All data shown is sample data.
> **TODO(Faisal): confirm the deployment URL and hosting target.** Nothing in the code hardcodes a domain.

## Build

```bash
npm ci
cp .env.example .env      # then fill in the values below
npm run build             # static output in dist/
```

| Variable | Purpose | Default |
|---|---|---|
| `VITE_PUBLIC_BASE_URL` | Public URL the demo is served from. Used in share links, Open Graph tags and "View online" links in exported files. | current browser origin + base path |
| `VITE_BASE_PATH` | Sub-path the app is served under (Vite `base` and the router basename), e.g. `/cma-demo/`. | `/` |

The build is a static single-page app. Every host needs a **SPA fallback** so deep links such as
`/companies/lumen-bank/financials` serve `index.html`.

## Hosting targets

| Host | Config shipped in the repo | Notes |
|---|---|---|
| Netlify | `public/_redirects` | Copied into `dist/` by Vite. For a sub-path, prefix both sides with the base path. |
| Vercel | `vercel.json` | Rewrites everything to `index.html`; adds `X-Robots-Tag: noindex`. |
| nginx | `deploy/nginx.conf` | `try_files … /index.html`; sub-path example included. |

## Search engines

This is a demo. `index.html` carries `<meta name="robots" content="noindex,nofollow">`,
`public/robots.txt` disallows everything, and the Vercel/nginx configs add `X-Robots-Tag`.

## Checklist before sharing the link

- [ ] TODO(Faisal): deployment URL confirmed and set in `VITE_PUBLIC_BASE_URL`
- [ ] `VITE_BASE_PATH` matches the path on the host
- [ ] Open a deep link directly (not via the home page) and refresh: it must load
- [ ] The grey "Prototype for client demo" banner is visible
- [ ] Share link in a company profile shows the public URL
