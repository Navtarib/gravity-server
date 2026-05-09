import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface IOrder extends Document {
  userId?: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  tableNumber?: string;
  billNo: string;
  token: number;
  items: IOrderItem[];
  totalAmount: number;
  gstAmount: number;
  netAmount: number;
  totalCost: number;
  profit: number;
  status: 'pending' | 'accepted' | 'completed' | 'rejected' | 'cancelled';
  showTax: boolean;
  statusMessage?: string;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String },
});

const OrderSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  customerAddress: { type: String },
  tableNumber: { type: String },
  billNo: { type: String, required: true },
  token: { type: Number, required: true },
  items: [OrderItemSchema],
  totalAmount: { type: Number, required: true },
  gstAmount: { type: Number, required: true },
  netAmount: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  profit: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'completed', 'rejected', 'cancelled'], 
    default: 'pending' 
  },
  showTax: { type: Boolean, default: false },
  statusMessage: { type: String },
  cancelReason: { type: String },
}, {
  timestamps: true,
});

export default mongoose.model<IOrder>('Order', OrderSchema);
