from decimal import Decimal


STOREFRONT_SHIPPING_FEE_USD = Decimal("18.00")

STOREFRONT_PRODUCT_CATALOG = {
    "iphone-16-pro-max": {
        "name": "iPhone 16 Pro Max",
        "sku": "SDG-IP16PM-256",
        "price_usd": Decimal("1499.00"),
        "stock": 14,
    },
    "galaxy-s25-ultra": {
        "name": "Galaxy S25 Ultra",
        "sku": "SDG-GS25U-512",
        "price_usd": Decimal("1360.00"),
        "stock": 9,
    },
    "macbook-air-m3": {
        "name": "MacBook Air M3",
        "sku": "SDG-MBA-M3-512",
        "price_usd": Decimal("1399.00"),
        "stock": 11,
    },
    "dell-xps-13-plus": {
        "name": "Dell XPS 13 Plus",
        "sku": "SDG-XPS13P-1TB",
        "price_usd": Decimal("1185.00"),
        "stock": 6,
    },
    "ipad-air-m2": {
        "name": "iPad Air M2",
        "sku": "SDG-IPADAIR-M2",
        "price_usd": Decimal("799.00"),
        "stock": 13,
    },
    "galaxy-tab-s10": {
        "name": "Galaxy Tab S10",
        "sku": "SDG-GTABS10-256",
        "price_usd": Decimal("915.00"),
        "stock": 4,
    },
    "sony-wh1000xm5": {
        "name": "Sony WH-1000XM5",
        "sku": "SDG-WH1000XM5",
        "price_usd": Decimal("419.00"),
        "stock": 19,
    },
    "anker-prime-power-bank": {
        "name": "Anker Prime 27,650mAh Power Bank",
        "sku": "SDG-ANKER-27650",
        "price_usd": Decimal("229.00"),
        "stock": 26,
    },
}
