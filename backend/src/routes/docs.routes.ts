import { Router, Request, Response } from 'express';

export const docsRouter = Router();

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Krishi Setu API',
    version: '1.0.0',
    description:
      'Backend REST API for Krishi Setu — Village-Level Agriculture Decision Support Platform.\n' +
      'Supports Smart Mandi comparison, Crop Opportunity Engine, Climate Risk weather data, ' +
      'Government Scheme Registry, and Village Agriculture Dashboard.',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 root',
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Service health check',
        responses: {
          '200': { description: 'Service and database healthy' },
          '503': { description: 'Database disconnected or degraded' },
        },
      },
    },
    '/data-sources/status': {
      get: {
        summary: 'External data source integration status register',
        responses: {
          '200': { description: 'Status of all 7 evaluated external sources' },
        },
      },
    },
    '/crops': {
      get: {
        summary: 'List agricultural crops with optional season/category filters',
        parameters: [
          { name: 'season', in: 'query', schema: { type: 'string', enum: ['KHARIF', 'RABI', 'ZAID'] } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'List of crops' },
        },
      },
    },
    '/crops/{id}': {
      get: {
        summary: 'Get crop details by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Crop details' },
          '404': { description: 'Crop not found' },
        },
      },
    },
    '/mandis': {
      get: {
        summary: 'List mandis with optional state and district filters',
        parameters: [
          { name: 'state', in: 'query', schema: { type: 'string' } },
          { name: 'district', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'List of mandis' },
        },
      },
    },
    '/mandis/{id}': {
      get: {
        summary: 'Get mandi details by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Mandi details' },
          '404': { description: 'Mandi not found' },
        },
      },
    },
    '/prices': {
      get: {
        summary: 'Query mandi commodity prices with provenance and date filtering',
        parameters: [
          { name: 'mandiId', in: 'query', schema: { type: 'string' } },
          { name: 'cropId', in: 'query', schema: { type: 'string' } },
          { name: 'state', in: 'query', schema: { type: 'string' } },
          { name: 'district', in: 'query', schema: { type: 'string' } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'Filtered prices with provenance metadata' },
        },
      },
    },
    '/mandi-comparison': {
      post: {
        summary: 'Calculate transparent estimated net realization across candidate mandis',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['cropId', 'quantityQuintals', 'mandiEntries'],
                properties: {
                  cropId: { type: 'string' },
                  quantityQuintals: { type: 'number', minimum: 0.01 },
                  mandiEntries: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['mandiId'],
                      properties: {
                        mandiId: { type: 'string' },
                        transportCostInr: { type: 'number', nullable: true, minimum: 0 },
                        otherCostsInr: { type: 'number', nullable: true, minimum: 0 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Comparison calculation breakdown' },
          '400': { description: 'Validation error (negative values, missing required fields)' },
          '404': { description: 'Crop or Mandi not found' },
        },
      },
    },
    '/crop-assessments': {
      post: {
        summary: 'Assess crop suitability against documented conditions with explainable factor matching',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['season'],
                properties: {
                  season: { type: 'string', enum: ['KHARIF', 'RABI', 'ZAID'] },
                  soilType: { type: 'string' },
                  soilPh: { type: 'number', minimum: 0, maximum: 14 },
                  annualRainfallMm: { type: 'number', minimum: 0 },
                  waterAvailability: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
                  state: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Crop opportunity assessments with factor match breakdown' },
          '400': { description: 'Invalid farm input parameters' },
        },
      },
    },
    '/weather': {
      get: {
        summary: 'Fetch Open-Meteo weather forecast (up to 16 days) with provenance',
        parameters: [
          { name: 'latitude', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'longitude', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'days', in: 'query', schema: { type: 'integer', default: 7, minimum: 1, maximum: 16 } },
          { name: 'locationLabel', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Forecast daily observations with provenance' },
          '502': { description: 'External Open-Meteo API unreachable or timed out' },
        },
      },
    },
    '/weather/historical': {
      get: {
        summary: 'Fetch historical weather reanalysis data from Open-Meteo ERA5 archive',
        parameters: [
          { name: 'latitude', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'longitude', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'startDate', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'locationLabel', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Historical daily weather data with provenance' },
          '502': { description: 'External Open-Meteo archive API error' },
        },
      },
    },
    '/schemes': {
      get: {
        summary: 'Search and filter active government agricultural support schemes',
        parameters: [
          { name: 'state', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'REQUIRES_VERIFICATION'] } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'List of schemes matching query' },
        },
      },
    },
    '/schemes/{id}': {
      get: {
        summary: 'Get scheme details by ObjectId or schemeCode (e.g. PM-KISAN)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Full verified scheme details with official source URLs' },
          '404': { description: 'Scheme not found' },
        },
      },
    },
    '/villages': {
      get: {
        summary: 'List villages with optional state and district filters',
        parameters: [
          { name: 'state', in: 'query', schema: { type: 'string' } },
          { name: 'district', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'List of villages' },
        },
      },
    },
    '/villages/{id}': {
      get: {
        summary: 'Get village profile by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Village profile' },
          '404': { description: 'Village not found' },
        },
      },
    },
    '/villages/{id}/dashboard': {
      get: {
        summary: 'Aggregated village-level overview combining all 4 modules with graceful partial degradation',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Aggregated dashboard showing status for weather, mandi prices, crops, and schemes' },
          '404': { description: 'Village not found' },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register a new farmer or admin user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'phone', 'password'],
                properties: {
                  name: { type: 'string', example: 'Ramesh Patel' },
                  phone: { type: 'string', example: '9876543210' },
                  password: { type: 'string', example: 'secret123' },
                  role: { type: 'string', enum: ['farmer', 'admin'], default: 'farmer' },
                  state: { type: 'string', example: 'Madhya Pradesh' },
                  district: { type: 'string', example: 'Indore' },
                  farmSizeAcres: { type: 'number', example: 4.5 },
                  primaryCrops: { type: 'array', items: { type: 'string' }, example: ['Wheat', 'Soybean'] },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Farmer registered successfully with JWT token' },
          '400': { description: 'Validation error or phone already registered' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Log in with mobile number and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phone', 'password'],
                properties: {
                  phone: { type: 'string', example: '9876543210' },
                  password: { type: 'string', example: 'secret123' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Authentication successful with JWT token' },
          '401': { description: 'Invalid mobile number or password' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get currently authenticated user profile',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Authenticated user profile' },
          '401': { description: 'Missing or invalid authentication token' },
        },
      },
      put: {
        summary: 'Update user profile details',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  state: { type: 'string' },
                  district: { type: 'string' },
                  farmSizeAcres: { type: 'number' },
                  primaryCrops: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Profile updated' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
  },
};

docsRouter.get('/openapi.json', (_req: Request, res: Response) => {
  res.json(openApiSpec);
});

docsRouter.get('/docs', (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Krishi Setu API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #fafafa; font-family: sans-serif; }
    .topbar { background: #1b5e20; color: white; padding: 12px 24px; font-size: 18px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="topbar">🌱 Krishi Setu — API Interactive Documentation</div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/v1/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});
