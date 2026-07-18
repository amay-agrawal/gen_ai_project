import mongoose, { Schema } from 'mongoose';
const ContactSchema = new Schema({
    orgId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    company: {
        type: String,
        required: true,
        trim: true,
    },
    hrName: {
        type: String,
        required: true,
        trim: true,
    },
    designation: {
        type: String,
        default: '',
        trim: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    phone: {
        type: String,
        default: '',
        trim: true,
    },
    status: {
        type: String,
        enum: ['new', 'contacted', 'replied', 'closed'],
        default: 'new',
    },
    lastContactDate: {
        type: Date,
        default: null,
    },
    notes: {
        type: String,
        default: '',
    },
    tags: {
        type: [String],
        default: [],
    },
}, {
    timestamps: true,
});
ContactSchema.index({ orgId: 1, company: 1 });
ContactSchema.index({ orgId: 1, email: 1 }, { unique: true });
ContactSchema.index({ company: 'text', hrName: 'text', notes: 'text' }, { name: 'contact_text_search' });
export const Contact = mongoose.model('Contact', ContactSchema);
//# sourceMappingURL=Contact.js.map