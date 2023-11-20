import React, { useState, useEffect } from 'react';

const SavedPostsSection = ({ authToken }) => {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the saved posts when the component is mounted
    fetchSavedPosts();
  }, []);

  const fetchSavedPosts = async () => {
    try {
      // Make a GET request to the API endpoint to fetch saved posts
      const response = await fetch('http://localhost:8000/saved-posts', {
        method: 'GET', // Added 'method' key
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      
      if (!response.ok) {
        console.error('Error fetching saved posts:', response.statusText); // Log error message
        throw new Error('Error fetching saved posts');
      }

      const data = await response.json();
      setSavedPosts(data);
      setLoading(false); // Data has been loaded
    } catch (error) {
      console.error('Error fetching saved posts:', error);
      setLoading(false); // Error occurred
    }
  };

  return (
    <div>
      <h3>Saved Posts</h3>
      {loading ? (
        <p>Loading saved posts...</p>
      ) : savedPosts.length === 0 ? (
        <p>No posts are currently saved.</p>
      ) : (
        <ul>
        {savedPosts.map((post, index) => (
          <li key={post.PostID + '-' + index}>
            <h4>{post.Title}</h4>
            <p>{post.Content}</p>
          </li>
        ))}
      </ul>      
      )}
    </div>
  );
};

export default SavedPostsSection;