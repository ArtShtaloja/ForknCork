const { error } = require('../utils/response.util');

/**
 * Catch-all handler for routes that don't match any defined endpoint.
 */
function notFoundHandler(req, res, _next) {
  return error(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

/**
 * Global error-handling middleware.
 * Express recognises this as an error handler because it has four parameters.
 */
function errorHandler(err, req, res, _next) {
  // Structured logging for easier debugging on Render
  console.error('[ERROR]', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  // Multer file-size / file-type errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return error(res, 'File is too large. Maximum size is 5 MB.', 413);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return error(res, 'Unexpected file field.', 400);
  }

  // JSON parse errors from malformed request bodies
  if (err.type === 'entity.parse.failed') {
    return error(res, 'Malformed JSON in request body.', 400);
  }

  // MySQL duplicate-entry errors
  if (err.code === 'ER_DUP_ENTRY') {
    return error(res, 'A record with that value already exists.', 409);
  }

  // MySQL connection lost (Aiven may power down)
  if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ENOTFOUND') {
    return error(res, 'Database connection error. Please try again shortly.', 503);
  }

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error';

  return error(res, message, statusCode);
}

module.exports = { notFoundHandler, errorHandler };
