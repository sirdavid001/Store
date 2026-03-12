export const currencyOptions = [
  { value: "NGN", label: "NGN", locale: "en-NG", country: "Nigeria" },
  { value: "USD", label: "USD", locale: "en-US", country: "United States" },
  { value: "GHS", label: "GHS", locale: "en-GH", country: "Ghana" },
  { value: "KES", label: "KES", locale: "en-KE", country: "Kenya" },
  { value: "ZAR", label: "ZAR", locale: "en-ZA", country: "South Africa" },
  { value: "XOF", label: "XOF", locale: "fr-SN", country: "West Africa" },
];

export const departmentCards = [
  {
    id: "phones",
    label: "Phones",
    headline: "Flagship phones with verified channel stock",
    description: "Apple, Samsung, Google, and premium Android handsets ready for fast nationwide delivery.",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
    accent: "from-blue-500/80 via-blue-600/30 to-transparent",
  },
  {
    id: "laptops",
    label: "Laptops",
    headline: "Creator and business laptops built for serious work",
    description: "MacBooks, Windows ultrabooks, and workstation-grade picks for professionals and students.",
    image:
      "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    accent: "from-violet-500/75 via-fuchsia-500/25 to-transparent",
  },
  {
    id: "accessories",
    label: "Accessories",
    headline: "Power, audio, and carry essentials",
    description: "Curated chargers, premium headphones, protective cases, cables, and travel gear.",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    accent: "from-sky-400/75 via-blue-500/25 to-transparent",
  },
  {
    id: "tablets",
    label: "Tablets",
    headline: "Portable screens for work, learning, and sketching",
    description: "iPad, Galaxy Tab, and hybrid tablets chosen for battery life, clarity, and productivity.",
    image:
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&q=80",
    accent: "from-indigo-500/70 via-purple-500/25 to-transparent",
  },
];

export const paymentFeatures = [
  {
    title: "Paystack Verified Checkout",
    description:
      "Hosted checkout flow with verified references, reconciliation-friendly logs, and a polished premium payment experience.",
  },
  {
    title: "Fast Checkout Channels",
    description:
      "Card, bank transfer, USSD, and Apple Pay support surfaced as a premium single-cart experience.",
  },
  {
    title: "Branded Confirmation Emails",
    description:
      "Customers receive branded order emails with clear payment and delivery updates.",
  },
];

