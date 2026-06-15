import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const pinned = searchParams.get("pinned");

    const where: Record<string, unknown> = {};

    if (pinned === "true") {
      where.pinned = true;
    }

    const notices = await prisma.notice.findMany({
      where,
      include: {
        author: {
          select: { name: true },
        },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(notices);
  } catch (error) {
    console.error("GET /api/notices error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notices" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (userRole !== "ADMIN" && userRole !== "MODERATOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, body: noticeBody, postType, imageUrl, pinned } = body;

    if (!title || !noticeBody) {
      return NextResponse.json(
        { error: "title and body are required" },
        { status: 400 }
      );
    }

    const notice = await prisma.notice.create({
      data: {
        title,
        body: noticeBody,
        postType: postType || null,
        imageUrl: imageUrl || null,
        pinned: !!pinned,
        authorId: userId,
      },
    });

    // Notify all members in the background
    (async () => {
      try {
        const users = await prisma.user.findMany({
          where: {
            id: { not: userId },
            fcmToken: { not: null },
          },
          select: { fcmToken: true },
        });

        const tokens = users
          .map((u) => u.fcmToken)
          .filter((t) => t && t.trim() !== "") as string[];

        if (tokens.length > 0) {
          await sendNotification(
            tokens,
            "📢 নতুন বিজ্ঞপ্তি",
            title,
            "normal"
          );
        }
      } catch (fcmErr) {
        console.error("Notice FCM dispatch error:", fcmErr);
      }
    })();

    return NextResponse.json(notice, { status: 201 });
  } catch (error) {
    console.error("POST /api/notices error:", error);
    return NextResponse.json(
      { error: "Failed to create notice" },
      { status: 500 }
    );
  }
}
