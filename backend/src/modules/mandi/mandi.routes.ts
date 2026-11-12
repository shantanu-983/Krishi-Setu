import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Crop } from '../../models/Crop';
import { Mandi } from '../../models/Mandi';
import { MandiPrice } from '../../models/MandiPrice';
import { compareMandis } from './mandi.service';
import { checkOgdStatus, syncOgdMandiPrices } from './ogd.service';
import { successResponse, errorResponse } from '../../shared/errors';
import { paginationSchema } from '../../shared/validators';

export const mandiRouter = Router();

// ─── GET /crops ────────────────────────────────────────────────────────────────
mandiRouter.get('/crops', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const filter: Record<string, unknown> = { isActive: true };
    if (req.query.season) filter.seasons = req.query.season;
    if (req.query.category) filter.category = req.query.category;

    const [crops, total] = await Promise.all([
      Crop.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-__v')
        .lean(),
      Crop.countDocuments(filter),
    ]);

    return successResponse(res, crops, 200, {
      page, limit, total, totalPages: Math.ceil(total / limit),
    });
  } catch (e) { return next(e); }
});

// ─── GET /crops/:id ────────────────────────────────────────────────────────────
mandiRouter.get('/crops/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const crop = await Crop.findById(id).select('-__v').lean();
    if (!crop) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Crop not found' },
      });
    }
    return successResponse(res, crop);
  } catch (e) { return next(e); }
});

// ─── GET /mandis ───────────────────────────────────────────────────────────────
mandiRouter.get('/mandis', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const filter: Record<string, unknown> = { isActive: true };
    if (req.query.state) filter.state = req.query.state;
    if (req.query.district) filter.district = req.query.district;

    const [mandis, total] = await Promise.all([
      Mandi.find(filter).skip((page - 1) * limit).limit(limit).select('-__v').lean(),
      Mandi.countDocuments(filter),
    ]);

    return successResponse(res, mandis, 200, {
      page, limit, total, totalPages: Math.ceil(total / limit),
    });
  } catch (e) { return next(e); }
});

// ─── GET /mandis/:id ───────────────────────────────────────────────────────────
mandiRouter.get('/mandis/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const mandi = await Mandi.findById(id).select('-__v').lean();
    if (!mandi) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Mandi not found' },
      });
    }
    return successResponse(res, mandi);
  } catch (e) { return next(e); }
});

// ─── GET /prices ───────────────────────────────────────────────────────────────
mandiRouter.get('/prices', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dateParser = z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format. Expected YYYY-MM-DD or ISO 8601 string.',
      })
      .optional();

    const schema = z.object({
      mandiId: z.string().optional(),
      cropId: z.string().optional(),
      state: z.string().optional(),
      district: z.string().optional(),
      from: dateParser,
      to: dateParser,
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    });
    const params = schema.parse(req.query);

    const filter: Record<string, unknown> = {};
    if (params.cropId) filter.cropId = params.cropId;

    if (params.mandiId) {
      filter.mandiId = params.mandiId;
    } else if (params.state || params.district) {
      const mandiFilter: Record<string, unknown> = { isActive: true };
      if (params.state) mandiFilter.state = params.state;
      if (params.district) mandiFilter.district = params.district;
      const matchingMandis = await Mandi.find(mandiFilter).select('_id').lean();
      const mandiIds = matchingMandis.map((m) => m._id);
      filter.mandiId = { $in: mandiIds };
    }

    if (params.from || params.to) {
      filter.observationDate = {};
      if (params.from) (filter.observationDate as Record<string, unknown>).$gte = new Date(params.from);
      if (params.to) {
        // If date-only string like YYYY-MM-DD, include the full day
        const toDate = new Date(params.to);
        if (params.to.length === 10) {
          toDate.setUTCHours(23, 59, 59, 999);
        }
        (filter.observationDate as Record<string, unknown>).$lte = toDate;
      }
    }

    const skip = (params.page - 1) * params.limit;
    const [prices, total] = await Promise.all([
      MandiPrice.find(filter)
        .sort({ observationDate: -1 })
        .skip(skip)
        .limit(params.limit)
        .populate('mandiId', 'name district state')
        .populate('cropId', 'name')
        .select('-__v')
        .lean(),
      MandiPrice.countDocuments(filter),
    ]);

    return successResponse(res, prices, 200, {
      page: params.page, limit: params.limit, total,
      totalPages: Math.ceil(total / params.limit),
      note: 'Prices include dataType field. SYNTHETIC_DEMO records are sample data, not official prices.',
    });
  } catch (e) { return next(e); }
});

// ─── POST /mandi-comparison ────────────────────────────────────────────────────
const comparisonSchema = z.object({
  cropId: z.string().min(1),
  quantityQuintals: z.number().positive('Quantity must be greater than 0'),
  mandiEntries: z
    .array(
      z.object({
        mandiId: z.string().min(1),
        transportCostInr: z.number().nonnegative('Transport cost cannot be negative').nullable(),
        otherCostsInr: z.number().nonnegative('Other costs cannot be negative').nullable(),
      })
    )
    .min(1, 'At least one mandi entry is required')
    .max(10, 'At most 10 mandis can be compared'),
});

mandiRouter.post(
  '/mandi-comparison',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = comparisonSchema.parse(req.body);
      const result = await compareMandis(input);
      return successResponse(res, result);
    } catch (e) { return next(e); }
  }
);

// ─── GET /mandi/ogd-status ─────────────────────────────────────────────────────
mandiRouter.get('/mandi/ogd-status', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await checkOgdStatus();
    return successResponse(res, status, 200);
  } catch (e) { return next(e); }
});

// ─── POST /mandi/ogd-sync ──────────────────────────────────────────────────────
mandiRouter.post('/mandi/ogd-sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const state = req.body.state || 'Madhya Pradesh';
    const limit = Number(req.body.limit) || 20;
    const result = await syncOgdMandiPrices(state, limit);
    return successResponse(res, result, 200);
  } catch (e) { return next(e); }
});
