# SirDavid Gadgets Frontend

React + Vite storefront for SirDavid Gadgets, built with Tailwind CSS, React Router, Radix UI, Lucide icons, and Sonner toasts.

## Routes

- `/` and `/shop`
- `/product/:id`
- `/cart`
- `/track-order`
- `/terms-and-conditions`
- `/refund-policy`
- `/privacy-policy`
- `/shipping-policy`
- `/faqs`
- `/legal`
- `/secure-admin-portal-xyz`

## Features

- Dark premium storefront with category-led merchandising
- Currency auto-detection with exchange-rate fallback support
- Paystack hosted checkout handoff via `VITE_PAYSTACK_INIT_ENDPOINT` (defaults to `/payments/storefront/initialize/`)
- Local admin portal for products, orders, shipping rules, and payment logs

## Commands

```bash
npm install
npm run dev
npm run build
```
