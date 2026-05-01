interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { label: "Alle", value: "all" },
  { label: "Bundesliga", value: "bundesliga" },
  { label: "Premier League", value: "premier-league" },
  { label: "La Liga", value: "la-liga" },
  { label: "Serie A", value: "serie-a" },
  { label: "Nationalteams", value: "national" },
  { label: "Retro & Vintage", value: "retro" },
  { label: "Raritäten", value: "limited" },
];

const CategoryFilter = ({ activeCategory, onCategoryChange }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat, index) => (
        <button
          key={cat.value}
          onClick={() => onCategoryChange(cat.value)}
          className={`rounded-sm border px-4 py-2 font-display text-xs font-medium uppercase tracking-wider transition-all duration-200 stagger-item hover:scale-105 active:scale-95 ${
            activeCategory === cat.value
              ? "border-primary bg-primary text-primary-foreground shadow-lg"
              : "border-border bg-secondary/50 text-secondary-foreground hover:border-primary/50 hover:text-primary"
          }`}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;