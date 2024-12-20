import mongoose from "mongoose";
const Usermodel = new mongoose.Schema({
    name: {
        type: String

    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    subscribedChannels: { type: [String], default: [] }
}, { timestamps: true })

export default mongoose.model('User', Usermodel)