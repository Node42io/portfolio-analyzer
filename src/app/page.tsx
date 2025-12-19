import { redirect } from "next/navigation";

// Home page redirects to Customer Insights as the main entry point
export default function HomePage() {
  redirect("/customers");
}
