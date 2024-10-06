import { NextResponse } from "next/server";
import { query } from "@/database/query";

export async function POST(request: Request) {
  const { sql, params } = (await request.json()) as {
    sql: string;
    params?: unknown[];
  };
  try {
    const result = await query(sql, params ?? []);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Database query failed:", error);
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500 },
    );
  }
}
