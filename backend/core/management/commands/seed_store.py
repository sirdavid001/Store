from decimal import Decimal

from django.core.management.base import BaseCommand

from catalog.models import Category, Product, ProductSpecification


SEED_DATA = [
    {
        "category": {
            "name": "Phones",
            "description": "Smartphones for work, media, and daily use.",
            "featured": True,
        },
        "products": [
            {
                "name": "Nova X12 Pro",
                "brand": "SirDavid Select",
                "short_description": "6.7-inch 5G smartphone with 256GB storage.",
                "description": "A premium Android handset with fast charging, sharp OLED display, and dependable battery life.",
                "price": Decimal("685000.00"),
                "sku": "PHONE-NOVA-X12",
                "stock_quantity": 12,
                "featured": True,
                "specs": {
                    "Display": "6.7-inch OLED",
                    "Storage": "256GB",
                    "RAM": "12GB",
                    "Battery": "5000mAh",
                },
            },
            {
                "name": "Axis Mini 5G",
                "brand": "SirDavid Select",
                "short_description": "Compact 5G phone with all-day battery.",
                "description": "A lightweight smartphone for customers who want strong performance in a smaller footprint.",
                "price": Decimal("329000.00"),
                "sku": "PHONE-AXIS-MINI",
                "stock_quantity": 18,
                "featured": True,
                "specs": {
                    "Display": "6.1-inch AMOLED",
                    "Storage": "128GB",
                    "RAM": "8GB",
                    "Battery": "4200mAh",
                },
            },
        ],
    },
    {
        "category": {
            "name": "Laptops",
            "description": "Performance laptops for business, study, and creators.",
            "featured": True,
        },
        "products": [
            {
                "name": "VertexBook 14",
                "brand": "SirDavid Select",
                "short_description": "Slim Intel laptop with 16GB RAM and SSD storage.",
                "description": "Designed for business and hybrid work with a bright display, fingerprint unlock, and USB-C charging.",
                "price": Decimal("1125000.00"),
                "sku": "LAPTOP-VERTEX-14",
                "stock_quantity": 6,
                "featured": True,
                "specs": {
                    "Processor": "Intel Core Ultra 7",
                    "Memory": "16GB",
                    "Storage": "1TB SSD",
                    "Display": "14-inch IPS",
                },
            },
            {
                "name": "CreatorDock 16",
                "brand": "SirDavid Select",
                "short_description": "Large-screen creator laptop with dedicated graphics.",
                "description": "Built for designers, video editors, and engineers who need power on the move.",
                "price": Decimal("1740000.00"),
                "sku": "LAPTOP-CREATOR-16",
                "stock_quantity": 4,
                "featured": False,
                "specs": {
                    "Processor": "AMD Ryzen 9",
                    "Graphics": "RTX 4060",
                    "Memory": "32GB",
                    "Storage": "1TB SSD",
                },
            },
        ],
    },
    {
        "category": {
            "name": "Accessories",
            "description": "Essential add-ons for productivity and protection.",
            "featured": True,
        },
        "products": [
            {
                "name": "PulseBuds ANC",
                "brand": "SirDavid Audio",
                "short_description": "Noise-canceling earbuds with wireless charging case.",
                "description": "Comfortable earbuds with deep bass, stable Bluetooth pairing, and travel-friendly battery life.",
                "price": Decimal("95000.00"),
                "sku": "ACCESS-PULSEBUDS",
                "stock_quantity": 25,
                "featured": True,
                "specs": {
                    "Noise control": "Active noise cancellation",
                    "Battery": "30 hours with case",
                    "Charging": "USB-C / wireless",
                    "Water resistance": "IPX4",
                },
            },
            {
                "name": "GaN Fast Charger 65W",
                "brand": "SirDavid Power",
                "short_description": "Compact fast charger for phones and laptops.",
                "description": "Dual-port fast charging brick suitable for USB-C phones, tablets, and lightweight laptops.",
                "price": Decimal("28500.00"),
                "sku": "ACCESS-GAN-65W",
                "stock_quantity": 40,
                "featured": False,
                "specs": {
                    "Output": "65W",
                    "Ports": "2",
                    "Technology": "GaN",
                    "Cable": "Not included",
                },
            },
        ],
    },
]


class Command(BaseCommand):
    help = "Seed sample categories and products for SirDavid Gadgets."

    def handle(self, *args, **options):
        for category_data in SEED_DATA:
            category, _ = Category.objects.get_or_create(
                name=category_data["category"]["name"],
                defaults=category_data["category"],
            )
            for raw_product_data in category_data["products"]:
                product_data = raw_product_data.copy()
                specs = product_data.pop("specs")
                product, created = Product.objects.get_or_create(
                    sku=product_data["sku"],
                    defaults={"category": category, **product_data},
                )
                if not created:
                    for field, value in product_data.items():
                        setattr(product, field, value)
                    product.category = category
                    product.save()

                ProductSpecification.objects.filter(product=product).delete()
                ProductSpecification.objects.bulk_create(
                    [
                        ProductSpecification(
                            product=product,
                            label=label,
                            value=value,
                            sort_order=index,
                        )
                        for index, (label, value) in enumerate(specs.items(), start=1)
                    ]
                )

        self.stdout.write(self.style.SUCCESS("Sample store data created or updated."))
