import { Response } from 'express';

export function successResponse<T>(
  res: Response,
  data: T,
  message: 'Success',
  statusCode = 200,
) {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function createdResponse<T>(
  res: Response,
  data: T,
  message: 'Created successfully',
) {
  successResponse(res, data, message, 201);
}