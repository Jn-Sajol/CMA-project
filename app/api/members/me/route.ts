import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { password, ...userWithoutPassword } = user;
  return NextResponse.json(userWithoutPassword);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json();

  const updateData: any = {};

  // Extract fields safely
  if (body.name !== undefined) updateData.name = body.name;
  if (body.photoUrl !== undefined) updateData.photoUrl = body.photoUrl;
  if (body.bloodGroup !== undefined) updateData.bloodGroup = body.bloodGroup;
  if (body.city !== undefined) updateData.city = body.city;
  if (body.area !== undefined) updateData.area = body.area;
  if (body.workplace !== undefined) updateData.workplace = body.workplace;
  if (body.bio !== undefined) updateData.bio = body.bio ? body.bio.substring(0, 300) : "";
  if (body.helpSectors !== undefined) updateData.helpSectors = body.helpSectors;
  if (body.customHelpSectors !== undefined) updateData.customHelpSectors = body.customHelpSectors;
  if (body.whatsappLink !== undefined) updateData.whatsappLink = body.whatsappLink;

  // Profession parsing matching the original schema & component expectations
  if (body.profession !== undefined) {
    const trimmedProfession = (body.profession || "").trim();
    const normalized = trimmedProfession.toUpperCase();
    const validEnums = ["DOCTOR", "ENGINEER", "LAWYER", "TEACHER", "BUSINESS", "STUDENT", "GOVERNMENT"];
    updateData.profession = validEnums.includes(normalized) ? normalized : "OTHER";
    updateData.professionCustom = trimmedProfession;
  }

  // Birthdate parsing
  if (body.birthdate !== undefined) {
    updateData.birthdate = body.birthdate ? new Date(body.birthdate) : null;
  }

  // Last Donation Date and Availability calculation
  if (body.lastDonationDate !== undefined) {
    if (body.lastDonationDate) {
      const donationDate = new Date(body.lastDonationDate);
      const availableAfter = new Date(donationDate);
      availableAfter.setDate(availableAfter.getDate() + 120); // 4 months (120 days)
      updateData.lastDonationDate = donationDate;
      updateData.availableAfter = availableAfter;
    } else {
      updateData.lastDonationDate = null;
      updateData.availableAfter = null;
    }
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("PATCH /api/members/me error:", error);
    return NextResponse.json(
      { error: "প্রোফাইল আপডেটে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}
