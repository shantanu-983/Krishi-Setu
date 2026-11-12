# Krishi Setu — Database Schema & Data Models

This document specifies the MongoDB database architecture, Mongoose schemas, relationships, indexes, and data provenance rules for the Krishi Setu backend.

---

## 1. Design Principles & Data Provenance

External agricultural datasets have varying reliability, update frequencies, and licensing terms. To prevent deceptive claims:
1. Every price record carries a `dataType` enum:
   - `VERIFIED_LIVE`: Fetched from an authorized official government API (e.g. data.gov.in) with active verification.
   - `VERIFIED_HISTORICAL`: Historical observations from an official dataset.
   - `SYNTHETIC_DEMO`: Development fixtures clearly labeled as demonstration data.
   - `MANUALLY_ENTERED`: Entered by an administrator or farmer.
   - `REQUIRES_VERIFICATION`: Stored in database but pending expert/official verification.
2. Synthetic demo data is **never** presented as official government market data.
3. Every record stores source provenance: `sourceName`, `sourceUrl`, `retrievedAt`, and `observationDate`.
4. Stale data policy: Price records older than 72 hours (configurable via `PRICE_STALE_AFTER_HOURS`) are flagged with `isStale: true`.

---

## 2. Entity Models & Schemas

### 1. `Crop` Collection
Stores botanical and agronomic reference specifications for crops.

