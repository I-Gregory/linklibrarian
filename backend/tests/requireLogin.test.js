const { requireLogin } = require('../app');

describe('requireLogin middleware', () => {
  it('should return 401 when no user is in the session', () => {
    const req = {
      session: {}
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    requireLogin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not logged in.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next when a user is in the session', () => {
    const req = {
      session: {
        user: {
          id: 1,
          email: 'test@example.com'
        }
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    requireLogin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});