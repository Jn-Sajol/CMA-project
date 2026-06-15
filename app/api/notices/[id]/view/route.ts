import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const notice = await prisma.notice.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ success: true, viewCount: notice.viewCount });
  } catch (error: any) {
    console.error("POST /api/notices/[id]/view error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
