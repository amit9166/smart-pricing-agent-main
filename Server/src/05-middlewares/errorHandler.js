const errorHandler = (err, req, res, next) => {
  console.error(`[Error Handler] Catastrophic error caught: ${err.message}`);
  console.error(err.stack);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = errorHandler;
