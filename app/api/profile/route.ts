import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  // Exclude password from response
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

  const updateData: any = { ...body };

  if (body.profession !== undefined) {
    const trimmedProfession = (body.profession || "").trim();
    const normalized = trimmedProfession.toUpperCase();
    const validEnums = ["DOCTOR", "ENGINEER", "LAWYER", "TEACHER", "BUSINESS", "STUDENT", "GOVERNMENT"];
    updateData.profession = validEnums.includes(normalized) ? normalized : "OTHER";
    updateData.professionCustom = trimmedProfession;
  }
  if (body.lastDonationDate !== undefined) {
    if (body.lastDonationDate) {
      const donationDate = new Date(body.lastDonationDate);
      const availableAfter = new Date(donationDate);
      availableAfter.setDate(availableAfter.getDate() + 120);
      updateData.lastDonationDate = donationDate;
      updateData.availableAfter = availableAfter;
    } else {
      updateData.lastDonationDate = null;
      updateData.availableAfter = null;
    }
  }

  // Never allow updating password or role through this endpoint
  delete updateData.password;
  delete updateData.role;
  delete updateData.id;
  delete updateData.phone;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "প্রোফাইল আপডেটে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}
