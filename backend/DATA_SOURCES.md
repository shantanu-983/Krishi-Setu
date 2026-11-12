# Krishi Setu — External Data Sources Register

**Document Version:** 1.0  
**Updated:** 2026-11-01  
**Project:** Krishi Setu (B.Tech CSE Minor Project)  
**Verification Ladder Standard:**
1. `IDENTIFIED` — Known source and URL.
2. `DOCUMENTATION_REVIEWED` — Official docs/terms analyzed.
3. `ACCESS_VERIFIED` — Live HTTP call made and confirmed.
4. `INTEGRATION_IMPLEMENTED` — Code adapter exists in backend.
5. `INTEGRATION_TESTED` — Automated tests passing against live/mocked data.

---

## Data Source Register

| Source ID | Module | Provider Name | Status | Access Method | Auth Required | Usage Terms / License | Known Limitations & Blocker Reason |
|---|---|---|---|---|---|---|---|
| **DS-01** | Smart Mandi | Current Daily Mandi Prices (`data.gov.in`) | `DOCUMENTATION_REVIEWED` | REST GET / CSV Download | **Yes** (Free API key from data.gov.in) | GODL-India / NDSAP (Permits non-commercial & educational use with attribution) | **Pending API key registration.** Endpoint requires project-owned key. Development uses clearly marked `SYNTHETIC_DEMO` fixtures. |
| **DS-02** | Smart Mandi | Agmarknet Third-Party Wrapper (`makrand999/agmarknet-api`) | `REJECTED` | Reverse-engineered POST/GET | None (Uses browser header spoofing) | **Violates portal terms.** Unauthorized scraping. | **Explicitly rejected.** Fragile, undocumented, violates government portal fair use. Will not be integrated. |
| **DS-03** | Climate Risk | Open-Meteo Weather Forecast API | `INTEGRATION_TESTED` | REST GET (`/v1/forecast`) | **No** (Free tier up to 10k req/day) | CC BY 4.0 (Attribution required: "Weather data by Open-Meteo.com") | Requires lat/lon coordinates. Forecast accuracy decreases after 7 days. Implemented in `weather.service.ts` with test suite. |
| **DS-04** | Climate Risk | Open-Meteo Historical Archive (Copernicus ERA5) | `INTEGRATION_TESTED` | REST GET (`/v1/archive`) | **No** | CC BY 4.0 / Copernicus License | ~5 day reporting lag for recent reanalysis data. Implemented in `fetchWeatherHistorical` with test suite. |
| **DS-05** | Mandi / Village | Leaflet.js Mapping Library | `IDENTIFIED` | Client-side npm / CDN | **No** | BSD 2-Clause | Frontend display library only. Does **not** compute road distances or transport costs. |
| **DS-06** | Mandi / Village | OpenStreetMap Standard Tiles | `DOCUMENTATION_REVIEWED` | HTTP GET raster tiles | **No** | ODbL / CC BY-SA (Attribution mandatory) | Strict tile usage policy: Must send custom descriptive `User-Agent`. Bulk downloading or offline caching is strictly prohibited. |
| **DS-07** | Mandi / Village | Nominatim OSM Geocoder | `IDENTIFIED` | REST GET (`/search`) | **No** (Strict 1 req/sec limit) | ODbL | Rural Indian village name coverage is incomplete. Pre-geocoding via manual verification recommended for MVP. |
| **DS-08** | Crop Opportunity | Soil Health Card Portal (`soilhealth.dac.gov.in`) | `IDENTIFIED` | Web Portal (React SPA) | Farmer login only | NDSAP / Personal data | **No public REST API exists.** Individual soil parameters must be entered by farmers from their physical Soil Health Card. |
| **DS-09** | Crop Opportunity | ICAR Publications & Crop Guides | `DOCUMENTATION_REVIEWED` | Manual curation from research reports | None | Academic Citation Required | Unstructured PDF/report content. Growing condition thresholds require expert guide review before production advice. |
| **DS-10** | Govt Support | Dept of Agri & Farmers Welfare (`agriwelfare.gov.in`) | `IDENTIFIED` | Web Portal (React SPA) | None | NDSAP | No machine-readable API. Scheme details must be manually curated and verified. |
| **DS-11** | Govt Support | PM-KISAN Portal (`pmkisan.gov.in`) | `DOCUMENTATION_REVIEWED` | Manual curation from portal HTML | None (Public information) | NDSAP | Form-based ASP.NET portal; no public JSON API. Seeded in registry with official URL and last-verified timestamp. |

---

## Fallback & Data Degradation Policy

1. **Mandi Prices:**
   - Priority 1: Verified official API (DS-01) when API key is active.
   - Priority 2: Cached database records with freshness indicator (`isStale: true` when > 72 hours old).
   - Priority 3: Clearly labelled development fixtures (`SYNTHETIC_DEMO`).
   - Prohibited: Never substitute synthetic data as official data; never substitute min/max for missing modal prices.

2. **Weather Data:**
   - Priority 1: Real-time Open-Meteo API query.
   - Priority 2: Cached observations from `WeatherRecord` collection.
   - Fallback: Dashboard reports `weather.status: "UNAVAILABLE"` with error notice without failing remaining modules.

3. **Soil Data:**
   - Self-entry by user based on their physical Soil Health Card. No unsupported automated scraping.

4. **Government Schemes:**
   - Seeded in database from official portal documents. Every record includes `officialUrl` and `sourceVerifiedAt`.
   - The platform never makes official eligibility decisions; links users directly to official application portals.
