import mongoose, { Document } from 'mongoose';
import type { IContact } from '@ai-outreach/shared';
export interface ContactDocument extends Omit<IContact, '_id'>, Document {
}
export declare const Contact: mongoose.Model<ContactDocument, {}, {}, {}, mongoose.Document<unknown, {}, ContactDocument, {}, {}> & ContactDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Contact.d.ts.map