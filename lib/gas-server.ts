import type { VerifiedUser } from "@/lib/api";

type GasResponse<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
};

export class GasServerError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "GasServerError";
    this.code = code;
  }
}

export async function callGasServer<T>(
  action: string,
  email: string,
  data: Record<string, unknown> = {},
) {
  const url = process.env.NEXT_PUBLIC_GAS_API_URL;
  const proxySecret = process.env.GAS_PROXY_SECRET;
  if (!url || !proxySecret) {
    throw new GasServerError("CONFIG_ERROR", "Apps Script API authentication is not configured.");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      proxySecret,
      requestUser: { email },
      data,
    }),
    redirect: "follow",
    cache: "no-store",
  });
  const payload = (await response.json()) as GasResponse<T>;

  if (!response.ok || !payload.success || payload.data === null) {
    throw new GasServerError(
      payload.error?.code ?? "INTERNAL_ERROR",
      payload.error?.message ?? "Apps Script API request failed.",
    );
  }
  return payload.data;
}

export function verifyUserServer(email: string) {
  return callGasServer<VerifiedUser>("verifyUser", email);
}
