import {
  Milk,
  Beef,
  Fish,
  Apple,
  CupSoda,
  ShoppingBasket,
  Croissant,
  Candy,
  Package,
  type LucideIcon,
} from "lucide-react";

interface CategoryDef {
  en: string;
  ru: string;
  icon: LucideIcon;
  color: string;
}

const CATEGORIES: Record<string, CategoryDef> = {
  "Dairy Products":      { en: "Dairy Products",      ru: "Молочная продукция",       icon: Milk,            color: "#60a5fa" },
  "Meat Department":     { en: "Meat Department",      ru: "Мясной отдел",             icon: Beef,            color: "#f87171" },
  "Fish & Seafood":      { en: "Fish & Seafood",       ru: "Рыба и морепродукты",      icon: Fish,            color: "#38bdf8" },
  "Fruits & Vegetables": { en: "Fruits & Vegetables",  ru: "Овощи и фрукты",          icon: Apple,           color: "#4ade80" },
  "Beverages":           { en: "Beverages",            ru: "Напитки",                  icon: CupSoda,         color: "#c084fc" },
  "Groceries":           { en: "Groceries",            ru: "Бакалея",                  icon: ShoppingBasket,  color: "#fbbf24" },
  "Bakery":              { en: "Bakery",               ru: "Хлебобулочные изделия",    icon: Croissant,       color: "#fb923c" },
  "Confectionery":       { en: "Confectionery",        ru: "Кондитерские изделия",     icon: Candy,           color: "#f472b6" },
};

export function getCategoryDisplay(categoryEn: string, locale: "ru" | "en"): string {
  const cat = CATEGORIES[categoryEn];
  if (!cat) return categoryEn;
  return locale === "ru" ? cat.ru : cat.en;
}

export function CategoryIcon({
  category,
  size = 24,
  className,
}: {
  category: string;
  size?: number;
  className?: string;
}) {
  const def = CATEGORIES[category];
  const Icon = def?.icon ?? Package;
  const color = def?.color ?? "#94a3b8";

  return (
    <div
      className={className}
      style={{
        width: size * 2,
        height: size * 2,
        borderRadius: size * 0.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `${color}14`,
        flexShrink: 0,
      }}
    >
      <Icon style={{ width: size, height: size, color }} strokeWidth={1.8} />
    </div>
  );
}
