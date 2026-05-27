const request = require('supertest');
const { app } = require('../app');

describe('GET /health', () => {
  it('should return 200 and ok', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.text).toBe('ok');
  });
});