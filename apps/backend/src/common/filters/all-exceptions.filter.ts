import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

type RequestWithContext = Request & {
  id?: string;
  user?: { id?: string };
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<RequestWithContext>();
    const response = ctx.getResponse<Response>();
    const requestId = request.id;

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : getHttpExceptionMessage(res, message);
    } else if (exception instanceof Error && !isProductionEnvironment()) {
      message = exception.message;
    }

    if (requestId) response.setHeader('x-request-id', requestId);
    const logMessage = `${request.method ?? 'UNKNOWN'} ${request.originalUrl ?? request.url ?? 'unknown'} status=${status} requestId=${requestId ?? 'none'} userId=${request.user?.id ?? 'anonymous'}`;
    if (status >= 500) {
      this.logger.error(logMessage, exception instanceof Error ? exception.stack : undefined);
    } else {
      this.logger.warn(logMessage);
    }

    response.status(status).json({
      success: false,
      error: message,
      statusCode: status,
      ...(requestId ? { requestId } : {}),
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

function isProductionEnvironment() {
  return process.env.NODE_ENV === 'production' || process.env.CLOUDFLARE_WORKER === 'true';
}
