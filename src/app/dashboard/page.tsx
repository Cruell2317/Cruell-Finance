import { redirect } from "next/navigation";

/** Entry setelah verifikasi email — lanjut splash lalu app. */
export default function DashboardEntryPage() {
  redirect("/splash");
}
