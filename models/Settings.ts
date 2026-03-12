import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  uploadEnabled: boolean;
  deleteEnabled: boolean;
  selectionQuota: number;
}

const SettingsSchema = new Schema<ISettings>({
  uploadEnabled: { type: Boolean, default: true },
  deleteEnabled: { type: Boolean, default: true },
  selectionQuota: { type: Number, default: 5 },
});

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
