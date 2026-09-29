import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('CareerProfile (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // CRITICAL: Enable the global ValidationPipe so DTO decorators run during E2E tests
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Get real PrismaService to seed test data in PostgreSQL
    prisma = app.get<PrismaService>(PrismaService);

    // Seed a real User in PostgreSQL to satisfy the foreign key constraint
    const user = await prisma.user.create({
      data: {
        email: `e2e-tester-${Date.now()}@example.com`,
        name: 'E2E Test User',
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // CLEANUP: Delete the test user (Cascade will delete the associated career_profile)
    if (testUserId && prisma) {
      await prisma.user.delete({
        where: { id: testUserId },
      }).catch(() => null);
    }

    if (app) {
      await app.close();
    }
  });

  describe('Authorization Boundary (x-user-id header)', () => {
    it('rejects POST /career-profile when x-user-id header is missing with 401 Unauthorized', async () => {
      await request(app.getHttpServer())
        .post('/career-profile')
        .send({
          currentRole: 'Frontend Developer',
          yearsOfExperience: 3,
          targetRole: 'Full Stack Engineer',
        })
        .expect(401);
    });

    it('rejects GET /career-profile when x-user-id header is missing with 401 Unauthorized', async () => {
      await request(app.getHttpServer())
        .get('/career-profile')
        .expect(401);
    });

    it('rejects PUT /career-profile when x-user-id header is missing with 401 Unauthorized', async () => {
      await request(app.getHttpServer())
        .put('/career-profile')
        .send({ targetRole: 'Staff Engineer' })
        .expect(401);
    });

    it('rejects non-UUID x-user-id header with 401 Unauthorized', async () => {
      await request(app.getHttpServer())
        .get('/career-profile')
        .set('x-user-id', 'invalid-not-a-uuid')
        .expect(401);
    });
  });

  describe('POST /career-profile (Validation & Creation)', () => {
    it('rejects client attempting to inject userId in body with 400 Bad Request', async () => {
      const response = await request(app.getHttpServer())
        .post('/career-profile')
        .set('x-user-id', testUserId)
        .send({
          userId: testUserId, // INVALID: client must not pass userId in request body
          currentRole: 'Frontend Developer',
          yearsOfExperience: 3,
          targetRole: 'Full Stack Engineer',
        })
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('property userId should not exist'),
        ]),
      );
    });

    it('rejects invalid data with 400 Bad Request', async () => {
      // Send invalid data: negative years, empty targetRole
      const response = await request(app.getHttpServer())
        .post('/career-profile')
        .set('x-user-id', testUserId)
        .send({
          currentRole: 'Frontend Developer',
          yearsOfExperience: -10, // INVALID: must be >= 0
          targetRole: '', // INVALID: cannot be empty
        })
        .expect(400);

      // Verify that ValidationPipe provided meaningful error messages
      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('yearsOfExperience'),
          expect.stringContaining('targetRole'),
        ]),
      );
    });

    it('rejects unknown properties with 400 Bad Request (forbidNonWhitelisted)', async () => {
      const response = await request(app.getHttpServer())
        .post('/career-profile')
        .set('x-user-id', testUserId)
        .send({
          currentRole: 'Frontend Developer',
          yearsOfExperience: 3,
          targetRole: 'Full Stack Engineer',
          isAdmin: true, // INVALID: unknown property
        })
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('property isAdmin should not exist'),
        ]),
      );
    });

    it('successfully creates a career profile in PostgreSQL with 201 Created', async () => {
      const validPayload = {
        currentRole: 'Frontend Developer',
        yearsOfExperience: 3.4,
        targetRole: 'Full Stack Developer',
        summary: 'Frontend developer looking to transition into full stack development.',
      };

      const response = await request(app.getHttpServer())
        .post('/career-profile')
        .set('x-user-id', testUserId)
        .send(validPayload)
        .expect(201);

      // Verify returned data matches database record
      expect(response.body).toMatchObject({
        id: expect.any(String),
        userId: testUserId,
        currentRole: validPayload.currentRole,
        yearsOfExperience: validPayload.yearsOfExperience,
        targetRole: validPayload.targetRole,
        summary: validPayload.summary,
      });

      // Verify directly from PostgreSQL that the row exists
      const dbRecord = await prisma.careerProfile.findUnique({
        where: { userId: testUserId },
      });
      expect(dbRecord).not.toBeNull();
      expect(dbRecord?.targetRole).toBe(validPayload.targetRole);
    });

    it('rejects duplicate profile creation for same user with 409 Conflict', async () => {
      await request(app.getHttpServer())
        .post('/career-profile')
        .set('x-user-id', testUserId)
        .send({
          currentRole: 'Frontend Developer',
          yearsOfExperience: 3,
          targetRole: 'Full Stack Developer',
        })
        .expect(409);
    });
  });

  describe('GET /career-profile (Retrieval)', () => {
    it('retrieves the caller profile with user information from PostgreSQL', async () => {
      const response = await request(app.getHttpServer())
        .get('/career-profile')
        .set('x-user-id', testUserId)
        .expect(200);

      expect(response.body).toMatchObject({
        userId: testUserId,
        currentRole: 'Frontend Developer',
        targetRole: 'Full Stack Developer',
        user: {
          id: testUserId,
          email: expect.stringContaining('@example.com'),
          name: 'E2E Test User',
        },
      });
    });

    it('returns 404 Not Found when profile does not exist', async () => {
      const nonExistentUserId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .get('/career-profile')
        .set('x-user-id', nonExistentUserId)
        .expect(404);
    });
  });

  describe('PUT /career-profile (Update)', () => {
    it('updates caller profile in PostgreSQL with 200 OK', async () => {
      const updatePayload = {
        targetRole: 'Staff Full Stack Engineer',
        yearsOfExperience: 5,
      };

      const response = await request(app.getHttpServer())
        .put('/career-profile')
        .set('x-user-id', testUserId)
        .send(updatePayload)
        .expect(200);

      expect(response.body.targetRole).toBe(updatePayload.targetRole);
      expect(response.body.yearsOfExperience).toBe(updatePayload.yearsOfExperience);

      // Verify the change persisted in PostgreSQL
      const updatedDbRecord = await prisma.careerProfile.findUnique({
        where: { userId: testUserId },
      });
      expect(updatedDbRecord?.targetRole).toBe(updatePayload.targetRole);
    });
  });
});
