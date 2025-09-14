import imagekit from "../configs/imageKit.js";
import fs from 'fs';
import Message from "../models/Message.js";

// create an object to store server side event connections 
const connections = {};

//controller function for the SSE endpoint
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://ping-up2-zeta.vercel.app"
];

export const sseController = (req, res) => {
  const { userId } = req.params;
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  console.log('New client connected :', userId);

  //set server-side event (SSE) headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  //add the client's response object to the connections object
  connections[userId] = res;

  //send an initial event to the client
  //res.write('log : Connected to SSE stream\n\n');
  res.write(`data: ${JSON.stringify({ log: "Connected to SSE stream" })}\n\n`);

  //handle client disconnects
  req.on('close', () => {
    //remove the client's response object from the connections object
    delete connections[userId];
    console.log('Client disconnected :', userId);
  });

  //res.flushHeaders(); //flush the headers to establish SSE with client
}

//////////////////////// MAY BE ERROR HERE ?????????????????????
// send message 
export const sendMessage = async (req,res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id, text } = req.body
    const image = req.file;

    let media_url = ''
    let message_type = image ? 'image' : 'text'

    if (message_type === 'image') {
      //upload image to imagekit
      const buffer = fs.readFileSync(image.path)
      const response = await imagekit.upload({
        file: buffer,
        fileName: image.originalname,
      })
      media_url = imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: 'auto' },
          { format: "webp" },
          { width: "1280" }
        ]
      })
    }

    const message = await Message.create({
      from_user_id: userId,
      to_user_id,
      text,
      media_url,
      message_type
    })

    res.json({ success: true, message });

    //send the message to the recipient using SSE

    const messageWithUserdata = await Message.findById(message._id).populate('from_user_id');

    if (connections[to_user_id]) {
      connections[to_user_id].write(`data: ${JSON.stringify(messageWithUserdata)}\n\n`);
    }
  }
  catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
}

// get chat messages
export const getChatMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id } = req.body;

    const messages = await Message.find({
      $or: [
        { from_user_id: userId, to_user_id },
        { from_user_id: to_user_id, to_user_id: userId }
      ]
    }).sort({ createdAt: -1 })

    //mark messages as seen
    await Message.updateMany({ from_user_id: to_user_id, to_user_id: userId, seen: false }, { $set: { seen: true } })

    res.json({ success: true, messages });

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
}

export const getUserRecentMessages = async (req,res) => {
  try {
    const {userId} = req.auth();
    const messages = await Message.find({to_user_id: userId }).populate('from_user_id to_user_id').sort({createdAt : -1})
    res.json({success : true , messages})
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
}