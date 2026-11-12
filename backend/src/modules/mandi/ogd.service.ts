/**
 * Smart Mandi Decision Engine — Official OGD India Ingestion Service
 *
 * Sourced directly from official Open Government Data (data.gov.in):
 * Resource ID: 9ef84268-d588-465a-a308-a864a43d0070
 * Dataset: "Current Daily Price of Various Commodities from Various Markets (Mandi)"
 *
 * STRICT PROJECT CONSTRAINTS:
 *  - Third-party Agmarknet wrappers/scrapers are EXPLICITLY REJECTED and forbidden.
 *  - When OGD_API_KEY is not configured or rejected by data.gov.in (HTTP 403),
 *    the system MUST NOT crash or return HTTP 500.
 *  - Falls back gracefully to verified reference fixtures clearly labelled SYNTHETIC_DEMO.
 *  - Official government records are labelled OFFICIAL_GOVERNMENT.
 */

import axios, { AxiosError } from 'axios';
import { config } from '../../config/env';
import { Mandi } from '../../models/Mandi';
import { Crop } from '../../models/Crop';
import { MandiPrice } from '../../models/MandiPrice';

export const OGD_RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
export const OGD_BASE_URL = 'https://api.data.gov.in/resource';
export const OGD_PORTAL_URL = 'https://www.data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi';

export interface OgdStatusResult {
  configured: boolean;
  status: 'ACTIVE_AND_VERIFIED' | 'API_KEY_INVALID_OR_NOT_OBTAINED' | 'NETWORK_ERROR';
  apiKeyMasked: string | null;
  gatewayUrl: string;
  officialDatasetUrl: string;
  thirdPartyWrapperRejected: boolean;
  wrapperRejectionReason: string;
  message: string;
  actionableGuidance: string;
  httpStatus?: number;
  lastCheckedAt: string;
}

export interface OgdRecord {
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  variety?: string;
  arrival_date?: string;
  min_price?: string | number;
  max_price?: string | number;
  modal_price?: string | number;
}

export interface OgdSyncResult {
  synced: number;
  skipped: number;
  status: 'SUCCESS' | 'FALLBACK_DEMO_RETAINED' | 'FAILED';
  message: string;
}

/**
 * Checks if the configured OGD_API_KEY is a placeholder or unobtained.
 */
export function isPlaceholderKey(key: string | undefined): boolean {
  if (!key) return true;
  const trimmed = key.trim();
  return (
    trimmed === '' ||
    trimmed === 'REPLACE_WITH_YOUR_KEY' ||
    trimmed.startsWith('REPLACE') ||
    trimmed === 'your_ogd_api_key_here' ||
    trimmed.length < 10
  );
}

/**
 * Safely evaluates OGD India connection status without crashing or leaking keys.
 */
export async function checkOgdStatus(): Promise<OgdStatusResult> {
  const rawKey = config.OGD_API_KEY;
  const isPlaceholder = isPlaceholderKey(rawKey);
  const now = new Date().toISOString();

  const masked = isPlaceholder || !rawKey
    ? null
    : `${rawKey.slice(0, 4)}...${rawKey.slice(-4)}`;

  const baseResult: Omit<OgdStatusResult, 'status' | 'message' | 'actionableGuidance'> = {
    configured: !isPlaceholder,
    apiKeyMasked: masked,
    gatewayUrl: `${OGD_BASE_URL}/${OGD_RESOURCE_ID}`,
    officialDatasetUrl: OGD_PORTAL_URL,
    thirdPartyWrapperRejected: true,
    wrapperRejectionReason:
      'Third-party scraper wrappers (such as unverified GitHub clients or scraper APIs) ' +
      'violate data provenance integrity and terms of service. Krishi Setu strictly interfaces ' +
      'with official data.gov.in or authenticated local reference fixtures.',
    lastCheckedAt: now,
  };

  if (isPlaceholder) {
    return {
      ...baseResult,
      status: 'API_KEY_INVALID_OR_NOT_OBTAINED',
      message:
        'Official data.gov.in API key has not been configured in .env (placeholder detected). ' +
        'System operates safely with transparently labelled SYNTHETIC_DEMO reference fixtures.',
      actionableGuidance:
        'To enable live government mandi sync, register for a free API key at https://data.gov.in, ' +
        'and set OGD_API_KEY in the backend .env configuration.',
    };
  }

  // Attempt lightweight probe with 5000ms timeout
  try {
    const probeUrl = `${OGD_BASE_URL}/${OGD_RESOURCE_ID}`;
    const res = await axios.get(probeUrl, {
      params: {
        'api-key': rawKey,
        format: 'json',
        limit: 1,
      },
      timeout: 5000,
    });

    if (res.status === 200) {
      return {
        ...baseResult,
        status: 'ACTIVE_AND_VERIFIED',
        httpStatus: 200,
        message: 'Successfully connected and verified against official data.gov.in API gateway.',
        actionableGuidance: 'Live daily mandi price ingestion is operational.',
      };
    }

    return {
      ...baseResult,
      status: 'API_KEY_INVALID_OR_NOT_OBTAINED',
      httpStatus: res.status,
      message: `Gateway responded with unexpected HTTP ${res.status}.`,
      actionableGuidance: 'Check API key activation status on the data.gov.in user portal.',
    };
  } catch (err: any) {
    if (err instanceof AxiosError && err.response) {
      const code = err.response.status;
      if (code === 403) {
        return {
          ...baseResult,
          status: 'API_KEY_INVALID_OR_NOT_OBTAINED',
          httpStatus: 403,
          message:
            'The official data.gov.in gateway rejected the request with HTTP 403 Forbidden. ' +
            'The API key is invalid, unverified, or rate-limited. System defaults to reference fixtures.',
          actionableGuidance:
            'Verify that your data.gov.in account has approved the Mandi Daily Price API and generated an active key.',
        };
      }
      return {
        ...baseResult,
        status: 'NETWORK_ERROR',
        httpStatus: code,
        message: `OGD Gateway returned HTTP ${code}: ${err.message}`,
        actionableGuidance: 'Ensure network route to data.gov.in is accessible.',
      };
    }

    return {
      ...baseResult,
      status: 'NETWORK_ERROR',
      message: `Unable to reach data.gov.in gateway: ${err.message || String(err)}`,
      actionableGuidance: 'Verify outbound internet connectivity to api.data.gov.in.',
    };
  }
}

