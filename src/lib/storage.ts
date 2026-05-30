import { createClient } from "@/lib/supabase/client";

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadPaymentQris(
  coupleSpaceId: string,
  file: File
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${coupleSpaceId}/qris-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("payment_assets").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("payment_assets").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadPaymentProof(
  userId: string,
  file: File
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/proof-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("payment_assets").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("payment_assets").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadTargetImage(userId: string, file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("target_images").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("target_images").getPublicUrl(path);
  return data.publicUrl;
}
