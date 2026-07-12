import mongoose, { Schema } from 'mongoose';
const ThreadMessageSchema = new Schema({
    outreachRecordId: {
        type: Schema.Types.ObjectId,
        ref: 'OutreachRecord',
        required: true,
        index: true,
    },
    gmailMessageId: {
        type: String,
        required: true,
    },
    direction: {
        type: String,
        enum: ['outbound', 'inbound'],
        required: true,
    },
    from: {
        type: String,
        required: true,
    },
    snippet: {
        type: String,
        default: '',
    },
    fullBodyRef: {
        type: String,
        default: '',
    },
    aiSummary: {
        type: String,
        default: '',
    },
    actionItems: {
        type: [String],
        default: [],
    },
    deadlines: [
        {
            label: { type: String, required: true },
            date: { type: Date, default: null },
        },
    ],
    receivedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: false,
});
ThreadMessageSchema.index({ outreachRecordId: 1, receivedAt: 1 });
export const ThreadMessage = mongoose.model('ThreadMessage', ThreadMessageSchema);
//# sourceMappingURL=ThreadMessage.js.map