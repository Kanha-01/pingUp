import React from 'react'
import { dummyUserData } from '../assets/assets'
import { Calendar, MapPin, PenBox, Verified } from 'lucide-react'
import moment from 'moment'

const UserProfile = ({ user, posts, profileId, setShowEdit }) => {
  return (
    <div className='relative py-4 px-6 md:px-8 bg-white'>
      <div className='flex flex-col md:flex-row items-start gap-6'>

        {/* profile_picture  */}
        <div className='w-32 h-32 border-4 border-white shadow-lg absolute -top-16 rounded-full overflow-hidden'>
          <img src={user.profile_picture} alt="" className='absolute rounded-full z-2' />
        </div>

        {/* name and username and details */}
        <div className='w-full pt-16 md:pt-0 md:pl-36'>

          {/* name and username edit button */}
          <div className="flex flex-col md:flex-row items-start justify-between">
            <div className=''>
              <div className='flex items-center gap-3'>
                <h1 className='text-2xl font-bold text-gray-900'> {user.full_name}</h1>
                <Verified className='w-6 h-6 text-blue-500' />
              </div>
              <p>{user.username ? `@${user.username}` : 'Add a username '}</p>
            </div>

            {/* if is user is not on on his own profile then will not get access to edit button  */}
            {!profileId &&
              <button onClick={()=> setShowEdit(true)} className='flex items-center gap-2 border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors mt-4 md:mt-10 cursor-pointer'>
                <PenBox className='w-4 h-4'/> Edit
              </button>}
          </div>
          
          <p className='text-gray-700 text-sm max-w-md mt-4'>{user.bio}</p>

          {/* adress amd creatd  */}
          <div className='flex flex-wrap items-center gap-x-6 gap-y-2  text-sm text-gray-500 mt-4 '>
            <span className='flex items-center gap-1.5'>
              <MapPin className='w-4 h-4'/> {user.location? user.location : 'Add location'}
            </span>
            <span className='flex items-center gap-1.5'>
              <Calendar className='w-4 h-4'/> Joined <span className='font-medium'>{moment(user.createdAt).fromNow()}</span>
            </span>
          </div>

          {/* num of posts followers following */}
          <div className='flex items-center gap-6 mt-6 border-t border-gray-200 pt-4'>
              <div>
                <span className='sm:text-xl font-bold text-gray-900'>{posts.length}</span>
                <span className='text-xs sm:text-sm text-gray-500 ml-1.5'>Posts</span>
              </div>
              <div>
                <span className='sm:text-xl font-bold text-gray-900'>{user.followers.length}</span>
                <span className='text-xs sm:text-sm text-gray-500 ml-1.5'>Followers</span>
              </div>
              <div>
                <span className='sm:text-xl font-bold text-gray-900'>{user.following.length}</span>
                <span className='text-xs sm:text-sm text-gray-500 ml-1.5'>Following</span>
              </div>
          </div>


        </div>
      </div>
    </div>
  )
}

export default UserProfile