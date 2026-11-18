class AppError extends Error { constructor(m, status) { super(m); this.status = status; } }
class NotFoundError extends AppError { constructor(m = 'not found') { super(m, 404); } }
class ConflictError extends AppError { constructor(m) { super(m, 409); } }
class ForbiddenError extends AppError { constructor(m = 'forbidden') { super(m, 403); } }

module.exports = { NotFoundError, ConflictError, ForbiddenError };
