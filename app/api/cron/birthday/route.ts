import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendNotification } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Current date in Bangladesh (UTC+6)
    const bdTime = new Date(Date.now() + 6 * 60 * 60 * 1000);
    const targetMonth = bdTime.getUTCMonth(); // 0-11
    const targetDay = bdTime.getUTCDate(); // 1-31

    // Fetch all users with birthdate configured
    const users = await prisma.user.findMany({
      where: {
        birthdate: { not: null },
      },
      select: {
        id: true,
        name: true,
        birthdate: true,
        fcmToken: true,
      },
    });

    // Find birthday users matching today in UTC+6
    const birthdayUsers = users.filter((u) => {
      const d = new Date(u.birthdate!);
      return d.getUTCMonth() === targetMonth && d.getUTCDate() === targetDay;
    });

    if (birthdayUsers.length === 0) {
      return NextResponse.json({ message: "No birthdays today" });
    }

    // Fetch all users with FCM tokens to notify
    const allUsersWithToken = await prisma.user.findMany({
      where: {
        fcmToken: { not: null },
      },
      select: {
        id: true,
        fcmToken: true,
      },
    });

    for (const bUser of birthdayUsers) {
      // Notify everyone else about this user's birthday
      const otherTokens = allUsersWithToken
        .filter((u) => u.id !== bUser.id)
        .map((u) => u.fcmToken)
        .filter((t) => t && t.trim() !== "") as string[];

      if (otherTokens.length > 0) {
        await sendNotification(
          otherTokens,
          "🎂 জন্মদিন!",
          `🎂 আজ ${bUser.name} এর জন্মদিন — শুভেচ্ছা জানান!`,
          "normal"
        );
      }

      // Send special notification to the birthday person
      if (bUser.fcmToken && bUser.fcmToken.trim() !== "") {
        await sendNotification(
          [bUser.fcmToken],
          "🎉 শুভ জন্মদিন!",
          `🎉 জন্মদিনের শুভেচ্ছা ${bUser.name}! আপনার গ্রুপের সবাই আপনাকে ভালোবাসে।`,
          "high"
        );
      }
    }

    return NextResponse.json({ success: true, count: birthdayUsers.length });
  } catch (error) {
    console.error("Birthday cron error:", error);
    return NextResponse.json(
      { error: "Failed to process birthdays" },
      { status: 500 }
    );
  }
}
