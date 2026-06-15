import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role; // ADMIN, MODERATOR, MEMBER

    const post = await prisma.jobPost.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check authorization: must be author or ADMIN
    if (post.authorId !== userId && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "এই পোস্টটি ডিলিট করার পারমিশন আপনার নেই" },
        { status: 403 }
      );
    }

    await prisma.jobPost.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/jobs/[id] error:", error);
    return NextResponse.json(
      { error: "পোস্ট ডিলিট করতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}
