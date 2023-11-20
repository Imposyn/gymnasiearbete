import React from 'react';
import './App.css';

const MyPostsSection = ({ myPosts, navigateToPost }) => {
  return (
    <div>
      <h3>My Posts</h3>
      <ul className="my-posts-list">
        {myPosts.map((post, index) => (
          <li
            key={index}
            onClick={() => navigateToPost(post.PostID)}
            className="my-post-item"
          >
            <p className="my-post-title">Title: {post.Title}</p>
            <p>Content: {post.Content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MyPostsSection;