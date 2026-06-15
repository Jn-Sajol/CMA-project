import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const bloodGroup = searchParams.get("bloodGroup");
    const profession = searchParams.get("profession");
    const city = searchParams.get("city");
    const helpSector = searchParams.get("helpSector");
    const availableOnly = searchParams.get("availableOnly") === "true";
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (bloodGroup) {
      where.bloodGroup = bloodGroup;
    }

    if (profession) {
      where.professionCustom = {
        contains: profession,
        mode: "insensitive",
      };
    }

    if (city) {
      where.city = city;
    }

    if (helpSector) {
      where.helpSectors = { has: helpSector };
    }

    if (availableOnly) {
      where.OR = [
        { availableAfter: null },
        { availableAfter: { lt: new Date() } },
      ];
    }

    if (search) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { workplace: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    const users = await prisma.user.findMany({
      where,
    });

    const usersWithoutPassword = users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return NextResponse.json(usersWithoutPassword);
  } catch (error) {
    console.error("GET /api/members error:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
