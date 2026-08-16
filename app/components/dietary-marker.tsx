type DietaryMarkerProps = {
  dietary?: readonly string[];
  status?: DietaryPreference | "unconfirmed" | "notApplicable";
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

export function DietaryMarker({ dietary = [], status, compact = false }: DietaryMarkerProps) {
  const preference = status ?? getDietaryPreference(dietary);
  if (preference === "notApplicable") return null;
  const label = preference === "unconfirmed" ? "Dietary status unconfirmed" : labels[preference];

  return (
    <span className={`dietaryMarker is-${preference} ${compact ? "isCompact" : ""}`}>
      <i aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
