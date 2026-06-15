import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [totalMembers, openBloodRequests, activeSosRequests, totalNotices] = await Promise.all([
      prisma.user.count(),
      prisma.bloodRequest.count({ where: { status: "OPEN" } }),
      prisma.sosRequest.count({ where: { status: "OPEN" } }),
      prisma.notice.count(),
    ]);

    return NextResponse.json({
      totalMembers,
      openBloodRequests,
      activeSosRequests,
      totalNotices,
    });
  } catch (error: any) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
