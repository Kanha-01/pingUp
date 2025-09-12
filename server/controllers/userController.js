import { response } from "express"
import User from "../models/User.js"
import fs from 'fs'
import imagekit from "../configs/imageKit.js"
import Connection from "../models/Connection.js"
import Post from "../models/post.js"
import { inngest } from "../inngest/index.js"

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
    let {username, bio, location, full_name} = req.body;

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

      const response = await imagekit.upload({
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

      const response = await imagekit.upload({
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

// SEnd connection Request 

export const sendConnectionRequest = async (req,res) => {
  try {
    const {userId} = req.auth()
    const {id} = req.body;

    // check if user had send more than 20 connection reqiuests in last 24 hours ??

    const last24hours = new Date(Date.now()- 24*60*60*1000)
    const connectionRequests = await Connection.find({from_user_id : userId, createdAt : { $gt : last24hours}})
    if(connectionRequests.length >= 40) {
      return res.json({success: false , message : 'you have sent more than 20 connection requests in the last  24 hours '})
    }

    //check if users are already connected
    const connection = await Connection.findOne({
      $or: [
        {from_user_id : userId , to_user_id : id},
        {from_user_id : id , to_user_id : userId},
      ]
    })

    if(!connection){
      const newConnection = await Connection.create({
        from_user_id : userId,
        to_user_id : id
      })

      await inngest.send({
        name : 'app/connection-request',
        data : { connectionId : newConnection._id }
      })

      return res.json({success : true , message : 'Connection request sent successfully'})
    }
    else if(connection && connection.status === 'accepted'){
      return res.json({success : false , message : 'already connected with the user'})
    }

    res.json({success : false , message : 'connection request pending'})

  } catch (error) {
    console.error(error);
    res.json({success : false , message : error.message})
  }
}

// get User Connections 
export const getUserConnections = async (req,res) => {
  try {
    const {userId} = req.auth()
    const user = await User.findById(userId).populate('connections followers following');

    const connections = user.connections
    const followers = user.followers
    const following = user.following

    const pendingConnections  = (await Connection.find({to_user_id: userId, status : 'pending'}).populate('from_user_id')).map((connection) => connection.from_user_id)

    res.json({success : true, connections, followers, following,pendingConnections})

    
  } catch (error) {
    console.error(error);
    res.json({success : false , message : error.message})
  }
}

//Accept connection request
export const acceptConnectionRequest = async (req,res) => {
  try {
    const {userId} = req.auth()
    const {id} = req.body
    

    const connection =  await Connection.findOne({from_user_id : id , to_user_id : userId})

    if(!connection){
      return res.json({success : false , message : 'Connection not Found'})
    }

    const user = await User.findById(userId);
    user.connections.push(id)
    await user.save()

    const toUser = await User.findById(id);
    toUser.connections.push(userId)
    await toUser.save()

    connection.status = 'accepted'
    await connection.save()

    res.json({success : true, message : 'connection Updated successfully'})
    
  } catch (error) {
    console.error(error);
    res.json({success : false , message : error.message})
  }
}

// get user profile
export const getUserProfiles = async (req,res) => {
  try {
    const {profileId} = req.body
    const profile = await User.findById(profileId)
    
    if(!profile) return res.json({success : false , message : 'profile not found'} )

    const posts = await Post.find({user : profileId}).populate('user')
    res.json({success : true , profile, posts})

  } catch (error) {
    console.error(error);
    res.json({success : false , message : error.message})
  }
}