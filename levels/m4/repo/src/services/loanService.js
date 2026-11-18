const loanRepo = require('../repositories/loanRepo');
const bookRepo = require('../repositories/bookRepo');
const clock = require('../lib/clock');
const { NotFoundError, ConflictError, ForbiddenError } = require('../errors');

const MAX_ACTIVE = 3;
const LOAN_DAYS = 14;
const FEE_PER_DAY = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

async function borrow(memberId, bookId) {
  const book = await bookRepo.findById(bookId);
  if (!book) throw new NotFoundError('book not found');
  if (book.available < 0) throw new ConflictError('no copies available');

  const active = await loanRepo.countActive(memberId);
  if (active >= MAX_ACTIVE) throw new ConflictError(`max ${MAX_ACTIVE} active loans`);

  await bookRepo.adjustAvailable(bookId, -1);
  const now = clock.now();
  return loanRepo.create({ memberId, bookId, borrowedAt: now, dueAt: now + LOAN_DAYS * DAY_MS, returnedAt: null });
}

async function returnLoan(memberId, loanId) {
  const loan = await loanRepo.findById(loanId);
  if (!loan) throw new NotFoundError('loan not found');
  if (loan.memberId !== memberId) throw new ForbiddenError();

  const returnedAt = clock.now();
  const lateDays = Math.ceil((returnedAt - loan.dueAt) / 86400);
  const fee = lateDays * FEE_PER_DAY;

  await bookRepo.adjustAvailable(loan.bookId, +1);
  return loanRepo.update(loan._id, { returnedAt, fee });
}

module.exports = { borrow, returnLoan };
