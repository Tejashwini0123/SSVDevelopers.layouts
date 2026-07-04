import mongoose from "mongoose";

const plotSchema = new mongoose.Schema(
  {
    layoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Layout",
      required: true,
    },
    layoutName: {
      type: String,
      required: true,
    },
    plotNo: {
      type: String,
      required: true,
      trim: true,
    },
    customerName: {
      type: String,
      trim: true,
      default: "",
    },
    plotSize: {
      type: String,
      trim: true,
      default: "",
    },
    facing: {
      type: String,
      trim: true,
      default: "",
    },
    bookingDate: {
      type: String,
      trim: true,
      default: "",
    },
    registrationDate: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      required: true,
      enum: ["Available", "Registered", "Booked"],
      default: "Available",
    },
    x: {
      type: Number,
      required: true, // X position in percentage (0 to 100)
    },
    y: {
      type: Number,
      required: true, // Y position in percentage (0 to 100)
    },
  },
  { timestamps: true }
);

// Enforce unique plotNo per layout
plotSchema.index({ layoutId: 1, plotNo: 1 }, { unique: true });

const Plot = mongoose.models.Plot || mongoose.model("Plot", plotSchema);

export default Plot;
