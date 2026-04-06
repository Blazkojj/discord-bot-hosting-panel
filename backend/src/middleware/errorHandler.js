function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const message =
    error.message || "Wystąpił nieoczekiwany błąd po stronie serwera.";

  if (process.env.NODE_ENV !== "production") {
    console.error(error);
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack
  });
}

module.exports = {
  errorHandler
};
