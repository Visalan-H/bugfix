class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }
}

class ValidationError extends AppError { constructor(msg) { super(msg, 400); } }
class ForbiddenError extends AppError { constructor(msg = 'Forbidden') { super(msg, 403); } }
class NotFoundError extends AppError { constructor(what = 'Resource') { super(`${what} not found`, 404); } }
class ConflictError extends AppError { constructor(msg) { super(msg, 409); } }

module.exports = { AppError, ValidationError, ForbiddenError, NotFoundError, ConflictError };
