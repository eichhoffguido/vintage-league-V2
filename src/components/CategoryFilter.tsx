import { Badge } from "@/components/ui/badge";

const categories = [
  { label: "Alle", value: "all" },
  { label: "Bundesliga", value: "bundesliga" },
  { label: "Premier League", value: "premier-league" },
  { label: "La Liga", value: "la-liga" },
  { label: "Serie A", value: "serie-a" },
  { label: "Ligue 1", value: "ligue-1" },
  { label: "Nationalteams", value: "national" },
  { label: "Retro", value: "retro" },
  { label: "Limited Edition", value: "limited" },
];

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryFilter = ({ activeCategory, onCategoryChange }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onCategoryChange(cat.value)}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
            activeCategory === cat.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-secondary text-secondary-foreground hover:border-primary/50 hover:text-foreground"
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
