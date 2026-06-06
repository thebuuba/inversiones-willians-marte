import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : getHttpExceptionMessage(res, message);
    } else if (exception instanceof Error && process.env.NODE_ENV !== 'production') {
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      error: message,
      statusCode: status,
    });
  }
}

function getHttpExceptionMessage(response: object, fallback: string): string {
  if ('message' in response) {
    const { message } = response as { message?: unknown };
    if (typeof message === 'string') return message;
    if (Array.isArray(message))
      return message.filter((item) => typeof item === 'string').join(', ');
  }
  return fallback;
}
