import mongoose, { Schema } from 'mongoose';
const DocumentSchema = new Schema({
    orgId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fileName: {
        type: String,
        required: true,
        trim: true,
    },
    fileType: {
        type: String,
        enum: ['pdf', 'docx', 'xlsx', 'csv'],
        required: true,
    },
    storageUrl: {
        type: String,
        default: '',
    },
    docType: {
        type: String,
        enum: ['brochure', 'statistics', 'company_info', 'template', 'other'],
        default: 'other',
    },
    status: {
        type: String,
        enum: ['processing', 'indexed', 'failed'],
        default: 'processing',
    },
    chunkCount: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
DocumentSchema.index({ orgId: 1, docType: 1 });
export const DocModel = mongoose.model('Document', DocumentSchema);
//# sourceMappingURL=Document.js.map