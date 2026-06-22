import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const posts = await prisma.jobPost.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
            profession: true,
            professionCustom: true,
            phone: true,
            whatsappLink: true,
          },
        },
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("GET /api/jobs error:", error);
    return NextResponse.json(
      { error: "পোস্টগুলো লোড করতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    const { category, title, description, profession } = body;

    if (!category || !title || !description) {
      return NextResponse.json(
        { error: "ক্যাটাগরি, শিরোনাম এবং বিবরণ আবশ্যক" },
        { status: 400 }
      );
    }

    if (description.length > 500) {
      return NextResponse.json(
        { error: "বিবরণ ৫০০ অক্ষরের বেশি হতে পারবে না" },
        { status: 400 }
      );
    }

    // Map profession custom string input or enum
    let professionEnum: any = null;
    if (profession) {
      const normalized = profession.toUpperCase().trim();
      const validEnums = [
        "DOCTOR",
        "ENGINEER",
        "LAWYER",
        "TEACHER",
        "BUSINESS",
        "STUDENT",
        "GOVERNMENT",
        "OTHER",
      ];
      professionEnum = validEnums.includes(normalized) ? normalized : "OTHER";
    }

    // Validate category enum
    const validCategories = ["JOB_REFERRAL", "PROFESSIONAL_HELP", "GENERAL"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "অকার্যকর ক্যাটাগরি" },
        { status: 400 }
      );
    }

    const newPost = await prisma.jobPost.create({
      data: {
        category: category as any,
        title,
        description,
        profession: professionEnum,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
            profession: true,
            professionCustom: true,
            phone: true,
            whatsappLink: true,
          },
        },
      },
    });

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error("POST /api/jobs error:", error);
    return NextResponse.json(
      { error: "পোস্ট তৈরি করতে সমস্যা হয়েছে" },
      { status: 500 }
    );
  }
}
