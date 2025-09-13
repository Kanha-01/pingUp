import {configureStore} from '@reduxjs/toolkit';
import userReducer from '../features/user/userSlice.js'
import connectionsReducer from '../features/connections/connectionsSlice.js'
import messagesReducer from '../features/messages/messagesSlice.js'

export const store = configureStore({
  reducer : {
  // we have to create different slices for different features  //create different folder for all features
    user : userReducer,
    connections : connectionsReducer,
    messages : messagesReducer,
  }
})