```typescript
{
  name: string;               // Unique crop name (e.g. "Wheat")
  localName?: string;         // Common Hindi/vernacular name (e.g. "Gehun")
  category: enum [            // Crop classification
    'CEREAL', 'PULSE', 'OILSEED', 'VEGETABLE',
    'FRUIT', 'SPICE', 'CASH_CROP', 'OTHER'
  ];
  seasons: ['KHARIF' | 'RABI' | 'ZAID'];
  conditions: {
    minTempC?: number;        // Minimum threshold temperature in °C
    maxTempC?: number;        // Maximum threshold temperature in °C
    minRainfallMm?: number;   // Minimum required rainfall in mm
    maxRainfallMm?: number;   // Maximum tolerated rainfall in mm
    soilTypes?: string[];     // Suitable soils: ['Alluvial', 'Black Cotton', etc.]
    phMin?: number;           // Minimum suitable soil pH
    phMax?: number;           // Maximum suitable soil pH
    waterRequirement?: 'LOW' | 'MEDIUM' | 'HIGH';
    notes?: string;           // Agronomic caveats & planting notes
  };
  sourceReference?: string;   // Publication citation (e.g. "ICAR Crop Guide")
  sourceUrl?: string;
  conditionsVerified: boolean;// false until vetted by agricultural expert
  ogdCommodityNames?: string[];// Known name variants in Agmarknet/OGD
  isActive: boolean;          // Soft-deletion flag (default: true)
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `{ name: 1 }` (unique)
- `{ seasons: 1 }`
- `{ category: 1 }`

---

### 2. `Mandi` Collection
Stores agricultural market yards (APMC mandis) and geographical coordinates.

```typescript
{
  name: string;               // Market yard name (e.g. "Indore Mandi")
  district: string;           // District (e.g. "Indore")
  state: string;              // State ("Madhya Pradesh" or "Uttar Pradesh")
  latitude?: number;          // Latitude (range: 8 to 37 for India)
  longitude?: number;         // Longitude (range: 68 to 97 for India)
  coordinatesVerified: boolean;// true only when verified via GPS/maps
  ogdMarketName?: string;     // Exact string in OGD dataset
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `{ name: 1, district: 1, state: 1 }` (unique compound index)
- `{ state: 1, district: 1 }`
- `{ isActive: 1 }`

---

### 3. `MandiPrice` Collection
Stores daily price observations for a given crop at a specific mandi.

```typescript
{
  mandiId: ObjectId;          // References Mandi._id (indexed)
  cropId: ObjectId;           // References Crop._id (indexed)
  variety?: string;           // Market variety (e.g. "FAQ", "Yellow")
  grade?: string;             // Quality grade (e.g. "Grade-A")
  observationDate: Date;      // Official date of the price quote
  minPriceInr?: number;       // Minimum reported price (₹/quintal)
  maxPriceInr?: number;       // Maximum reported price (₹/quintal)
  modalPriceInr?: number;     // Modal price (₹/quintal) — used for net realization
  unit: string;               // Must be "quintal" for calculations
  dataType: enum [            // Strict provenance classification
    'VERIFIED_LIVE',
    'VERIFIED_HISTORICAL',
    'SYNTHETIC_DEMO',
    'MANUALLY_ENTERED',
    'REQUIRES_VERIFICATION'
  ];
  sourceName: string;         // e.g. "OGD Mandi Dataset" or "Krishi Setu Fixtures"
  sourceUrl?: string;
  sourceRecordId?: string;
  retrievedAt: Date;          // Timestamp when fetched into Krishi Setu
  notes?: string;             // Mandatory warning on synthetic records
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `{ mandiId: 1, cropId: 1, observationDate: -1 }` (compound query index)
- `{ observationDate: -1 }`
- `{ dataType: 1 }`

---

### 4. `Village` Collection
Stores rural administrative village information and optional coordinates.

```typescript
{
  name: string;               // Village name (e.g. "Sanwer")
  district: string;           // District name
  state: string;              // State name
  block?: string;             // Sub-district / Tehsil / Block
  pincode?: string;           // 6-digit Indian PIN code
  latitude?: number;          // Latitude
  longitude?: number;         // Longitude
  coordinatesVerified: boolean;
  population?: number;
  nearbyMandiIds: string[];   // String array of Mandi IDs
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `{ name: 1, district: 1, state: 1 }` (unique compound index)
- `{ state: 1, district: 1 }`

---

### 5. `WeatherRecord` Collection
Stores weather observations and forecasts fetched from Open-Meteo.

```typescript
{
  latitude: number;           // Coordinate latitude
  longitude: number;          // Coordinate longitude
  locationLabel?: string;     // Friendly name (e.g. "Bhopal Central")
  recordType: enum [          // Separates forecast from historical reanalysis
    'FORECAST',
    'HISTORICAL'
  ];
  date: Date;                 // The date this weather data applies to
  maxTempC?: number;          // Daily max temperature in °C
  minTempC?: number;          // Daily min temperature in °C
  precipitationSumMm?: number;// Daily precipitation sum in mm
  et0FaoEvapotranspirationMm?: number; // Evapotranspiration
  weatherCode?: number;       // WMO weather code (0–99)
  windspeedMaxKmh?: number;   // Max wind speed in km/h
  sourceName: string;         // "Weather data by Open-Meteo.com"
  sourceUrl: string;          // "https://open-meteo.com/"
  retrievedAt: Date;          // Retrieval timestamp
  modelUsed?: string;         // e.g. "best_match", "era5"
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `{ latitude: 1, longitude: 1, date: 1, recordType: 1 }` (unique compound index)
- `{ date: -1 }`
- `{ retrievedAt: -1 }`

---

### 6. `GovernmentScheme` Collection
Stores curated agricultural government welfare and credit schemes.

```typescript
{
  schemeCode: string;         // Unique uppercase code (e.g. "PM-KISAN")
  schemeName: string;         // Full name
  ministry: string;           // Sponsoring central/state ministry
  department?: string;
  benefitType: string;        // e.g. "Direct Income Support (Cash Transfer)"
  benefitDescription: string; // Detail of financial/material assistance
  applicableStates: string[]; // Empty array = All India; otherwise specific states
  eligibilitySummary: string; // Plain-language summary (non-legal)
  eligibilityDetails: string[];// Verified requirements from portal
  exclusions: string[];       // Exclusion conditions
  documentsRequired?: string[];
  applicationInstructions?: string;
  officialUrl: string;        // Official portal URL (mandatory)
  applicationUrl?: string;    // Direct application URL
  status: enum [              // Active / Inactive / Under verification
    'ACTIVE', 'INACTIVE', 'REQUIRES_VERIFICATION'
  ];
  sourceVerifiedAt?: Date;    // Timestamp when verified by maintainers
  sourceVerifiedBy?: string;  // Citation or reviewer identification
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `{ schemeCode: 1 }` (unique)
- `{ status: 1, isActive: 1 }`
- `{ applicableStates: 1 }`

---

## 3. Relationships Diagram

```
      ┌─────────────────────────┐
      │         Village         │
      │   (name, state, lat/lon)│
      └────────────┬────────────┘
                   │ nearbyMandiIds
                   ▼
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│              Mandi              │           │              Crop               │
│ (name, district, state, lat/lon)│           │(name, seasons, ph, soil, water) │
└────────────────┬────────────────┘           └────────────────┬────────────────┘
                 │ mandiId                                     │ cropId
                 └──────────────────────┐   ┌──────────────────┘
                                        ▼   ▼
                            ┌─────────────────────────┐
                            │       MandiPrice        │
                            │(modalPrice, date, unit, │
                            │ dataType, sourceName)   │
                            └─────────────────────────┘

┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│          WeatherRecord          │           │        GovernmentScheme         │
│ (lat, lon, date, FORECAST/      │           │(schemeCode, ministry, benefits, │
│  HISTORICAL, temp, rain, WMO)   │           │ eligibility, exclusions, url)   │
└─────────────────────────────────┘           └─────────────────────────────────┘
```
