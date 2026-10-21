# GLITCH — World Pulse / Consequence Engine

**EL / EN** · Next.js 15 · React 19 · Server-side RSS news API

Not another headline aggregator. A source-linked monitor of world events, countries, organizations and multinational companies.

## Three intelligence instruments

1. **WORLD DIFF** — recently published or changed coverage since your previous visit, based on the source sample. Does not pretend every new headline represents a changed real-world situation.
2. **RIPPLE ENGINE** — click through conditional mechanisms by domain (energy, trade, transportation, finance, technology, conflict) and see what evidence would be needed to verify each step. A scenario is *not a prediction*.
3. **ACTOR ARENA** — discover headline-based mentions and explicit relations between named countries, institutions and companies. Co-mentions do not establish alliances, responsibility or corporate exposure.

Each event has a source timeline, a distinct GLITCH VIEW commentary, named-actor references and original publisher links. Content comes from RSS excerpts and publicly available metadata, not unrestricted full publisher articles.

## Deploy: Vercel or Render

- **Current Vercel:** https://glitch-radar-github.vercel.app
- **Alternative full-stack Render deployment:** [Deploy GLITCH to Render](https://render.com/deploy?repo=https://github.com/mariodinakus/glitch-radar)

The repository includes a validated Next.js web-service configuration in [render.yaml](./render.yaml). **Render must run this as a Node web service, not a static site**, so that `/api/feed` and `/api/translate` continue to work. The Blueprint uses a free plan and disables automatic deploys; review and approve the new service in your Render account before creating it. Free services may sleep when idle and have usage restrictions. It is a *separate* URL; setting it up does not reassign the original Vercel domain.

### Local development

Requires Node.js 20.9+ (22 recommended):

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

Public-source coverage depends on upstream feed availability. Optional Google Cloud Translation needs the server-side `GOOGLE_TRANSLATE_API_KEY`; the free translation fallback can have availability or quality limits. Never commit credentials or place secrets in `NEXT_PUBLIC_*`.

## Trust model

The editorial interpretation, relationships and conditional ripples are heuristics based on source headlines and excerpts. They are **not** independently verified journalism, claims of confirmed economic effects, actual probabilities, or financial advice. See the original story and compare primary sources before drawing conclusions.

## GLITCH RADAR phone app

The same deployment is an installable Progressive Web App (PWA), not a native App Store binary. Open https://glitch-radar-github.vercel.app on Android (Chrome) or iOS (Safari), then choose **Install** or **Share → Add to Home Screen**. It opens without browser chrome with a dedicated GLITCH RADAR icon.

### Automatic updates and smooth operation
- GitHub main is the single code source; Vercel Git integration builds new production deployments automatically when authorized/configured.
- The service worker checks for updates after launch, when the app returns to the foreground, and every 15 minutes while open. New worker activation reloads the app once, preventing stale shell/code mixes.
- News and API endpoints are never served from a stale offline cache. Slow feed requests time out in 12 seconds, never overlap, and polling pauses in background tabs. A lightweight offline message appears without a network.
- Devices still need connectivity for live news. Server/network failures cannot be entirely eliminated.

### Optional push notifications (Android and iPhone)
- Install **web-push** dependencies with `npm install`, and set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` and `CRON_SECRET` in Vercel Project Environment Variables. Generate keys once with `npx web-push generate-vapid-keys`. Never commit the private key.
- Set `VAPID_SUBJECT` to the app's canonical HTTPS URL or your contact mailto address.
- In the app, tap **Alerts → Enable push alerts**. Permission is requested only on demand. iPhone/iPad require iOS 16.4+ and installation to the Home Screen.
- Push alerts are sent by the existing `/api/cron/notify` scheduler for significant score ≥74 signals. With a Vercel Hobby account the existing scheduler is **daily**, not breaking-news instant. For real-time alerts use a suitably authorized, more frequent scheduler on an eligible paid plan or external job.
- Upstash stores opt-in device push subscriptions for up to 90 days; **Disable push alerts** unsubscribes. Telegram alert delivery is preserved when configured.
