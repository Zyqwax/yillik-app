import mongoose, { Schema, Document } from 'mongoose';

export interface IPhoto extends Document {
  url: string;
  caption?: string;
  userId: mongoose.Types.ObjectId;
  voteCount: number;
  isAnonymous?: boolean;
  isHidden?: boolean;
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
  },
  { timestamps: true }
);

// Indexes for query optimization
PhotoSchema.index({ userId: 1, createdAt: -1 });
PhotoSchema.index({ isHidden: 1, voteCount: -1 });
PhotoSchema.index({ isHidden: 1, createdAt: -1 });

export default mongoose.models.Photo || mongoose.model<IPhoto>('Photo', PhotoSchema);
