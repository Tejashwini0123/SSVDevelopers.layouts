import mongoose from "mongoose";

const regCustomerSchema = new mongoose.Schema(
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
    sNo: {
      type: String,
      trim: true,
      default: "",
    },
    customerName: {
      type: String,
      trim: true,
      default: "",
    },
    plotNo: {
      type: String,
      trim: true,
      default: "",
    },
    sqYards: {
      type: String,
      trim: true,
      default: "",
    },
    facing: {
      type: String,
      trim: true,
      default: "",
    },
    regDate: {
      type: String,
      trim: true,
      default: "",
    },
    documentNo: {
      type: String,
      trim: true,
      default: "",
    },
    tlName: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

const RegCustomer =
  mongoose.models.RegCustomer || mongoose.model("RegCustomer", regCustomerSchema);

export default RegCustomer;
