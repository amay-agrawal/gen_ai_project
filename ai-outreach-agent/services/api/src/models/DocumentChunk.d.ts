import mongoose, { Document } from 'mongoose';
import type { IDocumentChunk } from '@ai-outreach/shared';
export interface DocumentChunkDocument extends Omit<IDocumentChunk, '_id'>, Document {
}
export declare const DocumentChunk: mongoose.Model<DocumentChunkDocument, {}, {}, {}, mongoose.Document<unknown, {}, DocumentChunkDocument, {}, {}> & DocumentChunkDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=DocumentChunk.d.ts.map