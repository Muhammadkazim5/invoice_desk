import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TypeOrmHealthIndicator } from '@nestjs/terminus';

interface HealthResponse {
  ok: boolean;
  db: 'up' | 'down';
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly db: TypeOrmHealthIndicator) {}

  @Get()
  @ApiOperation({ summary: 'Liveness check including database connectivity' })
  @ApiOkResponse({ schema: { example: { ok: true, db: 'up' } } })
  async check(): Promise<HealthResponse> {
    try {
      await this.db.pingCheck('database');
      return { ok: true, db: 'up' };
    } catch {
      return { ok: false, db: 'down' };
    }
  }
}
