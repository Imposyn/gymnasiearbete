import React, { useEffect } from 'react';

const MyCommentsSection = ({ myComments }) => {
  useEffect(() => {
  }, [myComments]);

  return (
    <div>
      <h3>My Comments</h3>
      <ul>
      {myComments.map((comment, index) => (
    <li key={index}>
        <p>Comments: {comment.Content}</p>
    </li>
))}
      </ul>
    </div>
  );
};

export default MyCommentsSection;