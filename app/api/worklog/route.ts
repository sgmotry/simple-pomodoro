import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";

// 作業ログの取得 (月ごとの集計などをフロントで行うため、全件または期間指定で返します)
export async function GET() {
  try {
    const logs = await prisma.workLog.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 },
    );
  }
}

// 作業ログの保存
export async function POST(request: Request) {
  try {
    const { duration } = await request.json();

    if (!duration || typeof duration !== "number") {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
    }

    const newLog = await prisma.workLog.create({
      data: {
        duration: duration,
        date: new Date(),
      },
    });

    return NextResponse.json(newLog);
  } catch (error) {
    return NextResponse.json({ error: "Failed to save log" }, { status: 500 });
  }
}
