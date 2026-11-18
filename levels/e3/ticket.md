# AUTH-77: Users can't reset their password

Support says: **"I never got the reset email"**, **"the link says expired immediately"**, and security found that **a reset link can be used more than once**.

## API
| Method | Path | Behaviour |
|---|---|---|
| `POST` | `/auth/forgot` `{ email }` | Always **202** (never reveal if an email exists). If the user exists, send one reset email. Emails are case-insensitive and trimmed. |
| `POST` | `/auth/reset` `{ token, newPassword }` | **200**. Token valid for **15 minutes**, **single use**. Password at least **8** chars. Otherwise **400**. |
| `POST` | `/auth/login` `{ email, password }` | **200** or **401** |

Sent emails land in `src/lib/outbox.js` (tests read it). `src/lib/clock.js` lets tests move time forward.
