import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transactions = await prisma.fundTransaction.findMany({
      include: {
        member: { select: { name: true } },
        creator: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const aggregateCredits = await prisma.fundTransaction.aggregate({
      where: { type: "CREDIT" },
      _sum: { amount: true },
    });

    const aggregateDebits = await prisma.fundTransaction.aggregate({
      where: { type: "DEBIT" },
      _sum: { amount: true },
    });

    const totalCollected = aggregateCredits._sum.amount || 0;
    const totalSpent = aggregateDebits._sum.amount || 0;
    const balance = totalCollected - totalSpent;

    return NextResponse.json({
      totalCollected,
      totalSpent,
      balance,
      transactions,
    });
  } catch (error: any) {
    console.error("GET /api/fund error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { type, amount, note, memberId } = body;

    if (!type || !amount) {
      return NextResponse.json({ error: "type and amount are required" }, { status: 400 });
    }

    if (!["CREDIT", "DEBIT"].includes(type)) {
      return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
    }

    const transaction = await prisma.fundTransaction.create({
      data: {
        type,
        amount: parseFloat(amount),
        note: note || null,
        memberId: type === "CREDIT" ? memberId || null : null,
        createdBy: userId,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/fund error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
