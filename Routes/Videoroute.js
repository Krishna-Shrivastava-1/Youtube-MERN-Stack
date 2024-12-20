import express from 'express'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import cloudinary from 'cloudinary';
const { v2 } = cloudinary; // Extract v2
import multer from 'multer'
import Channels from '../Models/Channels.js'
import VideoModel from '../Models/VideoModel.js'


const app = express
const router = app.Router()


cloudinary.config({
    cloud_name: process.env.CLOUD_NAME || 'dzlgy00ia',
    api_key: process.env.API_KEY || '352523258186496',
    api_secret: process.env.API_SECRET || '-sm0ccwg7wjlJOmwSEwt6G1zWl0',
});

const upload = multer({
    storage: new CloudinaryStorage({
        cloudinary: cloudinary.v2,
        params: async (req, file) => {
            if (file.fieldname === "video") {
                return {
                    folder: "channelvideos",
                    allowed_formats: ["mp4"],
                    resource_type: "video", // Specify video upload
                };
            } else if (file.fieldname === "thumbnail") {
                return {
                    folder: "ChannelThumbnail",
                    allowed_formats: ["jpg", "png", "jpeg"],
                    resource_type: "image", // Specify image upload
                };
            }
        },
    }),
}).fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
]);

router.post('/uploadnewvideo/:id', upload, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;

        if (!req.files || !req.files.video || !req.files.thumbnail) {
            return res.status(400).json({ message: "Video or thumbnail is missing" });
        }

        const videoUrl = req.files.video[0].path; // Video URL from Cloudinary
        const thumbnailUrl = req.files.thumbnail[0].path; // Thumbnail URL from Cloudinary

        // Save video and thumbnail URLs in the database
        const newVideo = new VideoModel({
            title,
            description,
            url: videoUrl,
            thumbnail: thumbnailUrl,
            channel: id,
        });

        const savedVideo = await newVideo.save();

        // Add video reference to channel
        await Channels.findByIdAndUpdate(id, {
            $push: { channelvideos: savedVideo._id },
        });

        return res.status(200).json({
            message: "Video and thumbnail uploaded successfully",
            success: true,
            video: savedVideo,
        });
    } catch (error) {
        console.error("Error uploading video and thumbnail:", error);
        return res.status(500).json({
            message: "Server error",
            success: false,
        });
    }
});












router.get('/getvideobychannelid/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const channel = await Channels.findById(id).populate({
            path: 'channelvideos',
            select: 'title description url thumbnail channelicon createdAt views'
        });
        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }
       
        res.status(200).json({ channelvideos: channel.channelvideos , channelicon: channel.channelicon, });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/getvideobyid/:id', async (req, res) => {
    try {
        const { id } = req.params
        // console.log(id)
        const videos = await VideoModel.find({ _id: { $in: id } });
        return res.status(200).json(videos)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'server error' })
    }
})
router.get('/getvideoall', async (req, res) => {
    try {
        
       
        const videos = await VideoModel.find();
        return res.status(200).json(videos)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'server error' })
    }
})

router.get('/getvido', async (req, res) => {
    try {
        const videos = await VideoModel.find()
            .select('title description url thumbnail createdAt channel commenttext');  // Add any other fields you want to select

        // If you also want to fetch related channel data (like channel name and icon), you can use populate.
        const populatedVideos = await VideoModel.populate(videos, {
            path: 'channel', // Assuming 'channel' is the reference to the Channels collection
            select: 'name channelicon' // Select channel's name and icon
        });

        return res.status(200).json(populatedVideos);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'server error' });
    }
});
// Update video views by ID
router.put('/updateviews/:id', async (req, res) => {
    const videoId = req.params.id;
  
    try {
      const updatedVideo = await VideoModel.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } }, // Increment the views by 1
        { new: true } // Return the updated document
      );
  
      if (!updatedVideo) {
        return res.status(404).json({ message: 'Video not found' });
      }
  
      res.status(200).json(updatedVideo);
    } catch (error) {
      console.error('Error updating video views:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });


// commenttext
router.post('/commentsend/:id', async(req,res)=>{
    try {
        const {id} = req.params
        const {comment,user} = req.body
        const userfromchannel = await Channels.findById(user)
        const commentedvideo = await VideoModel.findById(id)
        if (!commentedvideo) {
            res.status(400).json({message:'Video not found'})
        }
        const newcomment = new VideoModel({
            commentedbyuserid:userfromchannel,
            commenttext:comment
        })
        await newcomment.save()
return res.status(200).json(newcomment)
    } catch (error) {
        console.log(error)
    }
})

export default router;