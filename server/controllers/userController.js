import { response } from "express"
import User from "../models/User"
import fs from 'fs'
import imagekit from "../configs/imageKit"

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
      const user = await User.findOne({username})
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

    if(profile) {
      const buffer = fs.readFileSync(profile.path)

      const resonse = await imagekit.upload({
        file: buffer,
        fileName: profile.originalname,
      })

      const url = imagekit.url({
        path : response.filePath,
        transformation : [
          {quality: 'auto'},
          {format : "webp"},
          {width : "512"}
        ]
      })
      updatedData.profile_picture = url;
    }

    if(cover) {
      const buffer = fs.readFileSync(cover.path)

      const resonse = await imagekit.upload({
        file: buffer,
        fileName: cover.originalname,
      })

      const url = imagekit.url({
        path : response.filePath,
        transformation : [
          {quality: 'auto'},
          {format : "webp"},
          {width : "1280"}
        ]
      })
      updatedData.cover_photo = url;
    }

    const user = await User.findByIdAndUpdate(userId, updatedData , {new : true})

    res.json({success:true, user, message : 'profile updated successfully'})

  }
  catch(error){
    console.error(error);
    res.json({success : false , message : error.message})
  }
} 


//Find Users using username , email, location, name 
export const discoverUsers = async (req,res) => {
  try{
    const {userId} = req.auth()
    const {input} = req.body;
    
    const allUsers = await User.find(
      {
        $or : [
          {username : new RegExp(input, 'i')},
          {email : new RegExp(input, 'i')},
          {full_name : new RegExp(input, 'i')},
          {location : new RegExp(input, 'i')}
        ]
      }
    )

    const filteredUsers = allUsers.filter(user=> user._id !== userId);

    res.json({success:true, users: filteredUsers})
  }
  catch(error){
    console.error(error);
    res.json({success : false , message : error.message})
  }
} 



// follow user
export const followUser = async (req,res) => {
  try{
    const {userId} = req.auth()
    const {id} = req.body;

    const user = await User.findById(userId)

    if(user.following.includes(id)){
      return res.json({success: false , message: 'you are already following this user'})
    }

    user.following.push(id);
    await user.save()

    const toUser = await User.findById(id)
    toUser.followers.push(userId)
    await toUser.save()

    res.json({success : true , message:'Now you are following this user'})
  }
  catch(error){
    console.error(error);
    res.json({success : false , message : error.message})
  }
} 

// Unfollow user
export const UnfollowUser = async (req,res) => {
  try{
    const {userId} = req.auth()
    const {id} = req.body;

    const user = await User.findById(userId)

    user.following = user.following.filter(user => user !== id)
    await user.save()

    const toUser = await User.findById(id)
    toUser.followers = toUser.followers.filter(user => user !== userId)
    await toUser.save()

    res.json({success : true , message:'Now you are no longer following this user'})
  }
  catch(error){
    console.error(error);
    res.json({success : false , message : error.message})
  }
} 
