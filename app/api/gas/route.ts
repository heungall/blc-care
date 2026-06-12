import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const gasApiUrl = process.env.NEXT_PUBLIC_GAS_API_URL;
  const proxySecret = process.env.GAS_PROXY_SECRET;
  if (!gasApiUrl || !proxySecret) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { code: "CONFIG_ERROR", message: "Apps Script API URL is not configured." },
      },
      { status: 503 },
    );
  }

  try {
    const body = await request.json() as {
      action?: string;
      data?: Record<string, unknown>;
    };
    const isPublicAction = body.action === "createNewcomer";
    const session = await auth();
    const email = session?.user.blcUser?.email;
    if (!isPublicAction && !email) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: "UNAUTHORIZED", message: "Login is required." },
        },
        { status: 401 },
      );
    }

    const response = await fetch(gasApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: body.action,
        proxySecret,
        requestUser: { email: email ?? "" },
        data: body.data ?? {},
      }),
      redirect: "follow",
      cache: "no-store",
    });
    const text = await response.text();
    return new NextResponse(text, {
      status: response.ok ? 200 : 502,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { code: "NETWORK_ERROR", message: "Apps Script API request failed." },
      },
      { status: 502 },
    );
  }
}
