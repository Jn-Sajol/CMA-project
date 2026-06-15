import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { password, ...userWithoutPassword } = user;
    const session = await getServerSession(authOptions);

    if (!session) {
      const { phone, ...publicData } = userWithoutPassword;
      return NextResponse.json(publicData);
    }

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("GET /api/members/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch member" },
      { status: 500 }
    );
  }
}
