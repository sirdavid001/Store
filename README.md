# SirDavid Gadgets

Production-lean Django e-commerce MVP for **SIRDAVID MULTI-TRADE LTD**, built for `sirdavidshop.sirdavid.site`.

## Project structure

- `backend/` contains the Django project config and all backend apps
- `frontend/` contains the Vite/React storefront source and its `dist/` build output
- `templates/`, `static/`, `.well-known/`, and deployment entrypoints stay at the repository root

## Features

- Product catalog with categories, featured items, search, filtering, stock tracking, and detailed product pages
- Session-backed cart with quantity updates, running totals, and responsive checkout access
- Four-step checkout with email verification, delivery address capture, payment method selection, and order review
- Paystack integration using hosted checkout plus webhook verification
- Order creation **only after** successful Paystack verification on the webhook path
- Guest checkout, public order tracking, logged-in customer history, Django admin order management, and a staff dashboard
- Branded order confirmation, admin alert, and order status update emails
- Apple Pay-ready verification endpoint at `/.well-known/apple-developer-merchantid-domain-association`

## Local setup

1. Create and activate a virtual environment.
2. Install dependencies with `pip install -r requirements.txt`.
3. Copy `.env.example` to `.env` and set Paystack, SMTP, and security values.
4. Run `python manage.py migrate`.
5. Create an admin account with `python manage.py createsuperuser`.
6. Optional: seed demo products with `python manage.py seed_store`.
7. Start the server with `python manage.py runserver`.
8. Build the React storefront with `cd frontend && npm run build` when you need updated frontend assets.

## Critical payment rule

This project does not write `Order` records during checkout initiation. Customer, address, and cart data are cached server-side and a Paystack transaction is created. The `payments/webhook/` endpoint verifies the webhook signature and transaction status. Only then is the order written to the database and email notifications sent.

## Deployment notes for sirdavidshop.sirdavid.site

- Set `SITE_URL=https://sirdavidshop.sirdavid.site`
- Enable HTTPS and keep `DJANGO_SECURE_SSL_REDIRECT=True`
- Point Paystack callback URL to `https://sirdavidshop.sirdavid.site/payments/callback/`
- Point Paystack webhook URL to `https://sirdavidshop.sirdavid.site/payments/webhook/`
- Replace `.well-known/apple-developer-merchantid-domain-association` with the real Apple Pay verification file
- Run `python manage.py collectstatic` during deployment
- Use Supabase Postgres in production by setting `DATABASE_URL` to the transaction pooler URL on port `6543`
- Set `POSTGRES_SSLMODE=require`
- Set `POSTGRES_DISABLE_PREPARED_STATEMENTS=True`
- Set `DJANGO_DEBUG=False` in Vercel
- Run `python manage.py migrate` against the Supabase database after deploy

## Admin workflow

- Use `/admin/` for secure catalog and order management
- Use `/dashboard/` for a lightweight operations view
- Update order statuses from the admin to trigger customer status emails
