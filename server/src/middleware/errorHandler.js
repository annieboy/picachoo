function errorHandler(err, req, res, next) {
  // Normalise status — GaxiosError (Google API) sets .status; pg errors don't
  const status = err.status ?? err.response?.status ?? 500;

  // Always log 500s with the full stack for debugging
  if (status >= 500) {
    console.error('[500]', req.method, req.path, err.message, err.stack);
  }

  // In development surface the raw message; in production mask 5xx but keep 4xx
  const isProd   = process.env.NODE_ENV === 'production';
  const message  = (isProd && status >= 500) ? 'Internal server error' : err.message;

  res.status(status).json({ error: message });
}

function notFound(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}

module.exports = { errorHandler, notFound };
