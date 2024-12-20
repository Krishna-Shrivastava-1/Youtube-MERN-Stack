import mongoose from "mongoose";
const ChannelSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
        },
        subscriber: [{
            type: mongoose.Schema.Types.ObjectId, // Use ObjectId for user references
            ref: 'User', // Reference to the User model
            default: []
        }],
        channelvideos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Videos" }],
        channelshorts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Videos" }],
        channelicon: {
            type: String,
        },
        bannerimage: {
            type: String,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Channels", ChannelSchema);
