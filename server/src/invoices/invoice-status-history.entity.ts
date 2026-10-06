import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { InvoiceStatus } from './invoice-status.enum';

@Entity({ name: 'invoice_status_history' })
export class InvoiceStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Invoice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice!: Invoice;

  @Column({ name: 'invoice_id', type: 'uuid' })
  invoiceId!: string;

  @Column({
    name: 'from_status',
    type: 'enum',
    enum: InvoiceStatus,
    enumName: 'invoice_status_enum',
    nullable: true,
  })
  fromStatus!: InvoiceStatus | null;

  @Column({
    name: 'to_status',
    type: 'enum',
    enum: InvoiceStatus,
    enumName: 'invoice_status_enum',
  })
  toStatus!: InvoiceStatus;

  @Column({ name: 'note', type: 'text', nullable: true })
  note!: string | null;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamptz' })
  changedAt!: Date;
}
