import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { Invoice } from '../src/invoices/invoice.entity';
import { InvoiceStatus } from '../src/invoices/invoice-status.enum';

describe('Invoices (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let invoiceRepo: Repository<Invoice>;

  let processingA: Invoice;
  let processingB: Invoice;
  let finalApproved: Invoice;
  let toApprove: Invoice;
  let toRejectWithoutNote: Invoice;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    dataSource = moduleRef.get(DataSource);
    invoiceRepo = dataSource.getRepository(Invoice);

    await dataSource.query(
      'TRUNCATE TABLE "invoice_status_history", "invoices" RESTART IDENTITY CASCADE',
    );

    const base = {
      currency: 'USD',
      issueDate: '2026-01-01',
      dueDate: '2026-01-31',
      description: 'e2e fixture',
    };

    processingA = await invoiceRepo.save(
      invoiceRepo.create({
        ...base,
        invoiceNumber: 'E2E-PROC-A',
        vendorName: 'E2E Lumber Co.',
        amountCents: 100000,
        status: InvoiceStatus.PROCESSING,
      }),
    );
    processingB = await invoiceRepo.save(
      invoiceRepo.create({
        ...base,
        invoiceNumber: 'E2E-PROC-B',
        vendorName: 'E2E Electrical Co.',
        amountCents: 200000,
        status: InvoiceStatus.PROCESSING,
      }),
    );
    finalApproved = await invoiceRepo.save(
      invoiceRepo.create({
        ...base,
        invoiceNumber: 'E2E-APPROVED',
        vendorName: 'E2E Plumbing Co.',
        amountCents: 300000,
        status: InvoiceStatus.APPROVED,
      }),
    );
    toApprove = await invoiceRepo.save(
      invoiceRepo.create({
        ...base,
        invoiceNumber: 'E2E-TO-APPROVE',
        vendorName: 'E2E Rental Co.',
        amountCents: 400000,
        status: InvoiceStatus.PROCESSING,
      }),
    );
    toRejectWithoutNote = await invoiceRepo.save(
      invoiceRepo.create({
        ...base,
        invoiceNumber: 'E2E-TO-REJECT',
        vendorName: 'E2E Concrete Co.',
        amountCents: 500000,
        status: InvoiceStatus.PROCESSING,
      }),
    );
  });

  afterAll(async () => {
    await dataSource.query(
      'TRUNCATE TABLE "invoice_status_history", "invoices" RESTART IDENTITY CASCADE',
    );
    await app.close();
  });

  describe('GET /api/invoices', () => {
    it('filters by status=processing', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/invoices?status=processing')
        .expect(200);
      const ids = (res.body as Array<{ id: string }>).map((i) => i.id);
      expect(ids).toEqual(
        expect.arrayContaining([
          processingA.id,
          processingB.id,
          toApprove.id,
          toRejectWithoutNote.id,
        ]),
      );
      expect(ids).not.toContain(finalApproved.id);
    });

    it('rejects an invalid status value', async () => {
      await request(app.getHttpServer()).get('/api/invoices?status=bogus').expect(400);
    });
  });

  describe('GET /api/invoices/counts', () => {
    it('returns counts grouped per tab', async () => {
      const res = await request(app.getHttpServer()).get('/api/invoices/counts').expect(200);
      expect(res.body).toMatchObject({
        processing: 4,
        needs_review: 0,
        decided: 1,
      });
    });
  });

  describe('GET /api/invoices/:id', () => {
    it('returns the invoice detail', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/invoices/${processingA.id}`)
        .expect(200);
      expect(res.body).toMatchObject({
        id: processingA.id,
        invoiceNumber: 'E2E-PROC-A',
        statusHistory: [],
        duplicateOf: null,
      });
    });

    it('returns 404 for a well-formed but unknown uuid', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/invoices/00000000-0000-0000-0000-000000000000')
        .expect(404);
      expect(res.body).toMatchObject({ error: { code: 'NOT_FOUND', statusCode: 404 } });
    });

    it('returns 400 for a malformed uuid', async () => {
      const res = await request(app.getHttpServer()).get('/api/invoices/not-a-uuid').expect(400);
      expect(res.body).toMatchObject({ error: { code: 'BAD_REQUEST', statusCode: 400 } });
    });
  });

  describe('PATCH /api/invoices/:id/status', () => {
    it('approves a processing invoice', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/invoices/${toApprove.id}/status`)
        .send({ status: 'approved' })
        .expect(200);
      expect(res.body).toMatchObject({ id: toApprove.id, status: 'approved' });
      expect(res.body.statusHistory).toHaveLength(1);
    });

    it('rejects without a note with 400 NOTE_REQUIRED', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/invoices/${toRejectWithoutNote.id}/status`)
        .send({ status: 'rejected' })
        .expect(400);
      expect(res.body).toMatchObject({ error: { code: 'NOTE_REQUIRED', statusCode: 400 } });
    });

    it('returns 409 when changing an already-final status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/invoices/${finalApproved.id}/status`)
        .send({ status: 'rejected', note: 'too late' })
        .expect(409);
      expect(res.body).toMatchObject({ error: { code: 'INVALID_TRANSITION', statusCode: 409 } });
    });
  });
});
