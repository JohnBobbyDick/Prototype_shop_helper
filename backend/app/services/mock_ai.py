import asyncio
import random

CATEGORIES = [
    {"en": "Dairy Products", "ru": "Молочная продукция", "detail_en": "milk", "detail_ru": "молоко"},
    {"en": "Dairy Products", "ru": "Молочная продукция", "detail_en": "yogurt", "detail_ru": "йогурт"},
    {"en": "Meat Department", "ru": "Мясной отдел", "detail_en": "chicken", "detail_ru": "курица"},
    {"en": "Meat Department", "ru": "Мясной отдел", "detail_en": "beef", "detail_ru": "говядина"},
    {"en": "Fish & Seafood", "ru": "Рыба и морепродукты", "detail_en": "salmon", "detail_ru": "лосось"},
    {"en": "Fruits & Vegetables", "ru": "Овощи и фрукты", "detail_en": "apple", "detail_ru": "яблоко"},
    {"en": "Fruits & Vegetables", "ru": "Овощи и фрукты", "detail_en": "tomato", "detail_ru": "помидор"},
    {"en": "Beverages", "ru": "Напитки", "detail_en": "orange juice", "detail_ru": "апельсиновый сок"},
    {"en": "Beverages", "ru": "Напитки", "detail_en": "water", "detail_ru": "вода"},
    {"en": "Groceries", "ru": "Бакалея", "detail_en": "pasta", "detail_ru": "макароны"},
    {"en": "Groceries", "ru": "Бакалея", "detail_en": "rice", "detail_ru": "рис"},
    {"en": "Bakery", "ru": "Хлебобулочные изделия", "detail_en": "bread", "detail_ru": "хлеб"},
    {"en": "Confectionery", "ru": "Кондитерские изделия", "detail_en": "chocolate", "detail_ru": "шоколад"},
    {"en": "Confectionery", "ru": "Кондитерские изделия", "detail_en": "cookies", "detail_ru": "печенье"},
]


async def analyze_image(image_bytes: bytes) -> dict:
    """
    Mock AI classifier. Returns a random category with realistic confidence.
    Replace this function body with a real CV model when ready.
    """
    await asyncio.sleep(random.uniform(0.5, 1.5))

    item = random.choice(CATEGORIES)
    confidence = round(random.uniform(75.0, 98.0), 1)

    return {
        "category": item["en"],
        "category_ru": item["ru"],
        "product_detail": item["detail_ru"],
        "confidence": confidence,
    }
