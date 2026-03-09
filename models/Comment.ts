import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  text: string;
  userId: mongoose.Types.ObjectId;
  photoId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    text: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    photoId: { type: Schema.Types.ObjectId, ref: 'Photo', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
