// app/api/db-test/route.ts

import { db } from "@/lib/prisma";

export async function GET() {
  try {
    await db.$runCommandRaw({ ping: 1 });

    return Response.json({
      success: true,
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: String(error),
    });
  }
}
