import mongoose, { mongo } from "mongoose";

const Videoschema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    url: [{ type: String, required: true }], // Video ki file ka path
    thumbnail: [{ type: String, required: true }],  // Thumbnail image ka path
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channels', required: true },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // comments: {
    //     type: mongoose.Schema.Types.ObjectId, ref: 'User',
    //     default: []
    // },

}, { timestamps: true })
export default mongoose.model('Videos', Videoschema)