import { CalendarX2 } from "lucide-react";
import { Empty } from "@/components/ui";

export function NoGroup() {
  return (
    <div className="card">
      <Empty icon={CalendarX2} title="Siz hali guruhga biriktirilmagansiz" text="Administrator sizni guruhga qo'shgach, dars jadvalingiz shu yerda chiqadi." />
    </div>
  );
}
