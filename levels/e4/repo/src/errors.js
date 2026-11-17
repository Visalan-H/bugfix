class AppError extends Error { constructor(m, status) { super(m); this.status = status; } }
class ValidationError extends AppError { constructor(m) { super(m, 400); } }
class ConflictError extends AppError { constructor(m) { super(m, 409); } }
class AuthError extends AppError { constructor(m = 'unauthenticated') { super(m, 401); } }
class NotFoundError extends AppError { constructor(m = 'not found') { super(m, 404); } }

module.exports = { ValidationError, ConflictError, AuthError, NotFoundError };
