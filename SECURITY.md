# Security Hardening Report

Project: Malitha Tishamal portfolio (`E:\wamp\www\malithatishamal`)
Stack: Next.js 15.5.29 (App Router), React 19, TypeScript, Firebase Auth + Firestore, Vercel
Date: 2026-11-18

---

## 1. Executive summary

The audit started with **20 production dependency advisories (5 moderate, 11 high,
4 critical)** and a live secret-exposure chain: the Gmail SMTP app password was
stored in the world-readable `siteContent/footer` document and therefore shipped
to every visitor of the website.

Current state:

| Metric | Before | After |
| --- | --- | --- |
| `npm audit --omit=dev` | 20 (5M / 11H / 4C) | **0** |
| Secrets in world-readable Firestore | SMTP user + app password | none (env only) |
| Admin API authentication | bearer token checked loosely | verified Firebase ID token + email verification + admin allowlist + approved Firestore profile |
| Admin session lifetime | indefinite | 30-minute idle sign-out |
| Public API body validation | ad-hoc string trimming | strict Zod schemas + 32 KB body cap |
| Security response headers | partial | CSP + report-uri, HSTS, COOP, CORP, Permissions-Policy, nosniff, x-request-id |
| Injection/scanning guard | none | edge middleware (UA blocklist, SQLi/XSS signatures, origin checks, rate limit) |

Verification executed locally on the final tree:

- `npx tsc --noEmit` — clean
- `npx vitest run` — **111 tests / 8 files passing**
- `npm run build` — success, 25 routes
- Production smoke test (`npm start`): pages 200, foreign-origin POST 403,
  extra JSON key 400, `text/plain` body 415, `x-middleware-subrequest` 400,
  `GET /api/newsletter/test-email` 405, CSP report 204, all 7 security headers present.

---

## 2. Findings and status

### Fixed

| ID | Severity | Finding | Fix |
| --- | --- | --- | --- |
| C1 | Critical | Gmail SMTP app password stored in `siteContent/footer` (world-readable) | Credentials moved to `SMTP_USER` / `SMTP_PASS` / `CONTACT_RECEIVER_EMAIL` env vars only (`src/lib/smtpConfig.ts`); all readers/writers strip legacy fields; `noSmtpSecrets()` rule rejects them |
| C2 | Critical | Real-looking encryption key committed in `.env.local.example` | Replaced with placeholder + generation command |
| H1 | High | Admin routes trusted a bearer token without checking verification, role or approval | `src/lib/adminAuth.ts`: Identity Toolkit `accounts:lookup` (signature check), `emailVerified`, ADMIN_EMAILS allowlist, Firestore profile role/status/isApproved |
| H2 | High | 20 vulnerable production dependencies (including Next.js RCE advisories) | Next 15.3.8 → 15.5.29, DOMPurify 3.4.18, axios 1.21.1, nodemailer 10.6.0, Firebase 11.10.0, PostCSS 8.5.33 override, gRPC 1.14.7 override, `next-auth` removed (unused) |
| H3 | High | Security response headers incomplete | CSP with `report-uri`, HSTS preload, COOP, CORP, Permissions-Policy, nosniff, `poweredByHeader:false`, `productionBrowserSourceMaps:false`, `no-store` on `/admin` and `/api` |
| H4 | High | Firestore rules allowed arbitrary profile fields and left `siteContent` writes unconstrained | Rules tightened: SMTP-secret ban, visitor counter `+1`-only diff, inquiry/newsletter/dailyStats shape whitelists, `users` field whitelist + immutable identity fields |
| H5 | High | Unverified email could obtain a session | Password accounts must verify before sign-in; unverified sessions are signed out on the auth listener; verification is re-sent on failed login |
| H6 | High | No brute-force protection on public endpoints | Per-IP limits on contact/newsletter/CSP-report/test-email, plus optional Upstash Redis distributed limiter (`distributedRateLimit`) |
| H7 | High | Weak password policy | 12-character minimum, obvious-pattern rejection, HIBP k-anonymity breach check (only a 5-char SHA-1 prefix leaves the browser) |
| M1 | Medium | API routes accepted unknown fields and unbounded bodies | `src/lib/schemas.ts`: strict Zod objects + `readJsonBody` 32 KB cap + content-type enforcement |
| M2 | Medium | Injection/scanning traffic reached the app | Edge middleware: bot UA blocklist, SQLi/XSS/traversal signatures (double-decoded), method restriction, 120 req/10 s per IP |
| M3 | Medium | Cross-site state-changing requests accepted | `/api/*` POST requires same-origin `Origin` (or `Referer`); `x-middleware-subrequest` rejected (CVE-2025-29927 class); CSRF report endpoint accepts reports only |
| M4 | Medium | Error responses leaked transport detail | Contact/test-email/smtp-config return generic messages; no `emailSent`/`emailError` in responses |
| M5 | Medium | Uploads trusted only the file extension | ZIP magic-byte check (`PK` header) + declared-size and actual-size caps |
| L1 | Low | No request correlation for incident response | `x-request-id` emitted by middleware and logged with server errors |
| L2 | Low | Source maps / framework banner exposed in production | Disabled |
| I1 | Info | CI only built the app | `.github/workflows/security.yml`: production audit gate, tsc, tests, build, Gitleaks (full history), Semgrep OWASP/JWT/secrets, CodeQL |

