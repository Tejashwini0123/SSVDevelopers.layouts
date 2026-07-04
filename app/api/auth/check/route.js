import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json(
        { error: "Server error: JWT secret is not configured" },
        { status: 500 }
      );
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      return NextResponse.json({
        authenticated: true,
        username: decoded.username,
      });
    } catch (e) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong: " + error.message },
      { status: 500 }
    );
  }
}
