import mongoose, { Document } from 'mongoose';
import type { IUser } from '@ai-outreach/shared';
export interface UserDocument extends Omit<IUser, '_id'>, Document {
}
export declare const User: mongoose.Model<UserDocument, {}, {}, {}, mongoose.Document<unknown, {}, UserDocument, {}, {}> & UserDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map