import { redirect } from "next/navigation";
import { getSession } from "@/lib/role";

export default async function HomePage() {
  const session = await getSession();
  redirect(session.role === "STUDENT" ? "/student" : "/dashboard");
}
