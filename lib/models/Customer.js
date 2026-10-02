import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    layoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Layout",
      required: false,
    },
    layoutName: {
      type: String,
      trim: true,
      default: "",
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBooking: {
      type: String,
      trim: true,
      default: "",
    },
    plotNo: {
      type: String,
      required: true,
      trim: true,
    },
    sqYards: {
      type: Number,
      required: true,
      default: 0,
    },
    sqYardCost: {
      type: Number,
      required: true,
      default: 0,
    },
    facing: {
      type: String,
      trim: true,
      default: "",
    },
    facingCharges: {
      type: Number,
      default: 0,
    },
    totalPlotCost: {
      type: Number,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    balanceAmount: {
      type: Number,
      default: 0,
    },
    tlName: {
      type: String,
      trim: true,
      default: "",
    },
    clearedDate: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Pre-save hook to calculate totalPlotCost, balanceAmount, and freeze clearedDate when balance becomes 0
customerSchema.pre("save", function () {
  const sqYards = Number(this.sqYards) || 0;
  const sqYardCost = Number(this.sqYardCost) || 0;
  const facingCharges = Number(this.facingCharges) || 0;
  const paidAmount = Number(this.paidAmount) || 0;

  this.totalPlotCost = Math.round((sqYardCost + facingCharges) * sqYards);
  this.balanceAmount = Math.round(this.totalPlotCost - paidAmount);

  if (this.balanceAmount <= 0) {
    if (!this.clearedDate) {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      this.clearedDate = this.dateOfBooking || todayStr;
    }
  } else {
    this.clearedDate = "";
  }
});

const Customer = mongoose.models.Customer || mongoose.model("Customer", customerSchema);

export default Customer;
