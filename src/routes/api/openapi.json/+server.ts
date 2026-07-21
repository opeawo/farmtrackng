// GET /api/openapi.json — machine-readable spec for the public pricing API.
// Served outside the /api/v1 auth prefix so tooling can fetch it without a key.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { LISTING_CATEGORIES } from '$lib/server/markets/types';

const priceObject = {
	type: 'object',
	properties: {
		product: { type: 'string', example: 'Broiler (live)' },
		category: { type: 'string', enum: LISTING_CATEGORIES },
		state: { type: 'string', example: 'Kano' },
		unit: { type: 'string', enum: ['per head', 'per kg', 'per dose'] },
		priceNgn: { type: 'integer', description: 'Modeled representative price (₦), outlier-trimmed median.' },
		lowNgn: { type: 'integer' },
		highNgn: { type: 'integer' },
		confidence: { type: 'integer', description: '0–100 confidence from sample size and price spread.' },
		sampleSize: { type: 'integer', description: 'Agent entries informing this point.' }
	}
};

const spec = {
	openapi: '3.0.3',
	info: {
		title: 'FarmPaddy Pricing API',
		version: '1.0.0',
		description:
			"FarmPaddy's modeled Nigerian livestock price index — per-state, per-product figures aggregated from field-agent submissions. Cattle and goats are priced per head, vaccines per dose, everything else per kg."
	},
	servers: [{ url: 'https://www.farmpaddy.com' }],
	security: [{ ApiKeyHeader: [] }, { BearerToken: [] }],
	components: {
		securitySchemes: {
			ApiKeyHeader: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
			BearerToken: { type: 'http', scheme: 'bearer' }
		},
		schemas: {
			Price: priceObject,
			DailyPrice: {
				allOf: [
					priceObject,
					{ type: 'object', properties: { date: { type: 'string', format: 'date', example: '2026-06-14' } } }
				]
			}
		}
	},
	paths: {
		'/api/v1/prices': {
			get: {
				summary: 'Current price index',
				parameters: [
					{ name: 'state', in: 'query', schema: { type: 'string' }, description: 'Filter by Nigerian state (exact, case-insensitive).' },
					{ name: 'product', in: 'query', schema: { type: 'string' }, description: 'Filter by product name (case-insensitive substring).' },
					{ name: 'category', in: 'query', schema: { type: 'string', enum: LISTING_CATEGORIES } }
				],
				responses: {
					'200': {
						description: 'Current modeled prices.',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										fetchedAt: { type: 'string', format: 'date-time' },
										count: { type: 'integer' },
										degraded: { type: 'boolean' },
										stale: { type: 'boolean' },
										prices: { type: 'array', items: { $ref: '#/components/schemas/Price' } }
									}
								}
							}
						}
					},
					'400': { description: 'Invalid query parameter.' },
					'401': { description: 'Missing or invalid API key.' },
					'429': { description: 'Rate limit exceeded.' }
				}
			}
		},
		'/api/v1/prices/history': {
			get: {
				summary: 'Daily price history',
				parameters: [
					{ name: 'state', in: 'query', schema: { type: 'string' } },
					{ name: 'product', in: 'query', schema: { type: 'string' } },
					{ name: 'category', in: 'query', schema: { type: 'string', enum: LISTING_CATEGORIES } },
					{ name: 'from', in: 'query', schema: { type: 'string', format: 'date' }, description: 'YYYY-MM-DD. Defaults to 90 days before `to`.' },
					{ name: 'to', in: 'query', schema: { type: 'string', format: 'date' }, description: 'YYYY-MM-DD. Defaults to today (WAT).' }
				],
				responses: {
					'200': {
						description: 'Daily modeled prices in the requested window.',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										from: { type: 'string', format: 'date' },
										to: { type: 'string', format: 'date' },
										count: { type: 'integer' },
										degraded: { type: 'boolean' },
										stale: { type: 'boolean' },
										prices: { type: 'array', items: { $ref: '#/components/schemas/DailyPrice' } }
									}
								}
							}
						}
					},
					'400': { description: 'Invalid query parameter.' },
					'401': { description: 'Missing or invalid API key.' },
					'429': { description: 'Rate limit exceeded.' }
				}
			}
		},
		'/api/v1/meta': {
			get: {
				summary: 'Query vocabulary',
				responses: {
					'200': {
						description: 'States, products, categories and units currently in the index.',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										fetchedAt: { type: 'string', format: 'date-time' },
										states: { type: 'array', items: { type: 'string' } },
										products: { type: 'array', items: { type: 'string' } },
										categories: { type: 'array', items: { type: 'string' } },
										units: { type: 'object', additionalProperties: { type: 'string' } }
									}
								}
							}
						}
					}
				}
			}
		}
	}
};

export const GET: RequestHandler = async ({ setHeaders }) => {
	setHeaders({ 'cache-control': 'public, max-age=3600' });
	return json(spec);
};
