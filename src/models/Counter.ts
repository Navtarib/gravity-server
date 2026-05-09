import mongoose, { Schema, Document } from 'mongoose';

export interface ICounter extends Document {
  name: string;
  count: number;
  lastResetDate?: Date;
}

const CounterSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  lastResetDate: { type: Date },
});

export default mongoose.model<ICounter>('Counter', CounterSchema);
