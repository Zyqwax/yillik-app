import mongoose, { Schema, Document } from 'mongoose';

export interface IPhoto extends Document {
  url: string;
  caption?: string;
  userId: mongoose.Types.ObjectId;
  voteCount: number;
  isAnonymous?: boolean;
  isHidden?: boolean;
  isAdminFavorite?: boolean;
  selectedBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const PhotoSchema = new Schema<IPhoto>(
  {
    url: { type: String, required: true },
    caption: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    voteCount: { type: Number, default: 0 },
    isAnonymous: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    isAdminFavorite: { type: Boolean, default: false },
    selectedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Photo || mongoose.model<IPhoto>('Photo', PhotoSchema);
