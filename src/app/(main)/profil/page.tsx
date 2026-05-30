import { AppHeader } from "@/components/layout/AppHeader";
import { ProfileContent } from "@/components/profil/ProfileContent";

export default function ProfilPage() {
  return (
    <div>
      <AppHeader title="Profil" subtitle="Akun Anda" showProfile={false} />
      <div className="mt-4">
        <ProfileContent />
      </div>
    </div>
  );
}
