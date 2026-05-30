function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  appUrl: () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  midtransServerKey: () => required("MIDTRANS_SERVER_KEY"),
  midtransIsProduction: () => process.env.MIDTRANS_IS_PRODUCTION === "true",
  cronSecret: () => required("CRON_SECRET"),
};

export function publicEnvOk(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