export const defaultProducts = [
  {
    id: "iphone-16-pro-max",
    name: "iPhone 16 Pro Max",
    brand: "Apple",
    category: "phones",
    condition: "New",
    priceUsd: 1499,
    stock: 14,
    badge: "Best Seller",
    shortDescription: "Titanium flagship with pro camera system, long battery life, and Apple Pay-ready checkout.",
    description:
      "A premium flagship with a bright LTPO display, powerful silicon, and polished finishing for customers who want the cleanest iOS experience available.",
    image:
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1200&q=80",
    ],
    specs: [
      ["Display", "6.9-inch Super Retina XDR"],
      ["Storage", "256GB"],
      ["Camera", "48MP Pro camera system"],
      ["Battery", "Up to 29 hours video playback"],
    ],
  },
  {
    id: "galaxy-s25-ultra",
    name: "Galaxy S25 Ultra",
    brand: "Samsung",
    category: "phones",
    condition: "New",
    priceUsd: 1360,
    stock: 9,
    badge: "AI Flagship",
    shortDescription: "A bold Android flagship with stylus precision, vivid display, and all-day stamina.",
    description:
      "Built for ambitious mobile users, this flagship layers pro-grade imaging, generous storage, and sleek hardware into a single performance device.",
    image:
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1610792516307-ea5acd9c3b00?auto=format&fit=crop&w=1200&q=80",
    ],
    specs: [
      ["Display", "6.8-inch Dynamic AMOLED"],
      ["Storage", "512GB"],
      ["Memory", "12GB RAM"],
      ["Battery", "5000mAh"],
    ],
  },
  {
    id: "macbook-air-m3",
    name: "MacBook Air M3",
    brand: "Apple",
    category: "laptops",
    condition: "New",
    priceUsd: 1399,
    stock: 11,
    badge: "Editor Pick",
    shortDescription: "Lightweight performance laptop with silent operation, all-day battery, and a premium finish.",
    description:
      "The perfect premium laptop for founders, students, and operators who want strong battery life and a polished work setup without the weight.",
    image:
      "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
    ],
    specs: [
      ["Chip", "Apple M3"],
      ["Display", "13.6-inch Liquid Retina"],
      ["Storage", "512GB SSD"],
      ["Memory", "16GB unified memory"],
    ],
  },
  {
    id: "dell-xps-13-plus",
    name: "Dell XPS 13 Plus",
    brand: "Dell",
    category: "laptops",
    condition: "Certified Refurbished",
    priceUsd: 1185,
    stock: 6,
    badge: "Pro Grade",
    shortDescription: "Minimal Windows ultrabook for people who need a polished everyday workstation.",
    description:
      "A premium Windows machine with a clean industrial profile, strong keyboard deck, and enough performance for design, strategy, and deep office work.",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
    ],
    specs: [
      ["Processor", "Intel Core Ultra 7"],
      ["Display", "13.4-inch OLED"],
      ["Storage", "1TB SSD"],
      ["Memory", "16GB RAM"],
    ],
  },
  {
    id: "ipad-air-m2",
    name: "iPad Air M2",
    brand: "Apple",
    category: "tablets",
    condition: "New",
    priceUsd: 799,
    stock: 13,
    badge: "Portable Studio",
    shortDescription: "A lightweight tablet for sketching, note-taking, browsing, and client-facing presentations.",
    description:
      "A versatile premium tablet that bridges leisure and work, with smooth Pencil support and enough power for demanding mobile workflows.",
    image:
      "https://images.unsplash.com/photo-1589739900243-4b52cd9a7bd0?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1589739900243-4b52cd9a7bd0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&q=80",
    ],
    specs: [
      ["Chip", "Apple M2"],
      ["Display", "11-inch Liquid Retina"],
      ["Storage", "256GB"],
      ["Connectivity", "Wi-Fi + 5G"],
    ],
  },
  {
    id: "galaxy-tab-s10",
    name: "Galaxy Tab S10",
    brand: "Samsung",
    category: "tablets",
    condition: "Open Box",
    priceUsd: 915,
    stock: 4,
    badge: "Open Box",
    shortDescription: "Sharp AMOLED tablet with desktop mode and stylus support for serious mobile work.",
    description:
      "A polished Android tablet for users who want a premium media and productivity screen with flexible multitasking on the move.",
    image:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&q=80",
    ],
    specs: [
      ["Display", "12.4-inch AMOLED"],
      ["Storage", "256GB"],
      ["Battery", "10090mAh"],
      ["Extras", "S Pen included"],
    ],
  },
  {
    id: "sony-wh1000xm5",
    name: "Sony WH-1000XM5",
    brand: "Sony",
    category: "accessories",
    condition: "New",
    priceUsd: 419,
    stock: 19,
    badge: "Travel Essential",
    shortDescription: "Premium noise-canceling headphones for commuting, calls, editing, and focused work.",
    description:
      "A refined audio pick with class-leading noise cancellation, premium fit, and a minimalist look that suits executive travel and deep work.",
    image:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    ],
    specs: [
      ["Battery", "Up to 30 hours"],
      ["Connectivity", "Bluetooth 5.2"],
      ["Audio", "Hi-Res Audio"],
      ["Noise Control", "Industry-leading ANC"],
    ],
  },
  {
    id: "anker-prime-power-bank",
    name: "Anker Prime 27,650mAh Power Bank",
    brand: "Anker",
    category: "accessories",
    condition: "New",
    priceUsd: 229,
    stock: 26,
    badge: "Fast Charge",
    shortDescription: "High-output travel battery for phones, tablets, and laptops with premium screen readout.",
    description:
      "A serious travel power accessory for customers who move with multiple devices and want reliable fast charging from a compact form factor.",
    image:
      "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1585338447937-7082f8fc763d?auto=format&fit=crop&w=1200&q=80",
    ],
    specs: [
      ["Capacity", "27,650mAh"],
      ["Output", "250W Max"],
      ["Ports", "2x USB-C, 1x USB-A"],
      ["Display", "Smart OLED status panel"],
    ],
  },
];

export const defaultOrders = [
  {
    id: "ord-001",
    orderNumber: "SDG-2026-1042",
    trackingNumber: "TRK-AX91-221",
    customer: "Adaeze N.",
    email: "adaeze@example.com",
    status: "In Transit",
    paymentStatus: "Verified",
    currency: "NGN",
    amountUsd: 1499,
    items: ["iPhone 16 Pro Max"],
    timeline: [
      { title: "Order processing", detail: "Payment cleared and queued for fulfillment.", time: "12 Mar · 09:15" },
      { title: "Packed in Lagos", detail: "Quality check complete and sealed for dispatch.", time: "12 Mar · 10:30" },
      { title: "In transit", detail: "Handed over to last-mile partner.", time: "12 Mar · 14:05" },
    ],
  },
  {
    id: "ord-002",
    orderNumber: "SDG-2026-0988",
    trackingNumber: "TRK-JX54-880",
    customer: "Kwame O.",
    email: "kwame@example.com",
    status: "Delivered",
    paymentStatus: "Verified",
    currency: "GHS",
    amountUsd: 915,
    items: ["Galaxy Tab S10", "Sony WH-1000XM5"],
    timeline: [
      { title: "Order processing", detail: "Payment completed and approved for shipment.", time: "08 Mar · 08:09" },
      { title: "Shipped", detail: "Cross-border courier confirmed pickup.", time: "08 Mar · 15:44" },
      { title: "Delivered", detail: "Customer received and signed.", time: "11 Mar · 13:22" },
    ],
  },
];

