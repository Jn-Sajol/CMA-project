import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = await prisma.event.findMany({
      where: {
        date: {
          gte: today,
        },
      },
      include: {
        rsvps: true,
        author: {
          select: { name: true },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    const formattedEvents = events.map((event) => {
      const goingCount = event.rsvps.filter((r) => r.status === "GOING").length;
      const notGoingCount = event.rsvps.filter((r) => r.status === "NOT_GOING").length;
      const maybeCount = event.rsvps.filter((r) => r.status === "MAYBE").length;

      const userRsvp = event.rsvps.find((r) => r.userId === userId);
      const currentUserStatus = userRsvp ? userRsvp.status : null;

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        location: event.location,
        createdAt: event.createdAt,
        authorName: event.author.name,
        goingCount,
        notGoingCount,
        maybeCount,
        currentUserStatus,
      };
    });

    return NextResponse.json(formattedEvents);
  } catch (error: any) {
    console.error("GET /api/events error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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
    const { title, description, date, location } = body;

    if (!title || !date || !location) {
      return NextResponse.json(
        { error: "title, date, and location are required" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        date: new Date(date),
        location,
        authorId: userId,
      },
    });

    // Notify all members in the background using FCM
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
            `📅 নতুন ইভেন্ট: ${title}`,
            description || "নতুন ইভেন্টে RSVP করুন!",
            "high"
          );
        }
      } catch (fcmErr) {
        console.error("Event FCM dispatch error:", fcmErr);
      }
    })();

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/events error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
