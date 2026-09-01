import mongoose, { Schema, Document } from 'mongoose';

export interface ICA extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  createdAt: Date;
}

const CASchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ICA>('CA', CASchema);