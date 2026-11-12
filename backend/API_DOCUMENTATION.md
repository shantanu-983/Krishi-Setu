# Krishi Setu — API Documentation

This document describes all REST API endpoints provided by the Krishi Setu backend.

All endpoints are versioned under the `/api/v1` prefix.

---

## Standard Response Envelopes

### Success Envelope
All successful requests return HTTP 200 (or 201) with the following JSON envelope:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Error Envelope
All error responses return the appropriate HTTP 4xx or 5xx status code with a uniform error structure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Quantity must be greater than 0 quintals",
    "details": null
  }
}
```

Standard Error Codes:
- `VALIDATION_ERROR` (400) — Query or body failed Zod schema validation.
- `INVALID_IDENTIFIER` (400) — Invalid MongoDB ObjectId format.
- `NOT_FOUND` (404) — Requested resource was not found.
- `EXTERNAL_API_ERROR` (502) — An upstream provider (e.g. Open-Meteo) returned an error or timed out.
- `INTERNAL_ERROR` (500) — Unhandled server error.

---

## 1. System & Metadata Endpoints

### `GET /api/v1/health`
Checks backend and database connectivity.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "version": "1.0.0",
    "project": "Krishi Setu",
    "environment": "development",
    "database": {
      "status": "connected"
    },
    "timestamp": "2026-11-01T00:00:00.000Z"
  }
}
```

### `GET /api/v1/data-sources/status`
Returns the status, licensing, and integration level of all evaluated external data sources.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sources": [
      {
        "id": "DS-01",
        "name": "OGD Mandi Dataset (data.gov.in)",
        "status": "DOCUMENTATION_REVIEWED",
        "authRequired": true,
        "authStatus": "API_KEY_NOT_YET_OBTAINED",
        "integrationStatus": "NOT_IMPLEMENTED"
      },
      {
        "id": "DS-03",
        "name": "Open-Meteo Forecast API",
        "status": "DOCUMENTATION_REVIEWED",
        "authRequired": false,
        "integrationStatus": "IMPLEMENTED",
        "endpoint": "https://api.open-meteo.com/v1/forecast",
        "attribution": "Weather data by Open-Meteo.com (CC BY 4.0)"
      }
    ],
    "generatedAt": "2026-11-01T00:00:00.000Z"
  }
}
```

### `GET /api/v1/docs` & `GET /api/v1/openapi.json`
- `/api/v1/docs`: Interactive Swagger UI HTML page.
- `/api/v1/openapi.json`: OpenAPI 3.0.3 specification JSON.

---

## 2. Smart Mandi Decision Engine

### `GET /api/v1/crops`
Lists reference crops.

**Query Parameters:**
- `season` (*optional*): `KHARIF` | `RABI` | `ZAID`
- `category` (*optional*): `CEREAL` | `PULSE` | `OILSEED` | `VEGETABLE` | `FRUIT` | `SPICE` | `CASH_CROP` | `OTHER`
- `page` (*optional*, default: `1`): Page number
- `limit` (*optional*, default: `20`): Page size

### `GET /api/v1/crops/:id`
Retrieves a single crop by its MongoDB ID.

### `GET /api/v1/mandis`
Lists mandis in pilot locations.

**Query Parameters:**
- `state` (*optional*): `Madhya Pradesh` | `Uttar Pradesh`
- `district` (*optional*): District name
- `page` (*optional*, default: `1`)
- `limit` (*optional*, default: `20`)

### `GET /api/v1/mandis/:id`
Retrieves single mandi profile and coordinates.

### `GET /api/v1/prices`
Queries historical and current mandi prices.

**Query Parameters:**
- `cropId` (*optional*): MongoDB ObjectId of the crop
- `mandiId` (*optional*): MongoDB ObjectId of the mandi
- `state` (*optional*): Filter mandis by state
- `district` (*optional*): Filter mandis by district
- `from` (*optional*): Start date (`YYYY-MM-DD` or ISO string)
- `to` (*optional*): End date (`YYYY-MM-DD` or ISO string)
- `page` (*optional*, default: `1`)
- `limit` (*optional*, default: `20`)

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6724...",
      "mandiId": {
        "_id": "6724...",
        "name": "Indore Mandi",
        "district": "Indore",
        "state": "Madhya Pradesh"
      },
      "cropId": {
        "_id": "6724...",
        "name": "Wheat"
      },
      "observationDate": "2026-10-30T00:00:00.000Z",
      "modalPriceInr": 2250,
      "minPriceInr": 2150,
      "maxPriceInr": 2350,
      "unit": "quintal",
      "dataType": "SYNTHETIC_DEMO",
      "sourceName": "Krishi Setu Development Fixtures",
      "notes": "SAMPLE DATA FOR DEMONSTRATION ONLY. NOT official government prices."
    }
  ]
}
```

### `POST /api/v1/mandi-comparison`
Calculates transparent estimated net realization across multiple candidate mandis.

