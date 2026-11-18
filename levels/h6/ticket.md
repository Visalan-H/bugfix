# PAY-77: Wallet balances drift

Amounts are **integers in paise**. Every change is a ledger entry `{ walletId, type: 'credit'|'debit', amount, … }`. Balance = credits − debits.

| Method | Path | Behaviour |
|---|---|---|
| `POST` | `/wallets/:id/topup { amount }` + optional `Idempotency-Key` (unique id for safe retries) | **201**. Same key again → same entry, no new credit (200) |
| `POST` | `/wallets/:id/pay { amount }` | Debit. Not enough balance → **409** |
| `POST` | `/payments/:paymentId/refund { amount }` | Credit back. Total refunds ≤ payment amount → else **400** |
| `GET` | `/wallets/:id` | `{ balance }` |
