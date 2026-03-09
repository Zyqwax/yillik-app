import mongoose, { Schema, Document } from 'mongoose';

export interface IVote extends Document {
  userId: mongoose.Types.ObjectId;
  photoId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const VoteSchema = new Schema<IVote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    photoId: { type: Schema.Types.ObjectId, ref: 'Photo', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Ensure a user can only vote once for a photo
VoteSchema.index({ userId: 1, photoId: 1 }, { unique: true });

export default mongoose.models.Vote || mongoose.model<IVote>('Vote', VoteSchema);
