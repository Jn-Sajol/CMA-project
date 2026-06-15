import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/firebase-admin";

const formatBloodGroup = (bg: string) => {
  const map: Record<string, string> = {
    A_POS: "A+", A_NEG: "A-", B_POS: "B+", B_NEG: "B-",
    O_POS: "O+", O_NEG: "O-", AB_POS: "AB+", AB_NEG: "AB-",
  };
  return map[bg] || bg;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status") || "OPEN";

    const where: Record<string, unknown> = { status };

    if (status === "OPEN") {
      where.expiresAt = { gt: new Date() };
    }

    const bloodRequests = await prisma.bloodRequest.findMany({
      where,
      include: {
        requester: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bloodRequests);
  } catch (error) {
    console.error("GET /api/blood error:", error);
    return NextResponse.json(
      { error: "Failed to fetch blood requests" },
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
    const { bloodGroup, hospital, contactNumber, urgency, patientGender, patientAge, note } = body;

    if (!bloodGroup || !hospital || !contactNumber || !urgency) {
      return NextResponse.json(
        { error: "bloodGroup, hospital, contactNumber, and urgency are required" },
        { status: 400 }
      );
    }

    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    const bloodRequest = await prisma.bloodRequest.create({
      data: {
        bloodGroup,
        hospital,
        contactNumber,
        urgency,
        patientGender: patientGender || null,
        patientAge: patientAge ? Number(patientAge) : null,
        note: note || null,
        expiresAt,
        requesterId: userId,
      },
    });

    // Run FCM Notifications in the background/non-blocking
    (async () => {
      try {
        const requesterUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { city: true },
        });
        const city = requesterUser?.city || "";

        const users = await prisma.user.findMany({
          where: {
            id: { not: userId },
            fcmToken: { not: null },
          },
          select: {
            bloodGroup: true,
            fcmToken: true,
          },
        });

        // Filter valid non-empty tokens
        const matchingTokens = users
          .filter((u) => u.bloodGroup === bloodGroup && u.fcmToken && u.fcmToken.trim() !== "")
          .map((u) => u.fcmToken) as string[];

        const nonMatchingTokens = users
          .filter((u) => u.bloodGroup !== bloodGroup && u.fcmToken && u.fcmToken.trim() !== "")
          .map((u) => u.fcmToken) as string[];

        const bgLabel = formatBloodGroup(bloodGroup);

        if (matchingTokens.length > 0) {
          await sendNotification(
            matchingTokens,
            "🚨 জরুরি রক্ত দরকার!",
            `${bgLabel} রক্ত দরকার — ${hospital}, ${city}. যোগাযোগ: ${contactNumber}`,
            "high"
          );
        }

        if (nonMatchingTokens.length > 0) {
          await sendNotification(
            nonMatchingTokens,
            "রক্তের অনুরোধ",
            `${bgLabel} রক্ত দরকার — ${hospital}`,
            "normal"
          );
        }
      } catch (fcmErr) {
        console.error("FCM dispatch error:", fcmErr);
      }
    })();

    return NextResponse.json(bloodRequest, { status: 201 });
  } catch (error) {
    console.error("POST /api/blood error:", error);
    return NextResponse.json(
      { error: "Failed to create blood request" },
      { status: 500 }
    );
  }
}
