import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import Authroutes from './Routes/Authroutes.js'
import cookieParser from 'cookie-parser'
import Channelroute from './Routes/Channelroute.js'
import Videoroute from './Routes/Videoroute.js'
const app = express()
app.use(express.json())
app.use(bodyParser.json())
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin:'http://localhost:5173',
    credentials:true,
    methods:"GET,POST,PUT",
    allowedHeaders:'Content-Type,Authorization'
}))
dotenv.config()
const port = process.env.PORT || 3000


mongoose.connect(process.env.MONGOURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Database Connected')).catch((e) => console.log(e))



app.use('/auth',Authroutes)
app.use('/channels',Channelroute)
app.use('/uploader',Videoroute)




app.listen(port, () => {
    console.log(`Server is connected `, port)
})
