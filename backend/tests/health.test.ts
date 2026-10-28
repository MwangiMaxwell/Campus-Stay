import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from './helpers';

describe('GET /api/v1/health', () => {
  it('returns ok when the database is connected', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.database).toBe('connected');
    expect(response.body.data.service).toBe('campusstay-api');
  });
});
