import { Users } from "lucide-react";
import { Empty } from "@/components/ui";

export function NoGroup() {
  return (
    <div className="card">
      <Empty icon={Users} title="Siz hali guruhga biriktirilmagansiz" text="Administrator bilan bog'laning." />
    </div>
  );
}
