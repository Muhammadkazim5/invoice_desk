import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InvoiceStatus } from './invoice-status.enum';

@Entity({ name: 'invoices' })
@Index('idx_invoices_vendor_lower_invoice_number', {
  synchronize: false,
})
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'invoice_number', type: 'varchar' })
  invoiceNumber!: string;

  @Column({ name: 'vendor_name', type: 'varchar' })
  vendorName!: string;

  @Column({ name: 'amount_cents', type: 'integer' })
  amountCents!: number;

  @Column({ name: 'currency', type: 'char', length: 3, default: 'USD' })
  currency!: string;

  @Column({ name: 'issue_date', type: 'date' })
  issueDate!: string;

  @Column({ name: 'due_date', type: 'date' })
  dueDate!: string;

  @Column({ name: 'description', type: 'text' })
  description!: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: InvoiceStatus,
    enumName: 'invoice_status_enum',
    default: InvoiceStatus.PROCESSING,
  })
  status!: InvoiceStatus;

  @ManyToOne(() => Invoice, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'duplicate_of_id' })
  duplicateOf!: Invoice | null;

  @Column({ name: 'duplicate_of_id', type: 'uuid', nullable: true })
  duplicateOfId!: string | null;

  @Column({ name: 'review_note', type: 'text', nullable: true })
  reviewNote!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
