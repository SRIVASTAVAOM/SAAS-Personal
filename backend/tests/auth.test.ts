import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db.config';

describe('Authentication API Tests', () => {
  afterAll(async () => {
    await pool.end();
  });

  describe('Password Security in Database', () => {
    it('should never store passwords in plain text', async () => {
      const { rows } = await pool.query(
        "SELECT password_hash FROM users WHERE identifier = 'student1' LIMIT 1"
      );
      expect(rows.length).toBe(1);
      const hash = rows[0].password_hash;
      expect(hash).not.toBe('Password@123');
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/); // Bcrypt hash signature
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials and return signed JWT', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'student1',
          password: 'Password@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.identifier).toBe('student1');
      expect(res.body.data.user.roles).toContain('STUDENT');
      expect(res.body.data.user.firstName).toBe('Aarav');
    });

    it('should login successfully using email as identifier', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'accountant1@apex.edu',
          password: 'Password@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.roles).toContain('ACCOUNTANT');
    });

    it('should reject with 401 for incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'student1',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid credentials');
    });

    it('should reject with 401 for non-existent identifier', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'ghost_user',
          password: 'Password@123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject with 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: '',
          password: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation Error');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return authenticated user profile when token is valid', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier: 'teacher1', password: 'Password@123' });

      const token = loginRes.body.data.token;

      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.identifier).toBe('teacher1');
      expect(meRes.body.data.roles).toContain('TEACHER');
    });

    it('should reject with 401 when token is missing', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject with 401 when token is invalid or tampered', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid_tampered_token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
