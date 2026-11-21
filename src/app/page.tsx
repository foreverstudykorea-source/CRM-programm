import { redirect } from "next/navigation";
import { getCurrentUser, HOME } from "@/lib/auth";

export default async function Root() {
  const user = await getCurrentUser();
  redirect(user ? HOME[user.role] : "/login");
}
