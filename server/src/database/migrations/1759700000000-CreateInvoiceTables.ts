import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvoiceTables1759700000000 implements MigrationInterface {
  name = 'CreateInvoiceTables1759700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TYPE "invoice_status_enum" AS ENUM ('processing', 'needs_review', 'approved', 'rejected')
    `);

    await queryRunner.query(`
      CREATE TABLE "invoices" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "invoice_number" varchar NOT NULL,
        "vendor_name" varchar NOT NULL,
        "amount_cents" integer NOT NULL,
        "currency" char(3) NOT NULL DEFAULT 'USD',
        "issue_date" date NOT NULL,
        "due_date" date NOT NULL,
        "description" text NOT NULL,
        "status" "invoice_status_enum" NOT NULL DEFAULT 'processing',
        "duplicate_of_id" uuid,
        "review_note" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_invoices" PRIMARY KEY ("id"),
        CONSTRAINT "fk_invoices_duplicate_of" FOREIGN KEY ("duplicate_of_id")
          REFERENCES "invoices" ("id") ON DELETE SET NULL
      )
    `);

    // Functional index to make duplicate lookups (case/whitespace-insensitive vendor + invoice number) fast.
    // Deliberately NOT unique: duplicates must be storable so they can be reviewed, not rejected at the DB layer.
    await queryRunner.query(`
      CREATE INDEX "idx_invoices_vendor_lower_invoice_number"
      ON "invoices" (lower("vendor_name"), "invoice_number")
    `);

    await queryRunner.query(`
      CREATE TABLE "invoice_status_history" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "invoice_id" uuid NOT NULL,
        "from_status" "invoice_status_enum",
        "to_status" "invoice_status_enum" NOT NULL,
        "note" text,
        "changed_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_invoice_status_history" PRIMARY KEY ("id"),
        CONSTRAINT "fk_invoice_status_history_invoice" FOREIGN KEY ("invoice_id")
          REFERENCES "invoices" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_invoice_status_history_invoice_id" ON "invoice_status_history" ("invoice_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "invoice_status_history"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_invoices_vendor_lower_invoice_number"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "invoice_status_enum"`);
  }
}
