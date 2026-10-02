import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Customer from "@/lib/models/Customer";
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

// GET: Returns customers (filtered by layoutId if provided, or all)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const layoutId = searchParams.get("layoutId");

    await dbConnect();

    const query = {};
    if (layoutId && layoutId !== "all") {
      query.layoutId = layoutId;
    }

    // FCFS order: First Come (Date of Booking) First Served (earliest booking is Sl.No 1)
    const customers = await Customer.find(query);
    customers.sort((a, b) => {
      const dateA = a.dateOfBooking?.trim();
      const dateB = b.dateOfBooking?.trim();
      if (dateA && dateB && dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch customers: " + error.message },
      { status: 500 }
    );
  }
}

// POST: Creates a new customer record
export async function POST(request) {
  try {
    const authorized = await isAdminAuthenticated();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerName,
      dateOfBooking,
      plotNo,
      sqYards,
      sqYardCost,
      facing,
      facingCharges,
      paidAmount,
      tlName,
      layoutId,
    } = body;

    if (!customerName?.trim()) {
      return NextResponse.json({ error: "Customer Name is mandatory." }, { status: 400 });
    }
    if (!plotNo?.trim()) {
      return NextResponse.json({ error: "Plot No is mandatory." }, { status: 400 });
    }

    const parsedSqYards = Number(sqYards) || 0;
    const parsedSqYardCost = Number(sqYardCost) || 0;
    const parsedFacingCharges = Number(facingCharges) || 0;
    const parsedPaidAmount = Number(paidAmount) || 0;

    const calculatedTotalPlotCost = Math.round((parsedSqYardCost + parsedFacingCharges) * parsedSqYards);
    const calculatedBalanceAmount = Math.round(calculatedTotalPlotCost - parsedPaidAmount);

    let clearedDate = "";
    if (calculatedBalanceAmount <= 0) {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      clearedDate = dateOfBooking || todayStr;
    }

    await dbConnect();

    let layoutName = "";
    if (layoutId) {
      const layout = await Layout.findById(layoutId);
      if (layout) {
        layoutName = layout.name;
      }
    }

    const newCustomer = await Customer.create({
      layoutId: layoutId || null,
      layoutName,
      customerName: customerName.trim(),
      dateOfBooking: dateOfBooking || "",
      plotNo: plotNo.trim(),
      sqYards: parsedSqYards,
      sqYardCost: parsedSqYardCost,
      facing: facing?.trim() || "",
      facingCharges: parsedFacingCharges,
      totalPlotCost: calculatedTotalPlotCost,
      paidAmount: parsedPaidAmount,
      balanceAmount: calculatedBalanceAmount,
      tlName: tlName?.trim() || "",
      clearedDate,
    });

    return NextResponse.json({ success: true, customer: newCustomer }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create customer: " + error.message },
      { status: 500 }
    );
  }
}
