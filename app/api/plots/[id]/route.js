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

// PUT: Updates a plot details or moves its position
export async function PUT(request, { params }) {
  try {
    const authorized = await isAdminAuthenticated();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { plotNo, customerName, plotSize, facing, bookingDate, registrationDate, status, x, y } = body;

    // Validation
    if (!plotNo) {
      return NextResponse.json({ error: "Plot No is mandatory" }, { status: 400 });
    }
    if (!status) {
      return NextResponse.json({ error: "Plot Status is mandatory" }, { status: 400 });
    }

    await dbConnect();

    // Check if plot exists
    const plot = await Plot.findById(id);
    if (!plot) {
      return NextResponse.json({ error: "Plot not found" }, { status: 404 });
    }

    // Check unique plotNo *within the same layout* if it is changing
    if (plotNo.trim() !== plot.plotNo) {
      const existingPlot = await Plot.findOne({
        layoutId: plot.layoutId,
        plotNo: plotNo.trim(),
      });
      if (existingPlot) {
        return NextResponse.json(
          { error: `Plot number "${plotNo}" already exists in this layout.` },
          { status: 400 }
        );
      }
    }

    // Fetch the layout name to ensure it is populated/updated correctly
    const layout = await Layout.findById(plot.layoutId);
    if (!layout) {
      return NextResponse.json({ error: "Associated layout not found" }, { status: 400 });
    }

    // Update details
    plot.plotNo = plotNo.trim();
    plot.layoutName = layout.name; // Keep layoutName in sync
    plot.customerName = customerName !== undefined ? customerName : plot.customerName;
    plot.plotSize = plotSize !== undefined ? plotSize : plot.plotSize;
    plot.facing = facing !== undefined ? facing : plot.facing;
    plot.bookingDate = bookingDate !== undefined ? bookingDate : plot.bookingDate;
    plot.registrationDate = registrationDate !== undefined ? registrationDate : plot.registrationDate;
    plot.status = status;
    
    if (x !== undefined) plot.x = x;
    if (y !== undefined) plot.y = y;

    await plot.save();

    return NextResponse.json({ success: true, plot });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update plot: " + error.message },
      { status: 500 }
    );
  }
}

// DELETE: Deletes a plot marker
export async function DELETE(request, { params }) {
  try {
    const authorized = await isAdminAuthenticated();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();
    const plot = await Plot.findByIdAndDelete(id);

    if (!plot) {
      return NextResponse.json({ error: "Plot not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Plot deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete plot: " + error.message },
      { status: 500 }
    );
  }
}
