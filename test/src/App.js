import React, { useState, useEffect } from 'react';
import PostList from './PostList';
import PostDetails from './PostDetails';
import CreatePost from './CreatePost';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import Profile from './Profile';
import './App.css';
import logo from './logo.png';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginVisible, setIsLoginVisible] = useState(false);
  const [isSignupVisible, setIsSignupVisible] = useState(false);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [token, setToken] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [posts, setPosts] = useState([]);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [showSignupLink, setShowSignupLink] = useState(false);  

useEffect(() => {
  const handleKeyDown = (event) => {
    // Check if the pressed key is 'Tab', 'Enter', or 'Space'
    if (event.key === 'Tab') {
      // Scroll down to the posts when Tab is pressed
      const postListElement = document.getElementById('postList');
      if (postListElement) {
        postListElement.scrollIntoView();
      }
    } else if (event.key === 'Enter') {
      // Perform the click action when Enter is pressed
      // You can customize this based on the current focused element
      // For example, you can use refs to track the focused element
      // and trigger its click method
      if (document.activeElement && document.activeElement.click) {
        document.activeElement.click();
      }
    } else if (event.key === ' ' || event.key === 'Spacebar') {
      // Trigger an action when the Spacebar is pressed
      if (document.activeElement && document.activeElement.click) {
        document.activeElement.click();
      }
    }
  };  

  // Add event listeners for keyboard navigation
  document.addEventListener('keydown', handleKeyDown);

  // Clean up the event listener when the component unmounts
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}, []);
  
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    if (storedToken) {
      setIsLoggedIn(true);
      setToken(storedToken);
      setUsername(storedUsername);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchProfilePicture();
      fetchPosts();
    }
  }, [isLoggedIn]);

  useEffect(() => {
  }, [isSignupVisible]);  

  const showLogin = () => {
    setIsLoginVisible(true);
    setIsSignupVisible(false);
    setShowSignupLink(true);
  };

  const showSignup = (e) => {
    e.preventDefault();
    setIsSignupVisible(true);
    setIsLoginVisible(false); 
    setShowSignupLink(true);
  };  

  const handlePostSelect = (post) => {
    setSelectedPost(post);
  };

  const handleBackToPosts = () => {
    setSelectedPost(null);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken(null);
    setUsername('');
    setIsProfileVisible(false);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.alert('You have been logged out successfully.');
  };

  const handleLogoClick = () => {
    setIsProfileVisible(false);
    setSelectedPost(null);
    setIsLoginVisible(false);
    setIsSignupVisible(false);
    fetchPosts();
  };  

  const handleCommentSubmit = (commentData) => {
    const { postId, commentText } = commentData;

    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.PostID === postId) {
          const updatedPost = { ...post };
          if (!updatedPost.comments) {
            updatedPost.comments = [];
          }
          updatedPost.comments.push({ text: commentText, username });
          return updatedPost;
        }
        return post;
      })
    );
  };

  const fetchPosts = () =>  {
    const searchParams = new URLSearchParams();
  
    // Add search term
    if (searchTerm) {
      searchParams.append('search', searchTerm);
  
      // Check if it's a tag-based search
      const tagSearch = searchTerm.trim().toLowerCase();
      const tagSearchWithoutHash = tagSearch.startsWith('#') ? tagSearch.slice(1) : tagSearch;
  
      // Use the dedicated endpoint for fetching posts by tag
      fetch(`http://localhost:8000/api/posts/tag/${tagSearchWithoutHash}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          setPosts(data.posts);
        })
        .catch((error) => {
          console.error('Error fetching posts by tag:', error);
          setMessage('Error fetching posts');
        });
  
      // Don't proceed to the regular endpoint for tag-based searches
      return;
    }
  
    // If not a tag-based search, use the regular endpoint
    fetch(`http://localhost:8000/posts?${searchParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setPosts(data);
      })
      .catch((error) => {
        console.error('Error fetching posts:', error);
        setMessage('Error fetching posts');
      });
  };  

  const fetchProfilePicture = async () => {
    try {
      const response = await fetch('http://localhost:8000/get-profile-picture', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
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

  return (
    <div>
      <div className="header">
        <img
          src={logo}
          alt="Logo"
          className="logo"
          onClick={handleLogoClick}
        />
<div className="search-bar">
  <input
    type="text"
    placeholder="Tag"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
  <button className="buttons" onClick={fetchPosts}>
    Search
  </button>
</div>
  
        <div className={isLoggedIn ? 'auth-buttons' : 'buttons'}>
  {!isLoggedIn && (
    <button className="buttons" onClick={showLogin}>
      Login
    </button>
  )}
  
  {!isLoggedIn && showSignupLink && (
    <span className="signup-link" onClick={showSignup}>
    </span>
  )}

  {isLoggedIn && (
    <button className="auth-button-color" onClick={handleLogout}>
      Logout
    </button>
  )}

  {isLoggedIn && (
    <button onClick={() => setIsProfileVisible(true)}>
      {profilePictureUrl ? (
        <img
          src={profilePictureUrl}
          alt="Profile"
          style={{
            maxWidth: '25px',
            maxHeight: '25px',
            width: 'auto',
            height: 'auto',
            borderRadius: '50%',
          }}
        />
      ) : (
        <span>Profile</span>
      )}
    </button>
  )}
</div>
</div>
      {isLoginVisible && !isLoggedIn && (
        <>
          <LoginForm
            onLogin={(loggedIn, authToken, username) => {
              setIsLoggedIn(loggedIn);
              setToken(authToken);
              setUsername(username);
              localStorage.setItem('token', authToken);
              localStorage.setItem('username', username);
              setIsSignupVisible(false);
            }}
          />
          {showSignupLink && (
            <span className="signup-link" onClick={showSignup}>
              New to Riddet? <span style={{ color: '#002bff' }}>Sign Up</span>
            </span>
          )}
        </>
      )}
  
      {isSignupVisible && !isLoggedIn && (
        <>
          <SignupForm setMessage={setMessage} />
          {message && <div className="message">{message}</div>}
          <span className="signup-link" onClick={showLogin}>
            Already a Riddetor? <span style={{ color: '#002bff' }}>Login</span>
          </span>
        </>
      )}
  
      {isProfileVisible && isLoggedIn && (
        <Profile authToken={token}/>
      )}
  
      {isLoggedIn && !isProfileVisible && (
        <CreatePost
          isLoggedIn={isLoggedIn}
          token={token}
          setMessage={setMessage}
          fetchPosts={fetchPosts}
        />
      )}
  
      {(!isLoginVisible || isLoggedIn) && !selectedPost && !isSignupVisible && !isProfileVisible && (
        <>
          <PostList
            id="postList"
            posts={posts}
            onPostSelect={handlePostSelect}
            onCommentSubmit={handleCommentSubmit}
            isLoggedIn={isLoggedIn}
            username={username}
            setMessage={setMessage}
          />
          {message && <div className="message">{message}</div>}
        </>
      )}
  
      {selectedPost && (
        <PostDetails
          post={selectedPost}
          onBackClick={handleBackToPosts}
          authToken={token}
          onCommentSubmit={handleCommentSubmit}
          isLoggedIn={isLoggedIn}
          username={username}
          setMessage={setMessage}
        />
      )}
    </div>
  );
  };
    
  export default App;  