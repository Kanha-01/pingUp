import fs from 'fs';
import imagekit from '../configs/imageKit.js';
import Post from '../models/post.js';
import User from '../models/User.js';

//add post
export const addPost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { content, post_type } = req.body;
    const images = req.files;

    let image_urls = []

    if (images.length) {
      image_urls = await Promise.all(
        images.map(async (image) => {
          const fileBuffer = fs.readFileSync(image.path)

          //pasted from userController.js
          const response = await imagekit.upload({
            file: fileBuffer,
            fileName: image.originalname,
            folder: "posts",
          })

          const url = imagekit.url({
            path: response.filePath,
            transformation: [
              { quality: 'auto' },
              { format: "webp" },
              { width: "1280" }
            ]
          })
          return url;
        })
      )
    }
    await Post.create({
      user: userId,
      content,
      post_type,
      image_urls
    })
    res.json({ success: true, message: "Post created successfully" });
  } 
  catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
}


//get posts
export const getFeedPosts = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId);

    //user connections and followings
    const userIds = [userId, ...user.connections, ...user.following ]
    const posts = await Post.find({user :{$in : userIds }}).populate('user').sort({createdAt : -1})//.limit(30);

    res.json({ success: true, posts}) 
  } 
  catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
}

//like posts
export const likePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId } = req.body;

    const post = await Post.findById(postId);

    if(post.likes.includes(userId)){
      //user already liked the post, so unlike it
      post.likes = post.likes.filter(user => user !== userId)
      await post.save();
      return res.json({ success: true, message: "Post unliked successfully"})
    }
    else {
      post.likes.push(userId);
      await post.save();
      return res.json({ success: true, message: "Post liked successfully"})
    }    
  } 
  catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
}