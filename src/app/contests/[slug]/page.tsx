import { redirect } from "next/navigation";

// Contests are coming soon, so any old contest link lands on the coming-soon page.
export default function ContestPage() {
  redirect("/contests");
}
