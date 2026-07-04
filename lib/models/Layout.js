import mongoose from "mongoose";

const layoutSchema = new mongoose.Schema(
  {
    image: {
      type: String, // Store layout image as Base64 Data URL
      required: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Prevent mongoose from compiling the model multiple times during Next.js hot reloads
const Layout = mongoose.models.Layout || mongoose.model("Layout", layoutSchema);

export default Layout;
