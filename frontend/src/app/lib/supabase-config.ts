export const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "";
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const adminFunctionName = "make-server-bda4aae5";

export const adminApiBaseUrl = projectId
  ? `https://${projectId}.supabase.co/functions/v1/${adminFunctionName}`
  : "";