export const defaultPaymentLogs = [
  {
    id: "pay-001",
    reference: "PSTACK-9A01",
    orderNumber: "SDG-2026-1042",
    status: "verified",
    channel: "card",
    createdAt: "2026-03-12T09:15:00.000Z",
    amountUsd: 1499,
  },
  {
    id: "pay-002",
    reference: "PSTACK-7C88",
    orderNumber: "SDG-2026-0988",
    status: "verified",
    channel: "bank_transfer",
    createdAt: "2026-03-08T08:09:00.000Z",
    amountUsd: 1314,
  },
];

export const defaultShippingConfig = {
  mode: "flat",
  flatFeeUsd: 18,
  percentageRate: 4,
  freeThresholdUsd: 1200,
};

export const policyLinks = [
  { href: "/terms-and-conditions", title: "Terms & Conditions", key: "terms-and-conditions" },
  { href: "/refund-policy", title: "Refund Policy", key: "refund-policy" },
  { href: "/privacy-policy", title: "Privacy Policy", key: "privacy-policy" },
  { href: "/shipping-policy", title: "Shipping Policy", key: "shipping-policy" },
  { href: "/faqs", title: "FAQs", key: "faqs" },
];

export const policyContent = {
  "terms-and-conditions": {
    title: "Terms & Conditions",
    intro:
      "SirDavid Gadgets trades as the online electronics storefront for SIRDAVID MULTI-TRADE LTD. These terms govern product availability, payments, shipping, and order fulfillment.",
    sections: [
      {
        heading: "Product listings",
        body:
          "We aim to keep every product page accurate, but availability, model trims, and pricing may change without notice until checkout processing is complete.",
      },
      {
        heading: "Payment confirmation",
        body:
          "Orders move through payment and processing checks before final fulfillment updates are issued.",
      },
      {
        heading: "Operational discretion",
        body:
          "We reserve the right to cancel or refund transactions flagged for fraud review, stock mismatch, pricing errors, or incomplete verification data.",
      },
    ],
  },
  "refund-policy": {
    title: "Refund Policy",
    intro:
      "Our refund policy is tuned for premium electronics where authenticity, activation status, and tamper state matter.",
    sections: [
      {
        heading: "Eligible refunds",
        body:
          "Items that arrive damaged, materially different from listing details, or unavailable after checkout processing may be refunded to the original payment source.",
      },
      {
        heading: "Non-eligible items",
        body:
          "Activated devices, opened accessories with hygiene restrictions, and products damaged after delivery are typically excluded unless consumer law requires otherwise.",
      },
      {
        heading: "Processing timeline",
        body:
          "Once approved, refunds are initiated through Paystack and may take several business days to reflect depending on bank or card processor timelines.",
      },
    ],
  },
  "privacy-policy": {
    title: "Privacy Policy",
    intro:
      "We collect only the data needed to sell, deliver, support, and reconcile orders responsibly.",
    sections: [
      {
        heading: "Data collected",
        body:
          "Customer contact data, shipping information, order history, and payment references are used to fulfill orders and provide post-purchase support.",
      },
      {
        heading: "Payment handling",
        body:
          "Sensitive payment instrument details are handled by Paystack. SirDavid Gadgets stores references and verification metadata, not raw card details.",
      },
      {
        heading: "Retention",
        body:
          "We retain order and payment records for customer service, operational reporting, and compliance requirements tied to electronics retailing.",
      },
    ],
  },
  "shipping-policy": {
    title: "Shipping Policy",
    intro:
      "We deliver nationwide and support regional fulfillment plans for verified orders across West and East Africa.",
    sections: [
      {
        heading: "Delivery windows",
        body:
          "Delivery timing depends on stock position, destination, and carrier conditions. Devices may be routed from Lagos or a partner inventory hub.",
      },
      {
        heading: "Fulfillment sequence",
        body:
          "Packing begins after checkout processing is complete. Tracking numbers are issued once the parcel enters dispatch handling.",
      },
      {
        heading: "Shipping fees",
        body:
          "Shipping can be configured as a flat fee, percentage of cart value, or waived after a free-shipping threshold.",
      },
    ],
  },
  faqs: {
    title: "Frequently Asked Questions",
    intro:
      "Fast answers for buyers comparing devices, checking payment methods, and tracking verified orders.",
    sections: [
      {
        heading: "Do you support Apple Pay?",
        body:
          "Yes. Apple Pay is supported on compatible Safari devices when Paystack surfaces the channel during checkout.",
      },
      {
        heading: "When is my order confirmed?",
        body:
          "After checkout processing is completed. Starting checkout alone does not create a confirmed order.",
      },
      {
        heading: "Can I pay by bank transfer or USSD?",
        body:
          "Yes. The storefront supports card, bank transfer, USSD, and Apple Pay in the hosted checkout flow.",
      },
    ],
  },
};
