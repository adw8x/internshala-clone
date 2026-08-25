import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: String,
  Experience: String,
  category: String,
  aboutCompany: String,
  aboutJob: String,
  whoCanApply: String,
  perks: Array,
  numberOfOpening: String,
  AdditionalInfo: String,
  CTC: String,
  StartDate: String,
  createAt: { type: Date, default: Date.now },
});

export default mongoose.models.Job || mongoose.model("Job", jobSchema);
