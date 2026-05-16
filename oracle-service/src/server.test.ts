import request from 'supertest';
import app from './server';
import { OracleService } from './oracle';

jest.mock('./oracle', () => {
  return {
    OracleService: jest.fn().mockImplementation(() => ({
      submitPlayerData: jest.fn().mockImplementation((m, p, s) => {
        if (m === 999) throw new Error('Contract Error');
        return Promise.resolve('0xabc');
      }),
      finalizeMatch: jest.fn().mockResolvedValue('0xdef'),
    })),
  };
});

describe('Oracle API', () => {
  it('GET /health should return 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  describe('POST /api/trigger-update', () => {
    it('should return 200 on success', async () => {
      const res = await request(app)
        .post('/api/trigger-update')
        .send({ matchId: 1, playerId: 101, pointsScored: 25 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.txHash).toBe('0xabc');
    });

    it('should return 400 if parameters are missing', async () => {
      const res = await request(app)
        .post('/api/trigger-update')
        .send({ matchId: 1 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 500 on contract error', async () => {
      const res = await request(app)
        .post('/api/trigger-update')
        .send({ matchId: 999, playerId: 101, pointsScored: 25 });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Contract Error');
    });
  });

  describe('POST /api/trigger-finalize', () => {
    it('should return 200 on success', async () => {
      const res = await request(app)
        .post('/api/trigger-finalize')
        .send({ matchId: 1, playerId: 101 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.txHash).toBe('0xdef');
    });

    it('should return 400 if parameters are missing', async () => {
      const res = await request(app)
        .post('/api/trigger-finalize')
        .send({ matchId: 1 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
