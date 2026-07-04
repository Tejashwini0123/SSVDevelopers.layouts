import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Plot from "@/lib/models/Plot";
import Layout from "@/lib/models/Layout";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

async function isAdminAuthenticated() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;
    if (!token) return false;

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return false;

    const decoded = jwt.verify(token, jwtSecret);
    return !!decoded.username;
  } catch {
    return false;
  }
}

// GET: Returns plots filtered by layoutId query param
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const layoutId = searchParams.get("layoutId");

    if (!layoutId) {
      return NextResponse.json({ error: "layoutId parameter is required" }, { status: 400 });
    }

    await dbConnect();
    const plots = await Plot.find({ layoutId }).sort({ createdAt: -1 });
    return NextResponse.json(plots);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch plots: " + error.message },
      { status: 500 }
    );
  }
}

// POST: Creates a new plot associated with a layoutId
export async function POST(request) {
  try {
    const authorized = await isAdminAuthenticated();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const { layoutId, plotNo, customerName, plotSize, facing, bookingDate, registrationDate, status, x, y } = body;

    // Validation
    if (!layoutId) {
      return NextResponse.json({ error: "Layout ID is required" }, { status: 400 });
    }
    if (!plotNo) {
      return NextResponse.json({ error: "Plot No is mandatory" }, { status: 400 });
    }
    if (!status) {
      return NextResponse.json({ error: "Plot Status is mandatory" }, { status: 400 });
    }
    if (x === undefined || y === undefined) {
      return NextResponse.json({ error: "Plot coordinates are required" }, { status: 400 });
    }

    await dbConnect();

    // Fetch the layout sheet to verify and get its name
    const layout = await Layout.findById(layoutId);
    if (!layout) {
      return NextResponse.json({ error: "Layout not found" }, { status: 400 });
    }

    // Check unique plotNo *within the same layout*
    const existingPlot = await Plot.findOne({ layoutId, plotNo: plotNo.trim() });
    if (existingPlot) {
      return NextResponse.json(
        { error: `Plot number "${plotNo}" already exists in this layout.` },
        { status: 400 }
      );
    }

    const newPlot = await Plot.create({
      layoutId,
      layoutName: layout.name,
      plotNo: plotNo.trim(),
      customerName: customerName || "",
      plotSize: plotSize || "",
      facing: facing || "",
      bookingDate: bookingDate || "",
      registrationDate: registrationDate || "",
      status,
      x,
      y,
    });

    return NextResponse.json({ success: true, plot: newPlot }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create plot: " + error.message },
      { status: 500 }
    );
  }
}
