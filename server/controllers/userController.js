import { response } from "express"
import User from "../models/User"

// Get User DAta using userId
export const getUserData = async (req,res) => {
  try{
    const {userId} = req.auth()
    const user = await User.findById(userId)
    if(!user) return res.json({success : false , message : 'user not found'})
    res.json({success : true, user}) 
  }
  catch(error){
    console.error(error);
    res.json({success : false , message : error.message})
  }
} 

// Update User DAta using userId
export const updateUserData = async (req,res) => {
  try{
    const {userId} = req.auth()
    const {username, bio, location, full_name} = req.body;

    const tempUser = await User.findById(userId)

    !username && (username = tempUser.username)

    if(tempUser.username !== username) {
      const user = User.findOne({username})
      if(user){
        //wont upadate username if already taken, and let it be as earlier
        username = tempUser.username
      }
    }

    const updatedData ={
      username,
      bio,
      location,
      full_name
    }
// due to  multer setup we can get the images using the file property
    const profile = req.files.profile && req.files.profile[0] 
    const cover = req.files.cover && req.files.cover[0]
    
    // we have to upload images in online storage, use IMAGEKIT
    //IMAGEKIT is image and video api , using which we can upload and optimize our images

  }
  catch(error){
    console.error(error);
    res.json({success : false , message : error.message})
  }
} 
