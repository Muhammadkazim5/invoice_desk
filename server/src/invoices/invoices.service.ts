import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AppException } from '../common/exceptions/app.exception';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceListStatusFilter } from './dto/list-invoices-query.dto';
import {
  DuplicateOfSummaryDto,
  InvoiceCountsDto,
  InvoiceDetailDto,
  InvoiceSummaryDto,
} from './dto/invoice-response.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { DuplicateDetectorService } from './duplicate-detector';
import { InvoiceStatusHistory } from './invoice-status-history.entity';
import { InvoiceStatus } from './invoice-status.enum';
import { Invoice } from './invoice.entity';
import { assertValidStatusTransition } from './status-transitions';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice) private readonly invoicesRepository: Repository<Invoice>,
    @InjectRepository(InvoiceStatusHistory)
    private readonly historyRepository: Repository<InvoiceStatusHistory>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly duplicateDetector: DuplicateDetectorService,
  ) {}

  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    return this.dataSource.transaction(async (manager) => {
      const invoiceRepo = manager.getRepository(Invoice);
      const historyRepo = manager.getRepository(InvoiceStatusHistory);

      const duplicate = await this.duplicateDetector.findExistingDuplicate(
        invoiceRepo,
        dto.vendorName,
        dto.invoiceNumber,
      );

      const status = duplicate ? InvoiceStatus.NEEDS_REVIEW : InvoiceStatus.PROCESSING;

      const invoice = invoiceRepo.create({
        invoiceNumber: dto.invoiceNumber,
        vendorName: dto.vendorName,
        amountCents: dto.amountCents,
        currency: dto.currency,
        issueDate: dto.issueDate,
        dueDate: dto.dueDate,
        description: dto.description,
        status,
        duplicateOfId: duplicate?.id ?? null,
        reviewNote: duplicate
          ? `Possible duplicate of invoice ${duplicate.invoiceNumber} from ${duplicate.vendorName}.`
          : null,
      });
      const saved = await invoiceRepo.save(invoice);

      await historyRepo.save(
        historyRepo.create({
          invoiceId: saved.id,
          fromStatus: null,
          toStatus: status,
          note: duplicate ? 'Flagged automatically by duplicate detection.' : null,
        }),
      );

      return saved;
    });
  }

  async findAll(status?: InvoiceListStatusFilter): Promise<InvoiceSummaryDto[]> {
    const query = this.invoicesRepository
      .createQueryBuilder('invoice')
      .orderBy('invoice.createdAt', 'DESC');

    if (status === InvoiceListStatusFilter.DECIDED) {
      query.where('invoice.status IN (:...statuses)', {
        statuses: [InvoiceStatus.APPROVED, InvoiceStatus.REJECTED],
      });
    } else if (status) {
      query.where('invoice.status = :status', { status });
    }

    const invoices = await query.getMany();
    return invoices.map((invoice) => this.toSummary(invoice));
  }

  async getCounts(): Promise<InvoiceCountsDto> {
    const rows = await this.invoicesRepository
      .createQueryBuilder('invoice')
      .select('invoice.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('invoice.status')
      .getRawMany<{ status: InvoiceStatus; count: string }>();

    const counts: InvoiceCountsDto = { processing: 0, needs_review: 0, decided: 0 };
    for (const row of rows) {
      const count = Number(row.count);
      if (row.status === InvoiceStatus.PROCESSING) counts.processing = count;
      else if (row.status === InvoiceStatus.NEEDS_REVIEW) counts.needs_review = count;
      else if (row.status === InvoiceStatus.APPROVED || row.status === InvoiceStatus.REJECTED) {
        counts.decided += count;
      }
    }
    return counts;
  }

  async findOneDetail(id: string): Promise<InvoiceDetailDto> {
    const invoice = await this.invoicesRepository.findOne({
      where: { id },
      relations: { duplicateOf: true },
    });
    if (!invoice) {
      throw new AppException('NOT_FOUND', `Invoice ${id} was not found`, HttpStatus.NOT_FOUND);
    }

    const history = await this.historyRepository.find({
      where: { invoiceId: id },
      order: { changedAt: 'ASC' },
    });

    return this.toDetail(invoice, history);
  }

  async updateStatus(id: string, dto: UpdateStatusDto): Promise<InvoiceDetailDto> {
    await this.dataSource.transaction(async (manager) => {
      const invoiceRepo = manager.getRepository(Invoice);
      const historyRepo = manager.getRepository(InvoiceStatusHistory);

      const invoice = await invoiceRepo.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!invoice) {
        throw new AppException('NOT_FOUND', `Invoice ${id} was not found`, HttpStatus.NOT_FOUND);
      }

      assertValidStatusTransition(invoice.status, dto.status, dto.note);

      const fromStatus = invoice.status;
      invoice.status = dto.status;
      if (dto.note !== undefined) {
        invoice.reviewNote = dto.note;
      }
      await invoiceRepo.save(invoice);

      await historyRepo.save(
        historyRepo.create({
          invoiceId: invoice.id,
          fromStatus,
          toStatus: dto.status,
          note: dto.note ?? null,
        }),
      );
    });

    return this.findOneDetail(id);
  }

  private toSummary(invoice: Invoice): InvoiceSummaryDto {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      vendorName: invoice.vendorName,
      amountCents: invoice.amountCents,
      currency: invoice.currency,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      duplicateOfId: invoice.duplicateOfId,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }

  private toDetail(invoice: Invoice, history: InvoiceStatusHistory[]): InvoiceDetailDto {
    const duplicateOf: DuplicateOfSummaryDto | null = invoice.duplicateOf
      ? {
          id: invoice.duplicateOf.id,
          invoiceNumber: invoice.duplicateOf.invoiceNumber,
          vendorName: invoice.duplicateOf.vendorName,
        }
      : null;

    return {
      ...this.toSummary(invoice),
      description: invoice.description,
      reviewNote: invoice.reviewNote,
      duplicateOf,
      statusHistory: history.map((entry) => ({
        id: entry.id,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        note: entry.note,
        changedAt: entry.changedAt,
      })),
    };
  }
}
