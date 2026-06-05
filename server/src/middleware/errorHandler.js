function errorHandler(err, req, res, next) {
  // Normalise status — GaxiosError (Google API) sets .status; pg errors don't
  const status = err.status ?? err.response?.status ?? 500;

  // Always log 500s with the full stack for debugging
  if (status >= 500) {
    console.error('[500]', req.method, req.path, err.message, err.stack);
  }

  // Temporarily always expose error message for debugging
  const message  = err.message;

  res.status(status).json({ error: message });
}

function notFound(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}

module.exports = { errorHandler, notFound };
