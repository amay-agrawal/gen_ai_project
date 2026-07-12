import mongoose, { Document } from 'mongoose';
import type { IEmailDraft } from '@ai-outreach/shared';
export interface EmailDraftDocument extends Omit<IEmailDraft, '_id'>, Document {
}
export declare const EmailDraft: mongoose.Model<EmailDraftDocument, {}, {}, {}, mongoose.Document<unknown, {}, EmailDraftDocument, {}, {}> & EmailDraftDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=EmailDraft.d.ts.map