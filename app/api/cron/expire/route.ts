import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Update expired blood requests
    const expiredBlood = await prisma.bloodRequest.updateMany({
      where: {
        expiresAt: { lt: now },
        status: "OPEN",
      },
      data: {
        status: "EXPIRED",
      },
    });

    // Update expired SOS requests
    const expiredSos = await prisma.sosRequest.updateMany({
      where: {
        expiresAt: { lt: now },
        status: "OPEN",
      },
      data: {
        status: "EXPIRED",
      },
    });

    return NextResponse.json({
      success: true,
      expiredBloodRequests: expiredBlood.count,
      expiredSosRequests: expiredSos.count,
    });
  } catch (error) {
    console.error("Expire requests cron error:", error);
    return NextResponse.json(
      { error: "Failed to expire requests" },
      { status: 500 }
    );
  }
}
