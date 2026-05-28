const request = require('supertest');
const { app } = require('../app');

describe('POST /api/register', () => {
  it('should return 400 when email and password are missing', async () => {
    const response = await request(app)
      .post('/api/register')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Email and password are required.'
    });
  });

  it('should return 400 when password is missing', async () => {
    const response = await request(app)
      .post('/api/register')
      .send({ email: 'test@example.com' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Email and password are required.'
    });
  });
});