import React from 'react';
import BlockUserButton from './BlockUserButton'; 

const BlockedUsersSection = ({ blockedUsers, authToken }) => {
  
  return (
    <div>
      <h3>Blocked Users</h3>
      {blockedUsers.length === 0 ? (
        <p>No users are currently blocked.</p>
      ) : (
        <ul>
          {blockedUsers.map((user) => (
            <li key={user.UserID}>
              {user.Username}
              {user.UserID && (
                <BlockUserButton
                  blockedUserId={user.UserID}
                  authToken={authToken}
                  isInProfile={true} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BlockedUsersSection;