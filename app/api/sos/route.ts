import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/firebase-admin";

const SOS_TYPE_MAP: Record<string, string> = {
  MEDICAL: "চিকিৎসা",
  BLOOD: "রক্ত",
  FINANCIAL: "আর্থিক",
  TRANSPORT: "পরিবহন",
  LEGAL: "আইনি",
  OTHER: "অন্যান্য",
};

const formatSosType = (type: string) => SOS_TYPE_MAP[type] || type;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status") || "OPEN";

    const where: Record<string, unknown> = { status };

    if (status === "OPEN") {
      where.expiresAt = { gt: new Date() };
    }

    const sosRequests = await prisma.sosRequest.findMany({
      where,
      include: {
        requester: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sosRequests);
  } catch (error) {
    console.error("GET /api/sos error:", error);
    return NextResponse.json(
      { error: "Failed to fetch SOS requests" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { sosType, description, city, contactNumber } = body;

    if (!sosType || !description || !city || !contactNumber) {
      return NextResponse.json(
        { error: "sosType, description, city, and contactNumber are required" },
        { status: 400 }
      );
    }

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const sosRequest = await prisma.sosRequest.create({
      data: {
        sosType,
        description,
        city,
        contactNumber,
        expiresAt,
        requesterId: userId,
      },
    });

    // Run FCM Notifications
    (async () => {
      try {
        const displaySosType = formatSosType(sosType);

        // Immediate: same city (excluding sender)
        const sameCityUsers = await prisma.user.findMany({
          where: {
            id: { not: userId },
            city: city,
            fcmToken: { not: null },
          },
          select: { fcmToken: true },
        });

        const sameCityTokens = sameCityUsers
          .map((u) => u.fcmToken)
          .filter((t) => t && t.trim() !== "") as string[];

        if (sameCityTokens.length > 0) {
          await sendNotification(
            sameCityTokens,
            "🆘 জরুরি সাহায্য দরকার!",
            `${displaySosType} — ${description} (${city})`,
            "high"
          );
        }

        // Delayed: other cities (excluding same city/sender) after 5 minutes
        setTimeout(async () => {
          try {
            const otherUsers = await prisma.user.findMany({
              where: {
                id: { not: userId },
                city: { not: city },
                fcmToken: { not: null },
              },
              select: { fcmToken: true },
            });

            const otherTokens = otherUsers
              .map((u) => u.fcmToken)
              .filter((t) => t && t.trim() !== "") as string[];

            if (otherTokens.length > 0) {
              await sendNotification(
                otherTokens,
                "🆘 জরুরি সাহায্য দরকার!",
                `${displaySosType} — ${description} (${city})`,
                "normal"
              );
            }
          } catch (err) {
            console.error("Delayed SOS FCM dispatch error:", err);
          }
        }, 5 * 60 * 1000);

      } catch (fcmErr) {
        console.error("SOS FCM dispatch error:", fcmErr);
      }
    })();

    return NextResponse.json(sosRequest, { status: 201 });
  } catch (error) {
    console.error("POST /api/sos error:", error);
    return NextResponse.json(
      { error: "Failed to create SOS request" },
      { status: 500 }
    );
  }
}
