import React, { useState, useEffect } from 'react';

const PostList = ({ posts, isLoggedIn, username, token, onCommentSubmit, onPostSelect }) => {
  const [commentTexts, setCommentTexts] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (posts.length > 0) {
      const initialCommentTexts = {};
      posts.forEach((post) => {
        initialCommentTexts[post.PostID] = '';
      });
      setCommentTexts(initialCommentTexts);
    }
  }, [posts]);

  const handleCommentSubmit = (postId) => {
    const commentText = commentTexts[postId];
    if (!commentText) {
      alert('Please enter a comment.');
      return;
    }

    fetch('http://localhost:8000/add-comment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        postId,
        commentText,
      }),
    })
      .then((response) => response.json())
      .then(() => {
        setCommentTexts((prevTexts) => ({
          ...prevTexts,
          [postId]: '', // Reset comment text for the respective post
        }));

        onCommentSubmit({ postId, commentText });
      })
      .catch((error) => console.error('Error adding comment:', error));
  };
  const handlePostItemClick = (post) => {
    onPostSelect(post);
  };

  const handleKeyDown = (event, post) => {
    if (event.key === 'Enter') {
      handlePostItemClick(post);
    }
  };

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPosts = posts.slice(startIndex, endIndex).reverse();

  return (
    <div>
      <h2>Post List</h2>
      {paginatedPosts.length > 0 ? (
        paginatedPosts.map((post) => (
          <div
            key={post.PostID}
            className="post-item"
            onClick={() => handlePostItemClick(post)}
            onKeyDown={(e) => handleKeyDown(e, post)}
            tabIndex="0"
            role="button"
          >
            <h3>{post.Title}</h3>
            <p>{post.Content}</p>
          </div>
        ))
      ) : (
        <p>No posts</p>
      )}
      <div>
        <button
          className="buttons"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prevPage) => Math.max(prevPage - 1, 1))}
        >
          Previous Page
        </button>
        <span className="bold-text">Page {currentPage} of {Math.ceil(posts.length / pageSize)}</span>
        <button
          className="buttons"
          disabled={endIndex >= posts.length}
          onClick={() => setCurrentPage((prevPage) => Math.min(prevPage + 1, Math.ceil(posts.length / pageSize)))}
        >
          Next Page
        </button>
      </div>
    </div>
  );
};

export default PostList;