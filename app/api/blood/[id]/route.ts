import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    // Verify the blood request exists and belongs to the user
    const bloodRequest = await prisma.bloodRequest.findUnique({
      where: { id },
    });

    if (!bloodRequest) {
      return NextResponse.json({ error: "Blood request not found" }, { status: 404 });
    }

    if (bloodRequest.requesterId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.bloodRequest.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/blood/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update blood request" },
      { status: 500 }
    );
  }
}
