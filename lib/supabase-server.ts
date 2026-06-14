type SupabaseRpcError = {
  message?: string;
};

export class SupabaseServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseServerError";
  }
}

export async function callSupabaseRpc<T>(functionName: string, parameters: Record<string, unknown>): Promise<T> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) throw new SupabaseServerError("Supabase server configuration is missing.");
  if (!secretKey.startsWith("sb_secret_") && !secretKey.startsWith("eyJ")) {
    throw new SupabaseServerError("Supabase secret key format is invalid.");
  }

  const headers: Record<string, string> = {
    apikey: secretKey,
    "Content-Type": "application/json",
  };
  if (secretKey.startsWith("eyJ")) headers.Authorization = `Bearer ${secretKey}`;

  const response = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers,
    body: JSON.stringify(parameters),
    cache: "no-store",
  });

  if (!response.ok) {
    let payload: SupabaseRpcError = {};
    try {
      payload = await response.json() as SupabaseRpcError;
    } catch {
      // The caller receives a generic error without database internals.
    }
    throw new SupabaseServerError(payload.message ?? "Supabase RPC failed.");
  }

  return await response.json() as T;
}
