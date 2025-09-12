import { Inngest } from "inngest";
import User from "../models/User.js";
import Connection from "../models/Connection.js";
import sendEmail from "../configs/nodemailer.js";
import Story from "../models/Story.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "pingup-app" });

//inngest fn to save user to database
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data
    let username = email_addresses[0].email_address.split('@')[0]

    //check availbility of username
    const user = await User.findOne({ username })

    if (user) {
      username = username + Math.floor(Math.random() * 10000)
    }

    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      full_name: first_name + ' ' + last_name,
      profile_picture: image_url,
      username: username
    }
    await User.create(userData)
  },
);

//inngest fn to update user data in databse
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data

    const updatedUserData = {
      email: email_addresses[0].email_address,
      full_name: first_name + ' ' + last_name,
      profile_picture: image_url,
    }
    await User.findByIdAndUpdate(id, updatedUserData)
  },
);

//inngest fn to delete user from databse
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { id } = event.data
    await User.findByIdAndDelete(id)
  },
);

//inngest function to send reminder when a new connection request is added
const sendNewConnectionRequestReminder = inngest.createFunction(
  { id: 'send-new-connection-request-reminder' },
  { event: 'app/connection-request' },
  async ({ event, step }) => {
    const { connectionId } = event.data;

    await step.run('send-connection-request-mail', async () => {
      const connection = await Connection.findById(connectionId).populate('from_user_id to_user_id')
      const subject = `👋 New Connection Request`;
      const body = ` 
        <div style = "font-family: Arial, Helvetica, sans-serif; padding: 20px;" >
          <h2> Hi ${connection.to_user_id.full_name},</h2>
          <p>you have a new connection request from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}</p>
          <p>Click <a href="${process.env.FRONTEND_URL}/connections" style= 'color : #10b981;'> here</a> to accept or reject the request</p>
          <br/>
          <p> Thanks,<br/>PingUp - Stay Connected </p>
        </div>
      `

      await sendEmail({
        to: connection.to_user_id.email,
        subject,
        body
      })
    })

    const in24hours = new Date(Date.now() + 24*60*60*1000)
    await step.sleepUntil('wait-for-24-hours',in24hours);
    await step.run('send-connection-request-reminder', async () => {
      const connection = await Connection.findById(connectionId).populate('from_user_id to_user_id');

      if(connection.status === 'accepted'){
        return {message : "Already accepted"}
      }

      const subject = `👋 New Connection Request`;
      const body = ` 
        <div style = "font-family: Arial, Helvetica, sans-serif; padding: 20px;" >
          <h2> Hi ${connection.to_user_id.full_name},</h2>
          <p>you have a new connection request from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}</p>
          <p>Click <a href="${process.env.FRONTEND_URL}/connections" style= 'color : #10b981;'> here</a> to accept or reject the request</p>
          <br/>
          <p> Thanks,<br/>PingUp - Stay Connected </p>
        </div>
      `

      await sendEmail({
        to: connection.to_user_id.email,
        subject,
        body
      })

      return {message : 'reminder sent'}
    })
  }
)

//inngest function to delete the story after 24 hours
const deleteStory = inngest.createFunction(
  { id: 'story-delete' },
  { event: 'app/story.delete' },
  async ({event, step}) => {
    const {storyId} = event.data;
    const in24hours = new Date(Date.now() + 24*60*60*1000)
    await step.sleepUntil('wait-for-24-hours',in24hours);
    await step.run('delete-story', async () => {
      //delete story from db
      await Story.findByIdAndDelete(storyId)
      return {message : 'story deleted'}
      })
    }
) 


// Create an empty array where we'll export future Inngest functions
export const functions = [
  syncUserCreation,
  syncUserUpdation,
  syncUserDeletion,
  sendNewConnectionRequestReminder,
  deleteStory
];