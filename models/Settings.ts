import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  uploadEnabled: boolean;
  deleteEnabled: boolean;
}

const SettingsSchema = new Schema<ISettings>({
  uploadEnabled: { type: Boolean, default: true },
  deleteEnabled: { type: Boolean, default: true },
});

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
