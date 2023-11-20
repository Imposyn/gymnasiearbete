import React, { useState } from 'react';

const CreatePost = ({ isLoggedIn, token, setMessage }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [createdPost, setCreatedPost] = useState(null);

  const handleCreatePost = async () => {
    const titleCharacterLimit = 50;
    const contentCharacterLimit = 280;
  
    if (!title.trim() || !content.trim()) {
      setMessage('Title and/or content cannot be empty');
      return;
    }
  
    if (title.trim().length > titleCharacterLimit) {
      setMessage(`Title exceeds the character limit of ${titleCharacterLimit} characters.`);
      return;
    }
  
    if (content.trim().length > contentCharacterLimit) {
      setMessage(`Content exceeds the character limit of ${contentCharacterLimit} characters.`);
      return;
    }
  
    try {
      const response = await fetch('http://localhost:8000/create-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Error creating post');
      }
  
      const data = await response.json();
      setCreatedPost(data.post);
      setMessage('Post created successfully');
    } catch (error) {
      setMessage('Error creating post');
      console.error('Error creating post:', error);
    }
  };  

  return (
    <div>
      <h2>Create Post</h2>
      <div>
        <label htmlFor="title">Title:</label>
        <br />
        <input
          type="text"
          id="title"
          placeholder="Enter title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
      <br />
        <label htmlFor="content">Content:</label>
        <br />
        <textarea
          id="content"
          placeholder="Enter content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      <button className="buttons" onClick={handleCreatePost}>Create Post</button>

      {createdPost && (
        <div>
          <h3>Created Post</h3>
          <p>Title: {createdPost.Title}</p>
          <p>Content: {createdPost.Content}</p>
        </div>
      )}
    </div>
  );
};

export default CreatePost;