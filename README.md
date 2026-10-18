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
