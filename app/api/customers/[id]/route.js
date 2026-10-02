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

// PUT: Update customer details
export async function PUT(request, { params }) {
  try {
    const authorized = await isAdminAuthenticated();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
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

    await dbConnect();

    const customer = await Customer.findById(id);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    const parsedSqYards = Number(sqYards) || 0;
    const parsedSqYardCost = Number(sqYardCost) || 0;
    const parsedFacingCharges = Number(facingCharges) || 0;
    const parsedPaidAmount = Number(paidAmount) || 0;

    const calculatedTotalPlotCost = Math.round((parsedSqYardCost + parsedFacingCharges) * parsedSqYards);
    const calculatedBalanceAmount = Math.round(calculatedTotalPlotCost - parsedPaidAmount);

    customer.customerName = customerName.trim();
    customer.dateOfBooking = dateOfBooking !== undefined ? dateOfBooking : customer.dateOfBooking;
    customer.plotNo = plotNo.trim();
    customer.sqYards = parsedSqYards;
    customer.sqYardCost = parsedSqYardCost;
    customer.facing = facing !== undefined ? facing.trim() : customer.facing;
    customer.facingCharges = parsedFacingCharges;
    customer.totalPlotCost = calculatedTotalPlotCost;
    customer.paidAmount = parsedPaidAmount;
    customer.balanceAmount = calculatedBalanceAmount;
    customer.tlName = tlName !== undefined ? tlName.trim() : customer.tlName;

    if (calculatedBalanceAmount <= 0) {
      if (!customer.clearedDate) {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        customer.clearedDate = customer.dateOfBooking === todayStr ? customer.dateOfBooking : todayStr;
      }
    } else {
      customer.clearedDate = "";
    }

    if (layoutId) {
      customer.layoutId = layoutId;
      const layout = await Layout.findById(layoutId);
      if (layout) {
        customer.layoutName = layout.name;
      }
    }

    await customer.save();

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update customer: " + error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete customer record
export async function DELETE(request, { params }) {
  try {
    const authorized = await isAdminAuthenticated();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();
    const customer = await Customer.findByIdAndDelete(id);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete customer: " + error.message },
      { status: 500 }
    );
  }
}
