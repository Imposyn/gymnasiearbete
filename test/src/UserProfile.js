import React, { useState, useEffect } from 'react';

// UserProfiles component
const UserProfiles = ({ authToken }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the list of other users when the component is mounted
    fetchOtherUsers();
  }, []);

  const fetchOtherUsers = async () => {
    try {
      // Make a GET request to the API endpoint to fetch other users
      const response = await fetch('http://localhost:8000/other-users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
  
      if (!response.ok) {
        console.error('Error fetching other users:', response.statusText);
        throw new Error('Error fetching other users');
      }
  
      const data = await response.json();
      setUsers(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching other users:', error);
      setLoading(false);
    }
  };  

  return (
    <div>
      <h3>Other Users</h3>
      {loading ? (
        <p>Loading other users...</p>
      ) : users.length === 0 ? (
        <p>No other users found.</p>
      ) : (
        <ul>
         {users.map((user) => (
  <li key={user.UserID}>
    <p>Username: {user.Username}</p>
    <p>Biography: {user.Biography}</p>
  </li>
))}
        </ul>
      )}
    </div>
  );
};

const UserProfile = ({ userId, authToken }) => {
  const [viewedUserProfile, setViewedUserProfile] = useState(null);
  const [isEditingAboutMe, setIsEditingAboutMe] = useState(false);
  const [aboutMe, setAboutMe] = useState('');
  const [message, setMessage] = useState('');

  const toggleEditingAboutMe = () => {
    setIsEditingAboutMe(!isEditingAboutMe);
  };

  const handleAboutMeChange = (e) => {
    setAboutMe(e.target.value);
  };

  const handleSubmitAboutMe = async () => {
    // Implement the logic for updating the About Me section
  };

  useEffect(() => {
    if (userId === authToken) {
      // Fetch the user's profile information when the component is mounted
      fetchUserProfile();
    } else {
      // You can fetch and set the viewed user's profile information here
    }
  }, [userId, authToken]);

  const fetchUserProfile = async () => {
    try {
      // Make a GET request to the API endpoint to fetch the user's profile
      const response = await fetch(`http://localhost:8000/users/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        console.error('Error fetching user profile:', response.statusText);
        throw new Error('Error fetching user profile');
      }

      const data = await response.json();
      setViewedUserProfile(data.user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  return (
    <div>
      {userId === authToken ? null : <UserProfiles authToken={authToken} />}
      {viewedUserProfile ? (
        <div>
          <h3>About Me</h3>
          <form onSubmit={handleSubmitAboutMe}>
            <label>
              About Me:
              <textarea
                value={aboutMe}
                onChange={handleAboutMeChange}
                rows="4"
                required
                disabled={!isEditingAboutMe}
              />
            </label>
            {isEditingAboutMe ? (
              <button type="submit">Save About Me</button>
            ) : (
              <button type="button" onClick={toggleEditingAboutMe}>
                Edit About Me
              </button>
            )}
          </form>
          {message && (
            <div className={message.includes('successfully') ? 'success' : 'error'}>
              {message}
            </div>
          )}
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );
};

export default UserProfile;