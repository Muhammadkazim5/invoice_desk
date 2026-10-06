import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Carries a stable machine-readable `code` alongside the HTTP status so the
 * global exception filter can emit a consistent { error: { code, message, statusCode } } body.
 */
export class AppException extends HttpException {
  constructor(code: string, message: string, statusCode: HttpStatus) {
    super({ code, message, statusCode }, statusCode);
  }
}
