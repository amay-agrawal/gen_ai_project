import mongoose, { Document } from 'mongoose';
import type { IDocument } from '@ai-outreach/shared';
export interface DocumentModel extends Omit<IDocument, '_id'>, Document {
}
export declare const DocModel: mongoose.Model<DocumentModel, {}, {}, {}, mongoose.Document<unknown, {}, DocumentModel, {}, {}> & DocumentModel & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Document.d.ts.map