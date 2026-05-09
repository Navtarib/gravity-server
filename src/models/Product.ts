import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  costPrice: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  stock?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  costPrice: { type: Number, required: true },
  category: { type: String, required: true },
  image: { type: String },
  isAvailable: { type: Boolean, default: true },
  stock: { type: Number, default: 0, min: 0 },
}, {
  timestamps: true,
});

export default mongoose.model<IProduct>('Product', ProductSchema);
