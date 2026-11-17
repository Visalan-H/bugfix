class AppError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}
class ValidationError extends AppError { constructor(m) { super(m, 400); } }
class AuthError extends AppError { constructor(m = 'invalid credentials') { super(m, 401); } }

module.exports = { AppError, ValidationError, AuthError };
