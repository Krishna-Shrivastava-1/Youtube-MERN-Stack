import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import User from '../Models/User.js'



const app = express
const router = app.Router()
const secretKey = process.env.SECRETKEY || 'dcjsvcjvecuwyvcauevvuawvckvc'



export const verifytoken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1] || req.cookies.token
    if (!token) {
        return res.status(401).json({ message: "Authorization token is missing" })
    }
    try {
        const decode = jwt.verify(token, secretKey)
        req.userId = decode.id
        next()
    } catch (error) {
        return res.status(401).json({ message: "Invalid Token" })
    }
}







// Route for registration
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body
    try {
        const existinguser = await User.findOne({ email })
        if (existinguser) {
            return res.status(400).json({
                message: 'User already exist',
                success: false
            })
        }
        const hashedpassword = await bcrypt.hash(password, 10)
        const newuser = new User({ name, email, password: hashedpassword })
        newuser.save()
        return res.status(200).json({
            message: 'User Registered Successfully',
            success: true
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: 'User failed to register',
            success: false
        })
    }
})

// Route for Login

router.post('/login', async (req, res) => {
    const { email, password } = req.body
    try {
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({
                message: 'User already exist',
                success: false
            })
        }
        const ispasswordcorrect = await bcrypt.compare(password, user.password)
        if (!ispasswordcorrect) {
            return res.status(400).json({
                message: 'Invalid Credentials',
                success: false
            })
        }
        const token = jwt.sign({ id: user._id }, secretKey, { expiresIn: '1d' })

        res.cookie('token', token, {
            sameSite: 'none',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            secure: true
        })

        return res.status(200).json({
            token: token,
            message: `Logged in Successfully ${user.name}`,
            success: true
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: 'User failed to login',
            success: false
        })
    }
})



// Route for Logout

router.post('/logout', async (req, res) => {
    try {
        return res.cookie('token', '', {
            httpOnly: true,
            expiresIn: new Date(0)
        }).json({
            message: 'user loggedout successfully',
            success: true
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: 'User failed to logout',
            success: false
        })
    }
})

// fetch logged in user

router.get('/logged', verifytoken, async (req, res) => {
    try {
        const userId = req.userId
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json([user]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });

    }
})

// fech user by id
router.get('/user/:id', verifytoken, async (req, res) => {
    try {
        const userId = req.params.id
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json([user]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });

    }
})

export default router