### Accepted risks (owner decision required)

| ID | Item | Why it remains | Mitigation in place |
| --- | --- | --- | --- |
| A1 | MFA / step-up authentication for admin | Firebase multi-factor (TOTP) requires the project to be upgraded to **Google Cloud Identity Platform** (billing). Cannot be enabled from code alone. | Verified email + explicit admin approval + server allowlist + 30-min idle sign-out |
| A2 | Append-only audit log | A trustworthy append-only log needs the Firebase **Admin SDK / service account**; this app uses the client SDK only. Client-written logs are spoofable, so adding one would create false assurance. | Vercel/Firebase platform logs + `x-request-id` correlation |
| A3 | Nonce-based CSP | The enforced CSP still needs `'unsafe-inline'` for the Next.js bootstrap and third-party snippets. Moving to nonces requires rewriting the inline-script path and re-testing every page; deferred to avoid breaking the live site. | CSP is **enforced** (not report-only) with `report-uri /api/csp-report`, object-src none, base-uri self; DOMPurify + HTML escaping remain primary XSS defence |
| A4 | Cookie-based CSRF tokens | Firebase sessions use IndexedDB/localStorage ID tokens, not cookies, so there are no ambient credentials to forge. | Origin/Referer enforcement on state-changing API calls |
| A5 | `X-Frame-Options: SAMEORIGIN` | Admin uses a same-origin iframe for landing-page preview; `DENY` would break it. | COOP `same-origin-allow-popups`, frame-ancestors `'self'` |
| A6 | Firebase App Check not enforced | Requires reCAPTCHA Enterprise keys + client wiring; cannot be enforced without breaking signed-out visitors. | Firestore rules + API auth + rate limiting |
| A7 | Dev-only `picomatch` advisory | No patched npm release exists at time of writing (`npm view picomatch version` → 4.0.7, advisory covers `*`). Only reachable through the test runner. | Production tree audited separately and is clean; CI gates dev tree at **critical** |
| A8 | In-process rate-limit state | Without `UPSTASH_REDIS_REST_URL` credentials, limits are per instance. | Env keys documented; falls back safely; set them on Vercel for global limits |
| A9 | Git-history secret purge | Rewriting history is destructive and needs explicit owner approval. | Rotation is mandatory (section 7); Gitleaks runs on full history in CI |

---

## 3. Guarded routes and role matrix

| Endpoint | Method | Anonymous | Pending user | Approved admin | Super admin | Limit |
| --- | --- | --- | --- | --- | --- | --- |
| `/api/contact` | POST | yes (validated) | yes | yes | yes | 5 / 10 min / IP |
| `/api/newsletter/subscribe` | POST | yes (validated) | yes | yes | yes | 5 / 10 min / IP |
| `/api/csp-report` | POST | yes (8 KB) | yes | yes | yes | 30 / min / IP |
| `/api/contact/smtp-config` | GET/POST | 401 | 403 | yes | yes | 5 / 10 min / IP + admin guard |
| `/api/newsletter/test-email` | POST | 401 | 403 | yes | yes | 5 / 10 min / IP + admin guard |
| `/api/admin/featured-settings` | POST | 401 | 403 | yes | yes | 30 / min / IP |
| `/api/admin/landing-page/config` | GET | 401 | 403 | yes | yes | 60 / min / IP |
| `/api/admin/landing-page/options` | POST | 401 | 403 | yes | yes | 20 / min / IP |
| `/api/admin/landing-page/activate` | POST | 401 | 403 | yes | yes | 10 / min / IP |
| `/api/admin/landing-page/remove` | POST | 401 | 403 | yes | yes | 10 / min / IP |
| `/api/admin/landing-page/upload` | POST | 401 | 403 | yes | yes | 10 / min / IP, 100 MB ZIP cap, PK magic bytes |
| `/api/admin/landing-page/process` | POST | 401 | 403 | yes | yes | 5 / min / IP |
| `/api/admin/landing-page/sign` | POST | 401 | 403 | yes | yes | 30 / min / IP |

"Approved admin" means: Firebase ID token valid **and** `email_verified == true`
**and** email present in `ADMIN_EMAILS` **and** `users/{uid}` has
`role == "admin" && status == "approved" && isApproved == true`.
Super admin is always `malithatishamal@gmail.com` with a verified address.

Firestore role matrix:

