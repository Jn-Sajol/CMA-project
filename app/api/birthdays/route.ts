import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Current date in Bangladesh (UTC+6)
    const bdTime = new Date(Date.now() + 6 * 60 * 60 * 1000);
    const targetMonth = bdTime.getUTCMonth(); // 0-11

    const users = await prisma.user.findMany({
      where: {
        birthdate: { not: null },
      },
      select: {
        id: true,
        name: true,
        photoUrl: true,
        birthdate: true,
        phone: true,
        whatsappLink: true,
        professionCustom: true,
        profession: true,
      },
    });

    // Filter by current month in Bangladesh timezone
    const currentMonthBirthdays = users.filter((u) => {
      const d = new Date(u.birthdate!);
      return d.getUTCMonth() === targetMonth;
    });

    // Sort by day of month ascending
    currentMonthBirthdays.sort((a, b) => {
      const dayA = new Date(a.birthdate!).getUTCDate();
      const dayB = new Date(b.birthdate!).getUTCDate();
      return dayA - dayB;
    });

    return NextResponse.json(currentMonthBirthdays);
  } catch (error) {
    console.error("GET /api/birthdays error:", error);
    return NextResponse.json(
      { error: "জন্মদিনের তালিকা লোড করতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}
