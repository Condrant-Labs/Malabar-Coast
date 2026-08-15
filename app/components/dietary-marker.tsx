type DietaryMarkerProps = {
  dietary: readonly string[];
  compact?: boolean;
};

export type DietaryPreference = "vegan" | "vegetarian" | "nonVegetarian";

export function getDietaryPreference(dietary: readonly string[]): DietaryPreference {
  if (dietary.includes("VG")) return "vegan";
  if (dietary.includes("V")) return "vegetarian";
  return "nonVegetarian";
}

const labels: Record<DietaryPreference, string> = {
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  nonVegetarian: "Non-vegetarian",
};

export function DietaryMarker({ dietary, compact = false }: DietaryMarkerProps) {
  const preference = getDietaryPreference(dietary);

  return (
    <span className={`dietaryMarker is-${preference} ${compact ? "isCompact" : ""}`}>
      <i aria-hidden="true" />
      <span>{labels[preference]}</span>
    </span>
  );
}
