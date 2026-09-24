import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('returns an ok status with a timestamp', () => {
    const controller = new HealthController();

    expect(controller.getHealth()).toEqual({
      status: 'ok',
      timestamp: expect.any(String),
    });
  });
});
