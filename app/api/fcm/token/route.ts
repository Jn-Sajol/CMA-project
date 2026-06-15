import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();

    if (token === undefined) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: token || null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/fcm/token error:", error);
    return NextResponse.json(
      { error: "Failed to update FCM token" },
      { status: 500 }
    );
  }
}
