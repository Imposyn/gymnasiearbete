import React, { useState, useEffect } from 'react';

const ProfilePicture = ({ authToken }) => {
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  const fetchProfilePicture = async () => {
    try {
      const response = await fetch('http://localhost:8000/get-profile-picture', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfilePictureUrl(data.ProfilePicture);
      } else {
        console.error('Error fetching profile picture:', response.status);
      }
    } catch (error) {
      console.error('Error fetching profile picture:', error);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchProfilePicture();
    }
  }, [authToken]);

  const handleUpdateProfilePicture = async () => {
    try {
      const response = await fetch('http://localhost:8000/update-profile-picture', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ profilePictureUrl: newImageUrl }),
      });

      if (response.ok) {
        window.alert('Profile picture updated successfully');
        fetchProfilePicture();
      } else {
        console.error('Error updating profile picture:', response.status);
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
    }
  };

  const handleCreateProfilePicture = async () => {
    try {
      const response = await fetch('http://localhost:8000/create-profile-picture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ profilePictureUrl: 'DEFAULT_IMAGE_URL' }),
      });
  
      if (response.ok) {
        fetchProfilePicture(); 
      } else {
        console.error('Error creating profile picture:', response.status);
      }
    } catch (error) {
      console.error('Error creating profile picture:', error);
    }
  };
  
  return (
    <div>
      <h3>Profile Picture</h3>
      {profilePictureUrl ? (
        <div>
          <img
            src={profilePictureUrl}
            alt="Profile"
            style={{ maxWidth: '200px', maxHeight: '200px', width: 'auto', height: 'auto' }}
            onError={() => {
              setProfilePictureUrl('');
              window.alert('Failed to load profile picture');
            }}
          />
          <div>
            <input
              type="text"
              placeholder="URL"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
            />
            <button className="buttons" onClick={handleUpdateProfilePicture}>
              Update Profile Picture
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p>No profile picture available</p>
          {newImageUrl && (
            <>
              <p>Preview:</p>
              <img
                src={newImageUrl}
                alt="Profile Preview"
                style={{ maxWidth: '200px', maxHeight: '200px', width: 'auto', height: 'auto' }}
                onError={() => {
                  setNewImageUrl('');
                  window.alert('Invalid link');
                }}
              />
            </>
          )}
          <div>
            <input
              type="text"
              placeholder="URL"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
            />
            <button className="buttons" onClick={handleUpdateProfilePicture}>
              Update Profile Picture
            </button>
          </div>
        </div>
      )}
    </div>
  );  
};

export default ProfilePicture;