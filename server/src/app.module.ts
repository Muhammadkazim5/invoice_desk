import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { loadEnv } from './config/load-env';
import { DatabaseModule } from './database/database.module';
import { InvoicesModule } from './invoices/invoices.module';
import { HealthModule } from './health/health.module';

loadEnv();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
    }),
    DatabaseModule,
    InvoicesModule,
    HealthModule,
  ],
})
export class AppModule {}
