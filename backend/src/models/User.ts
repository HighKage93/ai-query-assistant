import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  password: string;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
