import mongoose, { Document } from 'mongoose';
import type { IThreadMessage } from '@ai-outreach/shared';
export interface ThreadMessageDocument extends Omit<IThreadMessage, '_id'>, Document {
}
export declare const ThreadMessage: mongoose.Model<ThreadMessageDocument, {}, {}, {}, mongoose.Document<unknown, {}, ThreadMessageDocument, {}, {}> & ThreadMessageDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=ThreadMessage.d.ts.map