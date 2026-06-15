import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status || !["GOING", "NOT_GOING", "MAYBE"].includes(status)) {
      return NextResponse.json({ error: "Invalid RSVP status" }, { status: 400 });
    }

    const rsvp = await prisma.eventRSVP.upsert({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      update: {
        status,
      },
      create: {
        userId,
        eventId,
        status,
      },
    });

    return NextResponse.json(rsvp);
  } catch (error: any) {
    console.error("POST /api/events/[id]/rsvp error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
