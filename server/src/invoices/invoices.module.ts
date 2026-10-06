import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DuplicateDetectorService } from './duplicate-detector';
import { InvoiceStatusHistory } from './invoice-status-history.entity';
import { Invoice } from './invoice.entity';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceStatusHistory])],
  controllers: [InvoicesController],
  providers: [InvoicesService, DuplicateDetectorService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
