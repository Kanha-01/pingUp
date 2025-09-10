import express from "express";
import { discoverUsers, followUser, getUserData, UnfollowUser, updateUserData } from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";
import { upload } from "../configs/multer.js";

const userRouter = express.Router();

//url/api endpoint

userRouter.get('/data',protect,getUserData)           //dont have to provide any data coz we are creating api to get the user data
userRouter.post('/update', protect, upload.fields([{name: 'profile', maxCount: 1}, {name: 'cover', maxCount: 1}]),updateUserData)           //multer middleware to get the media e.g profile photo or cover photo //parse images using multer package
userRouter.post('/discover',protect,discoverUsers) 
userRouter.post('/follow',protect,followUser) 
userRouter.post('/unfollow',protect,UnfollowUser) 

export default userRouter