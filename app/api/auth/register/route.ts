import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      password,
      bloodGroup,
      profession,
      workplace,
      city,
      area,
      bio,
      helpSectors,
      customHelpSectors,
      lastDonationDate,
    } = body;

    // Validate required fields
    if (!name || !phone || !password || !bloodGroup || !profession || !workplace || !city) {
      return NextResponse.json(
        { error: "সকল প্রয়োজনীয় তথ্য দিন" },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        { error: "এই ফোন নম্বর দিয়ে আগেই নিবন্ধন করা হয়েছে" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Calculate availableAfter if lastDonationDate is provided
    let availableAfter: Date | null = null;
    if (lastDonationDate) {
      availableAfter = new Date(lastDonationDate);
      availableAfter.setDate(availableAfter.getDate() + 120);
    }

    const trimmedProfession = (profession || "").trim();
    const normalized = trimmedProfession.toUpperCase();
    const validEnums = ["DOCTOR", "ENGINEER", "LAWYER", "TEACHER", "BUSINESS", "STUDENT", "GOVERNMENT"];
    const resolvedEnum = validEnums.includes(normalized) ? (normalized as any) : "OTHER";

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        password: hashedPassword,
        bloodGroup,
        profession: resolvedEnum,
        professionCustom: trimmedProfession,
        workplace,
        city,
        area: area || null,
        bio: bio || null,
        helpSectors: helpSectors || [],
        customHelpSectors: customHelpSectors || [],
        lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : null,
        availableAfter,
        verified: true,
      },
    });

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "নিবন্ধনে সমস্যা হয়েছে। আবার চেষ্টা করুন।" },
      { status: 500 }
    );
  }
}
