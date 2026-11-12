import { z } from 'zod';

// ─── Common pagination ─────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

export function paginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── State enum — restricted to MP and UP for MVP ─────────────────────────────

export const MVP_STATES = ['Madhya Pradesh', 'Uttar Pradesh'] as const;
export type MvpState = (typeof MVP_STATES)[number];

export const stateSchema = z
  .enum(MVP_STATES)
  .describe('State must be one of the MVP pilot states: Madhya Pradesh or Uttar Pradesh');

// ─── Coordinate validator ──────────────────────────────────────────────────────

export const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// ─── Non-negative number helper ────────────────────────────────────────────────

export const nonNegativeNumber = z.number().nonnegative('Value must be 0 or greater');

export const positiveNumber = z.number().positive('Value must be greater than 0');
