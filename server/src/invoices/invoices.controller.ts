import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { InvoiceCountsDto, InvoiceDetailDto, InvoiceSummaryDto } from './dto/invoice-response.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { InvoicesService } from './invoices.service';

@ApiTags('invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'List invoices, optionally filtered by status' })
  @ApiOkResponse({ type: [InvoiceSummaryDto] })
  findAll(@Query() query: ListInvoicesQueryDto): Promise<InvoiceSummaryDto[]> {
    return this.invoicesService.findAll(query.status);
  }

  @Get('counts')
  @ApiOperation({ summary: 'Get invoice counts per tab (processing, needs_review, decided)' })
  @ApiOkResponse({ type: InvoiceCountsDto })
  getCounts(): Promise<InvoiceCountsDto> {
    return this.invoicesService.getCounts();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single invoice with duplicate info and status history' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: InvoiceDetailDto })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<InvoiceDetailDto> {
    return this.invoicesService.findOneDetail(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Approve, reject, or flag an invoice for review' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: InvoiceDetailDto })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
  ): Promise<InvoiceDetailDto> {
    return this.invoicesService.updateStatus(id, dto);
  }
}