| Collection | Anonymous read | Anonymous create | Admin write |
| --- | --- | --- | --- |
| Public content (`portfolio`, `projects`, `blogs`, …) | yes | no | yes (approved admin) |
| `siteContent/*` | yes | no | yes, SMTP fields forbidden |
| `siteContent/visitorCounter` | yes | first-time `totalVisitors == 1` | yes |
| `inquiries`, `newsletterSubscribers` | no | shape-whitelisted create only | yes |
| `advancedAnalytics`, `visitors`, `techStackActivityLogs`, `dailyStats` | analytics public, rest no | yes (dailyStats shape-validated) | yes |
| `users` | own profile only | own profile, pending state, token email only | yes, identity fields immutable |
| everything else | no | no | no |

---

## 4. Security headers (verified on the production build)

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' …; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; report-uri /api/csp-report; upgrade-insecure-requests
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), interest-cohort=()
Cross-Origin-Opener-Policy: same-origin-allow-popups
Cross-Origin-Resource-Policy: same-site
Reporting-Endpoints: csp-endpoint="/api/csp-report"
x-request-id: <uuid>
(no X-Powered-By)
```

Uploaded landing pages get the isolated `sandbox allow-scripts …` CSP defined in
`next.config.mjs` and `src/lib/landingPage/serve.ts` (opaque origin: no cookies,
no localStorage, no access to the portfolio origin).

---

## 5. Dependencies

- Production audit: **0 vulnerabilities** (`npm audit --omit=dev`).
- Full audit: one **dev-only** `picomatch` advisory with no upstream patch yet;
  reachable only through Vitest. CI gates the dev tree at `critical`.
- Removed: `next-auth` (not imported anywhere).
- Overrides: `postcss@^8.5.33`, `@grpc/grpc-js@^1.14.7`, React pins unchanged.

---

## 6. Verification evidence

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | clean |
| `npx vitest run` | 111 passed |
| `npm run build` | 25 routes, compiled successfully |
| `npm audit --omit=dev` | 0 vulnerabilities |
| Foreign `Origin` POST → `/api/contact` | 403 |
| `{"role":"admin"}` appended to contact body | 400 "Invalid request." |
| `Content-Type: text/plain` body | 415 |
| `x-middleware-subrequest` header | 400 |
| `GET /api/newsletter/test-email` | 405 |
| CSP report POST | 204 |
| `/`, `/admin`, `/projects`, `/contact` | 200 |
| Security headers | all present |

---

## 7. Secrets to rotate (owner action — mandatory)

1. **Gmail app password** — was stored in the world-readable `siteContent/footer`
   document and in browser-delivered data. Revoke it in Google Account →
   Security → App passwords, then set the new value as `SMTP_PASS` in Vercel.
2. **`ENCRYPTION_KEY`** — a value was committed in `.env.local.example`
   (now a placeholder). If any real data was encrypted with it, generate a new
   key and re-encrypt; otherwise simply rotate the env var.
3. **Firebase Web API key** — public by design, but restrict it in Google Cloud
   Console (HTTP referrer restrictions + API restrictions: Identity Toolkit,
   Firestore, Storage only).
4. If the repository was ever public, assume the Gmail password was downloaded;
   rotation (not deletion) is the only effective remediation.

---

## 8. Operational checklist

- [ ] Deploy rules: `firebase deploy --only firestore:rules`
- [ ] Set Vercel env vars: `SMTP_USER`, `SMTP_PASS`, `CONTACT_RECEIVER_EMAIL`,
      `ADMIN_EMAILS`, `ENCRYPTION_KEY`; optionally `UPSTASH_REDIS_REST_URL` /
      `UPSTASH_REDIS_REST_TOKEN`
- [ ] Open `/admin` → Footer settings → **Save** once, and Contact settings →
      **Save** once: this deletes the legacy SMTP fields still present in the two
      live Firestore documents (`setDoc` replaces the whole document).
- [ ] Confirm `siteContent/footer` and `siteContent/contact` contain no
      `gmailSmtp*` keys afterwards.
- [ ] Delete the smoke-test newsletter row `security-smoke-test@example.com`
      (Admin → Newsletter subscribers).
- [ ] Enable Gitleaks/CodelQL/Semgrep on the GitHub repository (workflow file is
      committed; CodeQL needs Security → Code scanning enabled for the repo).
- [ ] Decide on MFA (requires Identity Platform upgrade) and on git-history purge;
      both are owner-level actions listed under accepted risks.

---

## 9. Deliberate non-changes (feature preservation)

- Visual design untouched; no markup or CSS was modified by this hardening pass.
- Landing-page preview iframe keeps `X-Frame-Options: SAMEORIGIN`.
- Public analytics writes (`advancedAnalytics`, `visitors`, `techStackActivityLogs`)
  remain anonymous-create because the visitor-tracking feature depends on them;
  they are admin-only for read/update/delete.
- Uploaded landing pages keep their broad, sandboxed CSP so existing uploaded sites
  continue to render unchanged.
- The middleware's 1 MB request-body cap exempts `/api/admin/landing-page/upload`
  (the handler enforces the real 100 MB ZIP limit plus magic-byte checks).
- The contact schema still accepts the legacy `notificationEmail` field sent by
  cached client bundles; the value is ignored and the recipient stays
  server-controlled (`CONTACT_RECEIVER_EMAIL`).
