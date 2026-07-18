import mongoose, { Schema } from 'mongoose';
const DocumentChunkSchema = new Schema({
    documentId: {
        type: Schema.Types.ObjectId,
        ref: 'Document',
        required: true,
        index: true,
    },
    orgId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    chunkIndex: {
        type: Number,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    vectorId: {
        type: String,
        default: '',
    },
    metadata: {
        page: { type: Number, default: 0 },
        section: { type: String, default: '' },
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
export const DocumentChunk = mongoose.model('DocumentChunk', DocumentChunkSchema);
//# sourceMappingURL=DocumentChunk.js.map