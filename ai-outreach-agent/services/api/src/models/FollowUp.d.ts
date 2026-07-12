import mongoose, { Document } from 'mongoose';
import type { IFollowUp } from '@ai-outreach/shared';
export interface FollowUpDocument extends Omit<IFollowUp, '_id'>, Document {
}
export declare const FollowUp: mongoose.Model<FollowUpDocument, {}, {}, {}, mongoose.Document<unknown, {}, FollowUpDocument, {}, {}> & FollowUpDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=FollowUp.d.ts.map