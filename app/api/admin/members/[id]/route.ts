import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { verified, role: newRole } = body;

    const data: any = {};
    if (verified !== undefined) {
      data.verified = !!verified;
    }
    if (newRole !== undefined) {
      if (!["ADMIN", "MODERATOR", "MEMBER"].includes(newRole)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      data.role = newRole;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });

    const { password, ...rest } = updatedUser;
    return NextResponse.json(rest);
  } catch (error: any) {
    console.error("PATCH /api/admin/members/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Execute deletion of all dependent records before deleting the user
    await prisma.$transaction([
      prisma.bloodRequest.deleteMany({ where: { requesterId: id } }),
      prisma.sosRequest.deleteMany({ where: { requesterId: id } }),
      prisma.notice.deleteMany({ where: { authorId: id } }),
      prisma.jobPost.deleteMany({ where: { authorId: id } }),
      prisma.eventRSVP.deleteMany({ where: { userId: id } }),
      prisma.event.deleteMany({ where: { authorId: id } }),
      prisma.fundTransaction.deleteMany({ where: { memberId: id } }),
      prisma.fundTransaction.deleteMany({ where: { createdBy: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/admin/members/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
