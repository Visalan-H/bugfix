class AppError extends Error { constructor(m, status) { super(m); this.status = status; } }
class NotFoundError extends AppError { constructor(m = 'not found') { super(m, 404); } }
class ValidationError extends AppError { constructor(m) { super(m, 400); } }

module.exports = { NotFoundError, ValidationError };
