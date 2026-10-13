import type { Category } from "../types";

const CLASS: Record<Category, string> = {
  Market: "badge--market",
  Music: "badge--music",
  Sports: "badge--sports",
  Volunteer: "badge--volunteer",
  "Fun Run": "badge--funrun",
  Concert: "badge--concert",
  "Pop-Up": "badge--popup",
};

export function CategoryBadge({ category }: { category: Category }) {
  return <span className={`badge ${CLASS[category]}`}>{category}</span>;
}
