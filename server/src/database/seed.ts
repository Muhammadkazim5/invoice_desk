import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { CreateInvoiceDto } from '../invoices/dto/create-invoice.dto';
import { InvoiceStatus } from '../invoices/invoice-status.enum';
import { InvoicesService } from '../invoices/invoices.service';

/**
 * Five realistic construction-vendor invoices (lumber, electrical, plumbing,
 * equipment rental, ready-mix concrete) plus one deliberate re-submission of
 * the electrical invoice — same vendor, invoice number, and amount — so the
 * 6th insert is caught by duplicate detection rather than hard-coded as
 * `needs_review`. That gives every tab content: 2 processing, 1 needs_review
 * (the duplicate), 1 approved, 1 rejected.
 */
const SEED_INVOICES: CreateInvoiceDto[] = [
  {
    invoiceNumber: 'INV-10234',
    vendorName: 'Cascade Lumber & Supply Co.',
    amountCents: 1_248_000,
    currency: 'USD',
    issueDate: '2026-09-02',
    dueDate: '2026-10-02',
    description: 'Framing lumber and plywood for the Maple Street townhomes, phase 2.',
  },
  {
    invoiceNumber: 'INV-20561',
    vendorName: 'Riverbend Electrical Contracting',
    amountCents: 825_075,
    currency: 'USD',
    issueDate: '2026-09-05',
    dueDate: '2026-10-05',
    description: 'Rough-in electrical for units 4-6, Maple Street townhomes.',
  },
  {
    invoiceNumber: 'INV-30789',
    vendorName: 'Summit Plumbing & Mechanical',
    amountCents: 412_000,
    currency: 'USD',
    issueDate: '2026-08-20',
    dueDate: '2026-09-19',
    description: 'Rough-in plumbing and fixture sets for units 1-3.',
  },
  {
    invoiceNumber: 'INV-40112',
    vendorName: 'Titan Equipment Rental',
    amountCents: 1_560_000,
    currency: 'USD',
    issueDate: '2026-09-10',
    dueDate: '2026-10-10',
    description: 'Excavator and skid-steer rental, 3 weeks, site grading.',
  },
  {
    invoiceNumber: 'INV-50933',
    vendorName: 'Bedrock Ready-Mix Concrete',
    amountCents: 2_234_050,
    currency: 'USD',
    issueDate: '2026-09-15',
    dueDate: '2026-10-15',
    description: 'Foundation pour, 42 cubic yards 4000psi mix, Maple Street townhomes.',
  },
  // Duplicate: identical vendor, invoice number, and amount as the second entry above.
  {
    invoiceNumber: 'INV-20561',
    vendorName: 'Riverbend Electrical Contracting',
    amountCents: 825_075,
    currency: 'USD',
    issueDate: '2026-09-05',
    dueDate: '2026-10-05',
    description: 'Rough-in electrical for units 4-6, Maple Street townhomes.',
  },
];

async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });

  try {
    const dataSource = app.get(DataSource);
    const invoicesService = app.get(InvoicesService);

    await dataSource.query(
      'TRUNCATE TABLE "invoice_status_history", "invoices" RESTART IDENTITY CASCADE',
    );

    const created = [];
    for (const dto of SEED_INVOICES) {
      created.push(await invoicesService.create(dto));
    }

    const [lumber, , plumbing, equipmentRental] = created;

    await invoicesService.updateStatus(plumbing.id, {
      status: InvoiceStatus.APPROVED,
      note: 'Matches signed PO #4471; approved for payment.',
    });

    await invoicesService.updateStatus(equipmentRental.id, {
      status: InvoiceStatus.REJECTED,
      note: 'Rental dates on the invoice do not match the signed job schedule; vendor must resubmit.',
    });

    void lumber; // kept in `created` for readability; left as "processing"

    // eslint-disable-next-line no-console
    console.log(`Seeded ${created.length} invoices.`);
  } finally {
    await app.close();
  }
}

seed().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Seeding failed:', error);
  process.exit(1);
});
