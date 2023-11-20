import React, { useState, useEffect } from 'react';

const BlockUserButton = ({ blockedUserId, authToken, onUnblock, isInProfile }) => {
  const [message, setMessage] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (authToken && blockedUserId !== undefined) {
      // Make an API request to check if the user is blocked
      fetch('http://localhost:8000/check-user-blocked-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          userId: blockedUserId,
        }),
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Failed to check user block status');
        })
        .then((data) => {
          // Set isBlocked based on the response from the server
          setIsBlocked(data.blocked);
        })
        .catch((error) => {
          setMessage('Error checking user block status');
          console.error('Error checking user block status:', error);
        });
    }
  }, [authToken, blockedUserId]);

  const handleUnblockUser = async () => {
    if (blockedUserId === undefined) {
      setMessage('Invalid user ID');
      return;
    }

    // Continue with unblock user logic
    try {
      const response = await fetch('http://localhost:8000/unblock-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          blockedUserId: blockedUserId,
        }),
      });

      if (response.ok) {
        // Check if the user was successfully unblocked
        setMessage('User unblocked successfully');
        setIsBlocked(false); // Set isBlocked to false
        if (onUnblock) {
          onUnblock(); // Handle unblocking action
        }
      } else {
        setMessage('Error unblocking user');
      }
    } catch (error) {
      setMessage('Error unblocking user');
      console.error('Error unblocking user:', error);
    }
  };

  return (
    <div>
      {isBlocked && isInProfile ? (
        <button className="buttons" onClick={handleUnblockUser}>
          Unblock User
        </button>
      ) : (
        <div className="success">
        </div>
      )}
      {message && (
        <div className={message.includes('successfully') ? 'success' : 'error'}>
          {message}
        </div>
      )}
    </div>
  );
};

export default BlockUserButton;