/**
 * Safely fetches and synchronizes official mandi prices for given state.
 * Never throws an uncaught error: if the key fails or network is offline,
 * logs diagnostic status and returns fallback sync summary.
 */
export async function syncOgdMandiPrices(state: string, limit = 50): Promise<OgdSyncResult> {
  const rawKey = config.OGD_API_KEY;
  if (isPlaceholderKey(rawKey)) {
    return {
      synced: 0,
      skipped: 0,
      status: 'FALLBACK_DEMO_RETAINED',
      message: 'OGD_API_KEY is not configured. Retaining authenticated SYNTHETIC_DEMO fixtures.',
    };
  }

  try {
    const res = await axios.get(`${OGD_BASE_URL}/${OGD_RESOURCE_ID}`, {
      params: {
        'api-key': rawKey,
        format: 'json',
        limit,
        'filters[state]': state,
      },
      timeout: config.EXTERNAL_API_TIMEOUT_MS,
    });

    const records: OgdRecord[] = res.data?.records || [];
    if (!Array.isArray(records) || records.length === 0) {
      return {
        synced: 0,
        skipped: 0,
        status: 'SUCCESS',
        message: `No new mandi price records returned by OGD for state ${state}.`,
      };
    }

    let synced = 0;
    let skipped = 0;

    for (const rec of records) {
      if (!rec.market || !rec.commodity || !rec.modal_price) {
        skipped++;
        continue;
      }

      const modalPrice = Number(rec.modal_price);
      if (isNaN(modalPrice) || modalPrice <= 0) {
        skipped++;
        continue;
      }

      // Upsert Mandi
      const mandi = await Mandi.findOneAndUpdate(
        { name: rec.market.trim(), state: rec.state?.trim() || state },
        {
          $setOnInsert: {
            name: rec.market.trim(),
            state: rec.state?.trim() || state,
            district: rec.district?.trim() || 'General',
            isActive: true,
          },
        },
        { upsert: true, new: true }
      );

      // Find or create Crop
      const crop = await Crop.findOneAndUpdate(
        { name: { $regex: new RegExp(`^${rec.commodity.trim()}$`, 'i') } },
        {
          $setOnInsert: {
            name: rec.commodity.trim(),
            category: 'OTHER',
            seasons: ['RABI', 'KHARIF'],
            isActive: true,
            conditionsVerified: false,
          },
        },
        { upsert: true, new: true }
      );

      const obsDate = rec.arrival_date ? new Date(rec.arrival_date) : new Date();

      await MandiPrice.create({
        mandiId: mandi._id,
        cropId: crop._id,
        modalPriceInr: modalPrice,
        minPriceInr: Number(rec.min_price) || modalPrice,
        maxPriceInr: Number(rec.max_price) || modalPrice,
        unit: 'quintal',
        observationDate: isNaN(obsDate.getTime()) ? new Date() : obsDate,
        dataType: 'VERIFIED_LIVE',
        sourceName: 'Open Government Data (data.gov.in)',
        retrievedAt: new Date(),
      });

      synced++;
    }

    return {
      synced,
      skipped,
      status: 'SUCCESS',
      message: `Synchronized ${synced} official government mandi price records from data.gov.in.`,
    };
  } catch (err: any) {
    return {
      synced: 0,
      skipped: 0,
      status: 'FALLBACK_DEMO_RETAINED',
      message: `OGD sync safely avoided breaking: ${err.message || String(err)}. Retaining reference fixtures.`,
    };
  }
}
