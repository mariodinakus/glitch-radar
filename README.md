# VIBECESSION RADAR

Responsive, standalone EU economic perception dashboard (vanilla HTML/CSS/JS, zero dependencies).

## What it shows

- 27 EU countries and their latest official Eurostat observations
- Experimental economy-versus-consumer-confidence gap (not an official statistic)
- Country ranking, interactive country deep dive and confidence history
- Interactive fundamentals/sentiment scatter chart
- Confidence, GDP, inflation and unemployment, with source-period labels
- Greek user interface and installable PWA manifest

## Data and methodology

The app requests JSON-stat data **directly in the visitor's browser** from the Eurostat dissemination API:

| Indicator | Dataset | Configuration |
| --- | --- | --- |
| Consumer confidence | `ei_bsco_m` | `BS-CSMCI`, SA, BAL |
| Real GDP yearly change | `namq_10_gdp` | `B1GQ`, `CLV_PCH_SM`, SCA |
| HICP annual inflation | `prc_hicp_minr` | `CP00`, `RCH_A` |
| Unemployment | `une_rt_m` | TOTAL, T, `PC_ACT`, SA |

For each country and series, take the latest official value (within a reasonable freshness threshold) and compare it with that country's own observed 2016–2024 baseline, generating a standardised z-score (`(latest − baseline mean) / baseline standard deviation`, clipped to ±3). Define `fundamentals = 0.45 × z(GDP) − 0.30 × z(unemployment) − 0.25 × z(inflation)`. The experimental gap is `fundamentals − z(consumer confidence)`. A country is a *possible vibecession* when `gap ≥ 1.15`, `z(confidence) ≤ −0.45`, and `fundamentals ≥ −0.25`. If confidence and fundamentals are both weak, classify it as macroeconomic pressure rather than a vibecession. Every country needs enough usable observations from all four indicators, or it is left unclassified.

**Interpretation warning:** Cross-frequency macro indicators are not strictly contemporaneous. Consumer surveys can reflect living costs, housing, inequality, personal circumstances, or expectations not fully represented by these four macro indicators. The score is indicative and not statistically validated.

## Development

Use any static file server, such as:

```bash
python -m http.server 8080
```

Open `http://localhost:8080`. There are no build dependencies. Since the browser fetches the official API, internet access is required.

## Deploy to Render Static Site

1. Deploy this `vibecession-radar` branch as an independent Render Static Site.
2. In Render, select **New → Static Site** and connect that GitHub repository.
3. Build Command: `echo "No build required"`
4. Publish Directory: `.`
5. Enable Auto Deploy if desired.

## Important: no synthetic data

The UI deliberately starts without score values and only displays results from actual API responses. If Eurostat is unavailable or CORS is blocked, it shows an explicit error rather than invented current numbers.
## V1 Intelligence additions

- Transparent 4-factor z-score decomposition and country-by-country comparison
- Automatically labelled source freshness, availability, and retrieval times
- Per-source cached *official* time series as fallback, never synthetic data
- Archived HICP back-history when ECOICOP2 lacks a 2016–2024 comparator (classification discontinuity documented)
- Dynamic signal feed, sorting, per-country share URLs and CSV data export
- Accurate source periods; status is experimental, not an official Eurostat classification
