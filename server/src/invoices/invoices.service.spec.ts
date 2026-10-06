import { DataSource, Repository } from 'typeorm';
import { AppException } from '../common/exceptions/app.exception';
import { DuplicateDetectorService } from './duplicate-detector';
import { InvoiceStatusHistory } from './invoice-status-history.entity';
import { InvoiceStatus } from './invoice-status.enum';
import { Invoice } from './invoice.entity';
import { InvoicesService } from './invoices.service';

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 'invoice-1',
    invoiceNumber: 'INV-1',
    vendorName: 'Acme Co.',
    amountCents: 10000,
    currency: 'USD',
    issueDate: '2026-01-01',
    dueDate: '2026-01-31',
    description: 'Test invoice',
    status: InvoiceStatus.PROCESSING,
    duplicateOf: null,
    duplicateOfId: null,
    reviewNote: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

interface MockInvoiceRepo {
  findOne: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
}

interface MockHistoryRepo {
  find: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
}

describe('InvoicesService.updateStatus', () => {
  let invoiceRecord: Invoice;
  let historyRecords: InvoiceStatusHistory[];
  let invoicesRepository: MockInvoiceRepo;
  let historyRepository: MockHistoryRepo;
  let dataSource: { transaction: jest.Mock };
  let service: InvoicesService;

  beforeEach(() => {
    invoiceRecord = makeInvoice();
    historyRecords = [];

    invoicesRepository = {
      findOne: jest.fn(async () => invoiceRecord),
      save: jest.fn(async (entity: Invoice) => {
        Object.assign(invoiceRecord, entity);
        return invoiceRecord;
      }),
      create: jest.fn((entity) => entity as Invoice),
    };

    historyRepository = {
      find: jest.fn(async () => historyRecords),
      save: jest.fn(async (entity: InvoiceStatusHistory) => {
        historyRecords.push(entity);
        return entity;
      }),
      create: jest.fn(
        (entity) =>
          ({
            id: `history-${historyRecords.length + 1}`,
            changedAt: new Date(),
            ...entity,
          }) as InvoiceStatusHistory,
      ),
    };

    dataSource = {
      transaction: jest.fn(async (cb: (manager: unknown) => Promise<unknown>) => {
        const manager = {
          getRepository: (entity: unknown) =>
            entity === Invoice ? invoicesRepository : historyRepository,
        };
        return cb(manager);
      }),
    };

    service = new InvoicesService(
      invoicesRepository as unknown as Repository<Invoice>,
      historyRepository as unknown as Repository<InvoiceStatusHistory>,
      dataSource as unknown as DataSource,
      new DuplicateDetectorService(),
    );
  });

  it('approves a processing invoice and records history', async () => {
    const result = await service.updateStatus('invoice-1', { status: InvoiceStatus.APPROVED });

    expect(result.status).toBe(InvoiceStatus.APPROVED);
    expect(invoicesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: InvoiceStatus.APPROVED }),
    );
    expect(historyRecords).toHaveLength(1);
    expect(historyRecords[0]).toMatchObject({
      fromStatus: InvoiceStatus.PROCESSING,
      toStatus: InvoiceStatus.APPROVED,
      note: null,
    });
  });

  it('rejects without a note with a 400 and does not mutate the invoice', async () => {
    await expect(
      service.updateStatus('invoice-1', { status: InvoiceStatus.REJECTED }),
    ).rejects.toThrow(AppException);
    expect(invoicesRepository.save).not.toHaveBeenCalled();
    expect(historyRecords).toHaveLength(0);
    expect(invoiceRecord.status).toBe(InvoiceStatus.PROCESSING);
  });

  it('rejects with a note successfully, storing the note on the invoice', async () => {
    const result = await service.updateStatus('invoice-1', {
      status: InvoiceStatus.REJECTED,
      note: 'Missing PO number',
    });

    expect(result.status).toBe(InvoiceStatus.REJECTED);
    expect(result.reviewNote).toBe('Missing PO number');
    expect(historyRecords[0]).toMatchObject({ note: 'Missing PO number' });
  });

  it('rejects a transition out of a final status with 409', async () => {
    invoiceRecord.status = InvoiceStatus.APPROVED;

    try {
      await service.updateStatus('invoice-1', { status: InvoiceStatus.REJECTED, note: 'too late' });
      fail('expected AppException');
    } catch (error) {
      expect(error).toBeInstanceOf(AppException);
      expect((error as AppException).getStatus()).toBe(409);
    }
    expect(invoicesRepository.save).not.toHaveBeenCalled();
  });

  it('throws a 404 when the invoice does not exist', async () => {
    invoicesRepository.findOne.mockResolvedValueOnce(null);

    try {
      await service.updateStatus('missing-id', { status: InvoiceStatus.APPROVED });
      fail('expected AppException');
    } catch (error) {
      expect(error).toBeInstanceOf(AppException);
      expect((error as AppException).getStatus()).toBe(404);
    }
  });
});
