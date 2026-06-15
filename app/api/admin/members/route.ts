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

    const members = await prisma.user.findMany({
      orderBy: [
        { verified: "asc" }, // False (unverified) first, then True (verified)
        { createdAt: "desc" },
      ],
    });

    const membersWithoutPassword = members.map((m) => {
      const { password, ...rest } = m;
      return rest;
    });

    return NextResponse.json(membersWithoutPassword);
  } catch (error: any) {
    console.error("GET /api/admin/members error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