**Request Body:**
```json
{
  "cropId": "6724...",
  "quantityQuintals": 15,
  "mandiEntries": [
    {
      "mandiId": "6724a...",
      "transportCostInr": 600,
      "otherCostsInr": 50
    },
    {
      "mandiId": "6724b...",
      "transportCostInr": null,
      "otherCostsInr": null
    }
  ]
}
```

**Calculation Rules:**
- `Gross Sale Value = Modal Price × Quantity`
- `Estimated Net Realization = Gross Sale Value − Transport Cost − Other Selling Costs`
- If `transportCostInr` is `null` (unknown), `status` is `"INCOMPLETE"`.
- If modal price is missing, `status` is `"NO_PRICE_DATA"` (min/max prices are never substituted).
- Negative costs or non-positive quantities return HTTP 400.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "cropName": "Wheat",
    "quantityQuintals": 15,
    "unit": "quintal",
    "resultsDisclaimer": "These figures are estimates based on available reference prices and user-entered costs...",
    "mandis": [
      {
        "mandiId": "6724a...",
        "mandiName": "Indore Mandi",
        "district": "Indore",
        "state": "Madhya Pradesh",
        "price": {
          "modalPriceInr": 2250,
          "minPriceInr": 2150,
          "maxPriceInr": 2350,
          "observationDate": "2026-10-30",
          "isStale": false,
          "dataType": "SYNTHETIC_DEMO"
        },
        "costs": {
          "transportCostInr": 600,
          "otherCostsInr": 50,
          "transportCostType": "USER_ENTERED"
        },
        "calculation": {
          "status": "COMPLETE",
          "grossSaleValueInr": 33750,
          "totalCostsInr": 650,
          "estimatedNetRealizationInr": 33100,
          "disclaimer": "Estimated Net Realization is based on the modal price shown and user-entered costs. This is an estimate, not a guaranteed payment.",
          "missingFields": []
        }
      }
    ],
    "generatedAt": "2026-11-01T00:00:00.000Z"
  }
}
```

---

## 3. Crop Opportunity Engine

### `POST /api/v1/crop-assessments`
Compares entered farm conditions against documented crop requirements.

**Request Body:**
```json
{
  "season": "RABI",
  "soilType": "Alluvial",
  "soilPh": 6.8,
  "annualRainfallMm": 650,
  "waterAvailability": "MEDIUM",
  "state": "Madhya Pradesh"
}
```

**Assessment Rules:**
- Compares each factor transparently: Season, Soil Type, pH, Rainfall, and Water Availability.
- Match levels: `MATCH`, `PARTIAL_MATCH`, `NO_MATCH`, `UNKNOWN`.
- Overall assessment:
  - `POTENTIALLY_SUITABLE`: All known factors match documented requirements.
  - `CONDITION_MISMATCH`: One or more known factors conflict with requirements.
  - `INSUFFICIENT_DATA`: Less than two non-trivial factors provided.
- Does not claim definitive yield or profitability.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "disclaimer": "These assessments are based on general documented crop requirements and your entered farm conditions...",
    "results": [
      {
        "cropId": "6724...",
        "cropName": "Wheat",
        "seasons": ["RABI"],
        "factorResults": [
          {
            "factor": "Season",
            "inputValue": "RABI",
            "matchLevel": "MATCH",
            "note": "Wheat is documented as a RABI crop."
          },
          {
            "factor": "Soil pH",
            "inputValue": "6.8",
            "requiredRange": "6–7.5",
            "matchLevel": "MATCH",
            "note": "pH 6.8 is within the documented suitable range of 6–7.5."
          }
        ],
        "overallAssessment": "POTENTIALLY_SUITABLE",
        "assessmentNote": "Entered conditions are broadly consistent with documented requirements. This is an indicative match only — not a prediction of success or profitability.",
        "conditionsVerified": true
      }
    ]
  }
}
```

---

## 4. Climate Risk Engine

### `GET /api/v1/weather`
Retrieves daily forecast weather data from Open-Meteo.

**Query Parameters:**
- `latitude` (*required*): Target latitude (`-90` to `90`)
- `longitude` (*required*): Target longitude (`-180` to `180`)
- `days` (*optional*, default: `7`, max: `16`): Forecast horizon
- `locationLabel` (*optional*): Human-readable name

**Response Example:**
```json
{
  "success": true,
  "data": {
    "latitude": 23.25,
    "longitude": 77.41,
    "timezone": "Asia/Kolkata",
    "attribution": "Weather data by Open-Meteo.com",
    "sourceUrl": "https://open-meteo.com/",
    "retrievedAt": "2026-11-01T00:00:00.000Z",
    "freshness": {
      "isStale": false,
      "ageHours": 0.1
    },
    "forecastDays": [
      {
        "date": "2026-11-01",
        "recordType": "FORECAST",
        "maxTempC": 31.5,
        "minTempC": 18.2,
        "precipitationSumMm": 0,
        "weatherCode": 1,
        "weatherDescription": "Mainly clear",
        "windspeedMaxKmh": 12.5
      }
    ],
    "limitations": [
      "Forecast accuracy decreases beyond 7 days.",
      "Data represents a single coordinate point — local micro-climate variations are not captured.",
      "This is a weather forecast, not an agricultural risk assessment. No drought, heat, or flood risk levels are computed.",
      "Attribution: Weather data by Open-Meteo.com (CC BY 4.0)"
    ]
  }
}
```

