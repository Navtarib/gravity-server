import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  shopName: { type: String, default: 'POS System' },
  shopAddress: { type: String, default: '123 Main St, City' },
  shopPhone: { type: String, default: '000-000-0000' },
  shopLogo: { type: String, default: '' },
  currency: { type: String, default: '$' },
  taxRate: { type: Number, default: 0 }, // 0% GST
  showTaxOnReceipt: { type: Boolean, default: true },
  receiptHeader: { type: String, default: 'Welcome to our store' },
  receiptFooter: { type: String, default: 'Thank you for your visit!' },
  allowOrderSound: { type: Boolean, default: true },
  paperSize: { type: String, enum: ['58mm', '80mm'], default: '58mm' },
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
