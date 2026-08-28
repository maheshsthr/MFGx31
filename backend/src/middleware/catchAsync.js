/** Wraps an async route handler so thrown errors reach the Express error handler. */
export function catchAsync(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/** Small helper to send a typed error response. */
export function fail(res, status, message) {
  return res.status(status).json({ error: message });
}