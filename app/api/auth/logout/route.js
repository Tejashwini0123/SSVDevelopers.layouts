import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong: " + error.message },
      { status: 500 }
    );
  }
}
