import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { loadEnv } from '../config/load-env';
import { Invoice } from '../invoices/invoice.entity';
import { InvoiceStatusHistory } from '../invoices/invoice-status-history.entity';

loadEnv();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'invoice_desk',
  entities: [Invoice, InvoiceStatusHistory],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
