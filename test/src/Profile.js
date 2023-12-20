import React, { useState, useEffect } from 'react';
import ProfileMain from './ProfileMain';
import EmailSection from './EmailSection';
import MyPostsSection from './MyPostsSection';
import MyCommentsSection from './MyCommentsSection';
import BlockedUsersSection from './BlockedUsersSection';
import SavedPostsSection from './SavedPostsSection';
import UserProfile from './UserProfile';
import ProfilePicture from './ProfilePicture';
import Theme from './Theme';
import PostDetails from './PostDetails'; 

const Profile = ({ authToken, userId }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [email, setEmail] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [message, setMessage] = useState('');
  const [myPosts, setMyPosts] = useState([]);
  const [myComments, setMyComments] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [aboutMe, setAboutMe] = useState('');
  const [isEditingAboutMe, setIsEditingAboutMe] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  // Add state for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigateToPost = (postId) => {
    setSelectedPostId(postId);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleAboutMeChange = (e) => {
    setAboutMe(e.target.value);
  };

  const [currentAboutMe, setCurrentAboutMe] = useState('');

  useEffect(() => {
    if (authToken) {
      fetch('http://localhost:8000/get-current-about-me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      })
        .then(response => response.json())
        .then(data => setAboutMe(data.aboutMe))
        .catch(error => console.error('Error fetching current About Me:', error));
    }
  }, [authToken]);

  const fetchMyPosts = async () => {
    try {
      const response = await fetch('http://localhost:8000/my-posts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMyPosts(data);
      } else {
        console.error('Error fetching user posts');
      }
    } catch (error) {
      console.error('An error occurred while fetching user posts:', error);
    }
  };

  const fetchMyComments = async () => {
    try {
      const response = await fetch('http://localhost:8000/my-comments', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMyComments(data);
      } else {
        console.error('Error fetching user comments');
      }
    } catch (error) {
      console.error('An error occurred while fetching user comments:', error);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchMyPosts();
      fetchMyComments();
    }
  }, [authToken]);

  useEffect(() => {
    if (authToken) {
      // Fetch the list of blocked users from your server.
      fetch('http://localhost:8000/blocked-users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      })
        .then((response) => response.json())
        .then((data) => setBlockedUsers(data))
        .catch((error) => console.error('Error fetching blocked users:', error));
    }
  }, [authToken]);

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (authToken) {
      try {
        const response = await fetch('http://localhost:8000/update-profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({ email }),
        });

        if (response.ok) {
          setMessage('Email updated successfully');
        } else {
          const data = await response.json();
          setMessage(data.message || 'Error updating email');
        }
      } catch (error) {
        setMessage('An error occurred while updating email');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmitAboutMe = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (authToken) {
      try {
        const response = await fetch('http://localhost:8000/update-about-me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({ aboutMe }),
        });

        if (response.ok) {
          setMessage('About Me updated successfully');
        } else {
          const data = await response.json();
          setMessage(data.message || 'Error updating About Me');
        }
      } catch (error) {
        setMessage('An error occurred while updating About Me');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  useEffect(() => {
    if (authToken) {
      fetch('http://localhost:8000/get-current-email', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      })
        .then(response => response.json())
        .then(data => setCurrentEmail(data.email))
        .catch(error => console.error('Error fetching current email:', error));
    }
  }, [authToken]);

  const toggleEditingAboutMe = () => {
    setIsEditingAboutMe(!isEditingAboutMe);
  };

  const handleDeleteAccount = async (userId) => {
    if (window.confirm('Are you sure you want to delete your account?')) {
      try {
        console.log('Deleting account...');
        const response = await fetch(`http://localhost:8000/api/accounts/delete`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });
  
        if (response.ok) {
          // Handle successful deletion
          alert('Account deleted successfully');
        } else {
          // Handle deletion error
          console.error('Error deleting account:', response.status);
          alert('Error deleting account');
        }
      } catch (error) {
        console.error('An error occurred while deleting account:', error);
        alert('Error deleting account');
      }
    }
  };  

  return (
    <div>
      <h2>Profile</h2>
      <div className="dropdown">
        <button className="buttons buttons-dropdown" onClick={() => setActiveTab}>
          Actions
        </button>
        <div className="dropdown-content">
          <button className="buttons" onClick={() => setActiveTab('aboutMe')}>
            About Me
          </button>
          <button className="buttons" onClick={() => setActiveTab('updateEmail')}>
            Update Email
          </button>
          <button className="buttons" onClick={() => setActiveTab('profilePicture')}>
            Profile Picture
          </button>
          <button className="buttons" onClick={() => setActiveTab('myposts')}>
            My Posts
          </button>
          <button className="buttons" onClick={() => setActiveTab('mycomments')}>
            My Comments
          </button>
          <button className="buttons" onClick={() => setActiveTab('blockedusers')}>
            Blocked Users
          </button>
          <button className="buttons" onClick={() => setActiveTab('savedposts')}>
            Saved Posts
          </button>
          <button className="buttons" onClick={() => setActiveTab('otherUsers')}>
            Other Users
          </button>
          <button className="buttons" onClick={() => setActiveTab('Theme')}>
            Theme
          </button>
          <button className="buttons" onClick={() => handleDeleteAccount(userId)}>
  Delete Account
</button>
        </div>
      </div>
  
      {activeTab === 'aboutMe' && (
        <ProfileMain
          aboutMe={aboutMe}
          currentAboutMe={currentAboutMe}
          isEditingAboutMe={isEditingAboutMe}
          handleAboutMeChange={handleAboutMeChange}
          handleSubmitAboutMe={handleSubmitAboutMe}
          message={message}
          toggleEditingAboutMe={toggleEditingAboutMe}
          isSubmitting={isSubmitting}
        />
      )}
  
      {activeTab === 'updateEmail' && (
        <EmailSection
          currentEmail={currentEmail}
          email={email}
          handleEmailChange={handleEmailChange}
          handleSubmit={handleSubmitEmail}
          message={message}
          isSubmitting={isSubmitting}
        />
      )}
  
  {selectedPostId ? (
  <PostDetails
    post={myPosts.find(post => post.PostID === selectedPostId)}
    token={authToken}
  />
) : (
  <>
    {activeTab === 'myposts' && (
      <MyPostsSection myPosts={myPosts} navigateToPost={navigateToPost} />
    )}
  </>
)}
  
      {activeTab === 'mycomments' && (
        <MyCommentsSection myComments={myComments} />
      )}
  
      {activeTab === 'blockedusers' && (
        <BlockedUsersSection blockedUsers={blockedUsers} authToken={authToken} />
      )}
  
      {activeTab === 'savedposts' && (
        <SavedPostsSection savedPosts={savedPosts} authToken={authToken} />
      )}
  
      {activeTab === 'otherUsers' && <UserProfile authToken={authToken} />}
  
      {activeTab === 'profilePicture' && (
        <ProfilePicture authToken={authToken} />
      )}
  
      {activeTab === 'Theme' && <Theme authToken={authToken} />}
    </div>
  );  
};

export default Profile;