### `GET /api/v1/weather/historical`
Retrieves historical weather observations from the Copernicus ERA5 reanalysis archive via Open-Meteo.

**Query Parameters:**
- `latitude` (*required*)
- `longitude` (*required*)
- `startDate` (*required*): `YYYY-MM-DD`
- `endDate` (*required*): `YYYY-MM-DD`
- `locationLabel` (*optional*)

---

## 5. Government Support Engine

### `GET /api/v1/schemes`
Lists active government agricultural assistance schemes.

**Query Parameters:**
- `state` (*optional*): Returns state-specific schemes plus all-India schemes
- `status` (*optional*, default: `ACTIVE`): `ACTIVE` | `INACTIVE` | `REQUIRES_VERIFICATION`
- `search` (*optional*): Text search on scheme name and description
- `page` (*optional*, default: `1`)
- `limit` (*optional*, default: `20`)

### `GET /api/v1/schemes/:id`
Retrieves complete scheme details by MongoDB ObjectId OR by `schemeCode` (e.g. `/schemes/PM-KISAN`).

**Response Example:**
```json
{
  "success": true,
  "data": {
    "schemeCode": "PM-KISAN",
    "schemeName": "Pradhan Mantri Kisan Samman Nidhi",
    "ministry": "Ministry of Agriculture & Farmers Welfare",
    "department": "Department of Agriculture & Farmers Welfare",
    "benefitType": "Direct Income Support (Cash Transfer)",
    "benefitDescription": "₹6,000 per year in three instalments of ₹2,000 each...",
    "eligibilitySummary": "Small and marginal farmers owning cultivable land...",
    "eligibilityDetails": [
      "Must be a farmer owning cultivable land as per state/UT land records.",
      "eKYC is mandatory."
    ],
    "exclusions": [
      "Institutional landholders.",
      "Income tax payers."
    ],
    "documentsRequired": [
      "Aadhaar card",
      "Land ownership documents / Khasra-Khatauni",
      "Bank account details"
    ],
    "officialUrl": "https://pmkisan.gov.in/",
    "applicationUrl": "https://pmkisan.gov.in/RegistrationFormupdated.aspx",
    "sourceVerifiedAt": "2026-10-30T00:00:00.000Z",
    "disclaimer": "This information is sourced from official government portals and is provided for informational purposes only. Krishi Setu does not determine official eligibility or guarantee scheme benefits."
  }
}
```

---

## 6. Village Agriculture Dashboard

### `GET /api/v1/villages`
Lists villages in pilot districts.

### `GET /api/v1/villages/:id`
Retrieves village profile details and coordinates.

### `GET /api/v1/villages/:id/dashboard`
Aggregates data from all four modules into an integrated overview for the village.

**Response Structure (Graceful Degradation):**
```json
{
  "success": true,
  "data": {
    "village": {
      "id": "6724...",
      "name": "Sanwer",
      "district": "Indore",
      "state": "Madhya Pradesh",
      "coordinates": {
        "latitude": 22.9694,
        "longitude": 75.8309
      }
    },
    "weather": {
      "status": "AVAILABLE",
      "data": {
        "forecastDays": [ ... ],
        "attribution": "Weather data by Open-Meteo.com",
        "retrievedAt": "2026-11-01T00:00:00.000Z",
        "freshness": { "isStale": false, "ageHours": 0.2 }
      }
    },
    "mandiPrices": {
      "status": "AVAILABLE",
      "data": {
        "entries": [
          {
            "mandiName": "Indore Mandi",
            "district": "Indore",
            "cropName": "Soybean",
            "modalPriceInr": 4200,
            "observationDate": "2026-10-30",
            "dataType": "SYNTHETIC_DEMO",
            "isStale": false
          }
        ]
      }
    },
    "crops": {
      "status": "AVAILABLE",
      "data": {
        "seasonalCrops": [ ... ]
      }
    },
    "schemes": {
      "status": "AVAILABLE",
      "data": {
        "activeSchemes": [ ... ]
      }
    },
    "generatedAt": "2026-11-01T00:00:00.000Z",
    "dashboardNote": "This dashboard combines available data from multiple sources. Unavailable sections are shown with their individual status."
  }
}
```
*Note: If weather data has not yet been fetched for a village, `weather.status` returns `"UNAVAILABLE"` with an informative message, while `mandiPrices`, `crops`, and `schemes` continue to render successfully.*
