import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorBody {
  code: string;
  message: string;
  statusCode: number;
}

const STATUS_CODE_MAP: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, code, message } = this.resolve(exception);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${statusCode} ${code}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: { error: ErrorBody } = {
      error: { code, message, statusCode },
    };
    response.status(statusCode).json(body);
  }

  private resolve(exception: unknown): ErrorBody {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'object' && payload !== null) {
        const payloadObj = payload as Record<string, unknown>;
        const code =
          typeof payloadObj.code === 'string'
            ? payloadObj.code
            : (STATUS_CODE_MAP[statusCode] ?? 'ERROR');
        const rawMessage = payloadObj.message;
        const message = Array.isArray(rawMessage)
          ? rawMessage.join('; ')
          : typeof rawMessage === 'string'
            ? rawMessage
            : exception.message;
        return { statusCode, code, message };
      }

      return {
        statusCode,
        code: STATUS_CODE_MAP[statusCode] ?? 'ERROR',
        message: exception.message,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    };
  }
}
