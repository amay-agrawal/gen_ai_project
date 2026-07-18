import mongoose, { Schema } from 'mongoose';
const UserSchema = new Schema({
    googleId: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
    },
    password: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    avatarUrl: {
        type: String,
        default: '',
    },
    role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member',
    },
    orgId: {
        type: Schema.Types.ObjectId,
        index: true,
    },
    signature: {
        type: String,
        default: '',
    },
    dailySendCap: {
        type: Number,
        default: 500,
        min: 1,
        max: 2000,
    },
}, {
    timestamps: true,
});
export const User = mongoose.model('User', UserSchema);
//# sourceMappingURL=User.js.map