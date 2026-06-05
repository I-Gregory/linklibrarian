const request = require('supertest');
const { app } = require('../app');

describe('GET /api/session', () => {
  it('should return 401 and loggedIn false when no session exists', async () => {
    const response = await request(app).get('/api/session');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ loggedIn: false });
  });
});