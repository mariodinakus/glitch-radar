# GLITCH 5 · Discovery Engine

**Version 5** changes the home screen into an evidence-linked interpretation layer over verified public source feeds. It is **not** a generative-AI system, forecast service, or automated fact checker.

## Core additions

- Live discovery cards with underlying sources and explanatory caveats.
- USGS magnitude-4.5+ 24-hour count vs the prior 6 days (separate weekly feed).
- Cross-publisher lexical headline similarities, explicitly labeled as *coverage overlaps* rather than confirmation.
- Recent NASA natural-event records, NOAA bulletins, OpenAlex index and source-health summaries.
- Discovery view: inspect evidence, compare 24-hour activity and copy a sourced briefing.
- Greek-first interface with automatic visible-item translation via optional Google Cloud Translation API; public MyMemory fallback is best-effort and subject to quotas.
- Saves reading state and preferences to local browser storage.

# GLITCH 3.0 — World Signal Radar / Παγκόσμιο Radar

A completely redesigned **mobile-first bilingual Greek / English** Next.js application: a live signals dashboard, an interactive rotating globe, curated world feeds, personal topic selection, bookmarks, return-visit digest, four interactive labs, and source transparency.

## Quick start

- Requires Node.js >= 20.9 and npm.
- `npm install`
- `npm run dev` (http://localhost:3000)
- `npm run build` (production check)
- Deploy from the project root to Vercel, framework Next.js. No provider keys required for reading data.
- Install as PWA from a compatible phone browser; the live feed requires internet.

## Data / trust

- **Original data APIs:** USGS (earthquakes), NASA EONET (natural events), NOAA SWPC (space-weather alerts), Hacker News/Algolia (community activity), OpenAlex (research), Spaceflight News API.
- **Publisher RSS headlines:** BBC, Guardian, Al Jazeera, **ERT News and Naftemporiki in Greek**. Providers are independently health-checked. Unavailable feeds are clearly shown, never replaced with invented samples.
- News headlines and abstracts remain the publisher's original content and link to the publisher. Greek UI is complete; a separate opt-in **Greek machine translation** function for foreign-language titles/short summaries uses the public MyMemory Translation API. Translation can fail, be inaccurate, or be rate-limited. When used, the brief excerpt is sent to the translation provider. Only source-provided previews are translated; not entire copyrighted articles.
- Scores (0–100) are transparent editorial *interest heuristics*, **not** independently validated statistical anomalies, threat levels, probabilities, or fact-checking ratings.
- No implicit geographical inference. Globe points require event-specific source coordinates. Globe texture is Natural Earth illustrated geography, not live satellite photography.

## Features

- Greek default UI, English switch, persistent theme, browser-local topic and bookmark preferences.
- A genuinely rotating globe (touch drag / zoom / markers), with geolocated events from source data.
- Daily snapshot / since-last-visit counters; trending-by-score and topic-diverse side stream.
- Search (Ctrl/Cmd+K), category filters, recency ordering, news-only and high-interest modes, infinite incremental list loading.
- Modals contain source link, original record and transparent score methodology.
- Four interactive labs: seismic energy, solar Kp, score threshold, source health.
- Browser notifications while open after explicit permission; optional Telegram cron digest only with secure Vercel environment variables. Not full native background push.
- Installable PWA; service-worker cached app shell with versioning, network-first page navigation.

## Operational limitations

- `localStorage` sync is per browser. No accounts or cross-device sync.
- RSS publishers may throttle, move feeds, or change terms; provider-specific failures are shown in Settings.
- An opt-in machine translation can briefly send story text to a third-party service. Consider disabling `app/api/translate` if you do not want that behavior.
- Vercel's runtime/fetch caches may mean some changes are delayed by several minutes.

## Notifications

Daily optional Telegram digest: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `CRON_SECRET`, and (for deduplication, if documented) Vercel KV/Upstash configuration according to `app/api/cron/notify/route.ts`. Never commit credentials.

## Public APIs

`GET /api/feed` => `{signals, sources, generatedAt, methodology}`

`GET /api/status` => source-health snapshot

`POST /api/translate` => `{title, summary}` (en → el, only on explicit user action)

## GLITCH 6 — Blind Spot Watch / Στη σκιά

Under **Στη σκιά / Blind spots**, the application now surfaces potentially consequential but lightly covered events **within a defined observable news sample**. It sources qualifying events from UN News, USGS seismic data, and NOAA bulletins, applies disclosed editorial importance heuristics, and compares topic overlap across recent 72-hour headlines from up to four independent general-news RSS feeds (BBC World, Guardian World, Al Jazeera World, ΕΡΤ).

- The counter reads **matches / successfully retrieved monitored feeds**; it is *not* global coverage, audience share, or proof of deliberate suppression. If fewer than three general feeds work, the sample is labeled insufficient and no low-coverage conclusion is drawn.
- Every card links to its original source, the matching outlets, category rationale, and limitations.
- A voluntary **Check broader coverage (GDELT)** button sends a keyword query to the GDELT DOC 2.0 API. The response reports matching article records over 48 hours; keyword undercount, GDELT's own collection limits and outages are explicit. Failed lookups never become a zero-coverage value.
- No fabricated article counts or coverage claims. No generative AI involved. Automatic Greek translation remains best-effort, dependent on the configured translation API or quota-limited fallback.
- First-party linked documentation: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/ and https://news.un.org/feed/subscribe/en/news/all/rss.xml

## GitHub & Vercel

The ZIP contains all deployable source files. To link GitHub and Vercel, create an empty GitHub repository named `glitch-radar` in your own account and connect it in Vercel Project Settings → Git, or use the available GitHub/Vercel connectors. Never put secrets in the repository. If you use source upload deployment, it can be deployed independently of Git but it does **not** set up GitHub automatic deployments. This workflow requires creating the repository before linking it.
