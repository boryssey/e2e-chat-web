import { redirect } from "next/navigation";

export default function DefaultAuthPage() {
  console.log("auth default page called");
  redirect("/login");
}
