import express from 'express';
import cloudinary from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import Channels from '../Models/Channels.js';
import { verifytoken } from './Authroutes.js';
import User from '../Models/User.js';

const app = express;
const router = app.Router();






// Route for creating channel
router.post('/createchannel', verifytoken, async (req, res) => {
    const { name, description } = req.body;

    try {
        // Check if the logged-in user already has a channel
        const existingChannel = await Channels.findOne({ user: req.userId });
        if (existingChannel) {
            return res.status(400).json({
                message: 'You have already created a channel',
                success: false,
            });
        }

        // Check if channel name already exists
        const existingname = await Channels.findOne({ name });
        if (existingname) {
            return res.status(400).json({
                message: 'Channel name already exists',
                success: false,
            });
        }

        // Create new channel
        const newchannel = new Channels({
            user: req.userId, // Assigning user from verified token
            name,
            description,
        });

        const savedChannel = await newchannel.save();

        return res.status(201).json({
            message: 'Channel created successfully',
            success: true,
            channel: savedChannel, // Sending created channel as response
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Failed to create channel. Please fill all the fields',
            success: false,
            error: error.message,
        });
    }
});

// Fetch channel by id
router.get('/getchannelinfo/:id', async (req, res) => {
    try {
        const channelId = req.params.id;
        const channel = await Channels.findById(channelId);
        if (!channel) {
            return res.status(404).json({ message: 'Channel not found' });
        }

        res.status(200).json(channel);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Route for uploading channel image

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME || 'dzlgy00ia',
    api_key: process.env.API_KEY || '352523258186496',
    api_secret: process.env.API_SECRET || '-sm0ccwg7wjlJOmwSEwt6G1zWl0',
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary.v2,
    params: {
        folder: "ChannelIcons", // Specify folder name
        allowed_formats: ["jpg", "png", "jpeg"],
        resource_type: "image", // Ensure only images are uploaded
    },
});

const upload = multer({ storage });

// Route for uploading channel icon
router.post('/uploadchannelicon/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ message: "Image upload failed" });
        }

        const imageurl = req.file.path; // Cloudinary image URL

        const updatedChannel = await Channels.findByIdAndUpdate(
            id,
            { channelicon: imageurl }, // Update `channelicon` field
            { new: true } // Return updated channel
        );

        if (!updatedChannel) {
            return res.status(404).json({ message: "Channel not found" });
        }

        res.status(200).json({
            message: "Image uploaded successfully",
            channel: updatedChannel,
        });
    } catch (error) {
        console.error("Error updating channel:", error);
        res.status(500).json({ message: "Server error" });
    }
});


const storage2 = new CloudinaryStorage({
    cloudinary: cloudinary.v2,
    params: {
        folder: "ChannelBanner", // Specify banner folder
        allowed_formats: ["jpg", "png", "jpeg"],
        resource_type: "image", // Ensure only images are uploaded
    },
});

const upload2 = multer({ storage: storage2 }); // Fix naming consistency


router.post('/uploadchannelbanner/:id', upload2.single('image'), async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ message: "Banner upload failed" });
        }

        const imageurl = req.file.path; // Cloudinary banner URL

        const updatedChannel = await Channels.findByIdAndUpdate(
            id,
            { bannerimage: imageurl }, // Update `bannerimage` field
            { new: true } // Return the updated channel
        );

        if (!updatedChannel) {
            return res.status(404).json({ message: "Channel not found" });
        }

        res.status(200).json({
            message: "Banner uploaded successfully",
            channel: updatedChannel,
        });
    } catch (error) {
        console.error("Error updating channel banner:", error);
        res.status(500).json({ message: "Server error" });
    }
});








// Fetch channel by user ID
router.get("/owner/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        // MongoDB query to fetch channels with matching user ID
        const channels = await Channels.find({ user: userId });

        if (!channels || channels.length === 0) {
            return res.status(404).json({ message: "No channels found for this user." });
        }

        res.status(200).json({ channels });
    } catch (error) {
        console.error("Error fetching channels:", error);
        res.status(500).json({ message: "Server error occurred." });
    }
});




// subscribe and unsubscribe route

// subscribe
// Subscribe route
router.put('/subscribeuser/:id', async (req, res) => {
    const { user } = req.body; // This should be the ObjectId of the user
    const { id } = req.params; // Channel ID
    // console.log(user)
    try {
        const subs = await Channels.findById(id); // Find the channel
        const usi = await User.findById(user);   // Find the user

        if (!subs) return res.status(404).json({ message: 'Channel not found' });

        // Ensure `subscriber` is an array
        if (!Array.isArray(subs.subscriber)) {
            subs.subscriber = [];
        }

        // Check if user is already subscribed
        if (subs.subscriber.includes(user)) {
            return res.status(400).json({ message: 'Already Subscribed' });
        }

        // Add user to the subscriber array
        subs.subscriber.push(user);
        usi.subscribedChannels.push(id); // Add channel ID to user's subscribed channels
        await usi.save();
        await subs.save();

        res.status(200).json({ message: 'Channel subscribed', subscriber: subs.subscriber.length });
    } catch (error) {
        console.error("Error Occurred:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Unsubscribe route
router.put('/unsubscribe/:id', async (req, res) => {
    const { user } = req.body; // User's ID
    const { id } = req.params;  // Channel ID

    try {
        const unsub = await Channels.findById(id); // Find the channel
        const usi = await User.findById(user);    // Find the user

        if (!unsub) return res.status(404).json({ message: 'Channel not found' });

        // Remove user ID from subscribers array
        unsub.subscriber = unsub.subscriber.filter(subscriber => subscriber.toString() !== user);
        usi.subscribedChannels = usi.subscribedChannels.filter(channel => channel.toString() !== id);

        await unsub.save();
        await usi.save();

        res.status(200).json({ message: 'Channel unsubscribed', subscriber: unsub.subscriber.length });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});



router.get('/getchannelbyid/:id', async (req, res) => {
    const { id } = req.params
    const findcahnn = await Channels.findById(id)
    if (!findcahnn) {
        return res.status(400).json({ message: 'Channel not found' })
    }
    res.status(200).json(findcahnn)
})


// Fetch all chanel
router.get('/fetchallchannel',async(req,res)=>{
    try {
const chann = await Channels.find()
if (!chann) {
    return res.status(400).json({message:'channel not any found'})
}        
res.status(200).json(chann)
    } catch (error) {
        console.log(error)
    }
})


// fetch channel by user subscribed id
// router.get('/channelbysubscriberid/:id', async (req, res) => {
//     try {
//         const { id } = req.params;
//         const finduserinchannelsusbcriber = await Channels.find({ subscriber: id });

//         // Agar array empty hai, toh user ne koi channel subscribe nahi kiya
//         if (finduserinchannelsusbcriber.length === 0) {
//             return res.status(400).json({ message: 'User not subscribed to anybody' });
//         }

//         // Agar channels milte hain, unhe return karo
//         res.status(200).json(finduserinchannelsusbcriber);
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// });


export default router;
