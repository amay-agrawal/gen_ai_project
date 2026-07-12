import mongoose, { Document } from 'mongoose';
import type { IOutreachRecord } from '@ai-outreach/shared';
export interface OutreachRecordDocument extends Omit<IOutreachRecord, '_id'>, Document {
}
export declare const OutreachRecord: mongoose.Model<OutreachRecordDocument, {}, {}, {}, mongoose.Document<unknown, {}, OutreachRecordDocument, {}, {}> & OutreachRecordDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=OutreachRecord.d.ts.map