const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = 8000;
const bcrypt = require('bcrypt');
const cors = require('cors');
const blockedUsers = new Set();
const swaggerUi = require('swagger-ui-express');
const fs = require("fs")
const YAML = require('yaml')
const file  = fs.readFileSync('./OpenAPI.yml', 'utf8')
const swaggerDocument = YAML.parse(file)

app.use('/documentation', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const jwtSecret = process.env.JWT_SECRET || 'YourDefaultSecretKey';

const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'admin',
  password: 'Yakup@123',
  database: 'platform',
});

app.use(bodyParser.json());
app.use(cors());
require('dotenv').config();
app.use(express.json());

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

app.post('/signup', (req, res) => {
  const { username, password } = req.body;


  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide a username and password.' });
  }


  const checkUsernameQuery = 'SELECT * FROM UserAccounts WHERE Username = ?';
  db.query(checkUsernameQuery, [username], (checkUsernameError, checkUsernameResults) => {
    if (checkUsernameError) {
      console.error('Error checking username:', checkUsernameError);
      return res.status(500).json({ message: 'Database error while checking username.' });
    } else if (checkUsernameResults.length > 0) {
      return res.status(400).json({ message: 'Username is already in use.' });
    } else {
      
      bcrypt.hash(password, 10, (hashError, hashedPassword) => {
        if (hashError) {
          console.error('Error hashing password:', hashError);
          return res.status(500).json({ message: 'Error hashing password.' });
        }

        const insertUserQuery = 'INSERT INTO UserAccounts (Username, PasswordHash) VALUES (?, ?)';
        db.query(insertUserQuery, [username, hashedPassword], (error, results) => {
          if (error) {
            console.error('Error signing up:', error);
            return res.status(500).json({ message: 'Database error while signing up.' });
          } else {
            return res.json({ message: 'Signup successful' });
          }
        });
      });
    }
  });
});

app.post('/login', (req, res) => {
  const { usernameOrEmail, password } = req.body;

  
  if (!usernameOrEmail || !password) {
    return res.status(400).json({ message: 'Please provide both username/email and password.' });
  }

  const sql = 'SELECT * FROM UserAccounts WHERE (Username = ? OR Email = ?)';
  db.query(sql, [usernameOrEmail, usernameOrEmail], (error, results) => {
    if (error) {
      console.error('Error logging in (query):', error);
      return res.status(500).json({ message: 'Database error while logging in.' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = results[0];

    if (!user.PasswordHash) {
      return res.status(500).json({ message: 'User has no password hash' });
    }

    const hashedPassword = user.PasswordHash.toString();

    bcrypt.compare(password, hashedPassword, (compareError, isMatch) => {
      if (compareError) {
        console.error('Error comparing passwords:', compareError);
        return res.status(500).json({ message: 'Error comparing passwords.' });
      }

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const authToken = jwt.sign({ userId: user.UserID }, jwtSecret, { expiresIn: '72h' });
      res.json({ message: 'Login successful', token: authToken });
    });
  });
});

app.post('/create-post', authenticateToken, (req, res) => {
  const { title, content } = req.body;
  const token = req.headers.authorization.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decodedToken = jwt.verify(token, jwtSecret);
    const userId = decodedToken.userId;
    const createdAt = new Date();

    const sql = 'INSERT INTO Posts (Title, Content, CreatedAt, UserID) VALUES (?, ?, ?, ?)';

    db.query(sql, [title, content, createdAt, userId], (error, results) => {
      if (error) {
        console.error('Error creating post:', error);
        return res.status(500).json({ message: 'Error creating post' });
      }

      const postId = results.insertId;
      const selectPostSQL = 'SELECT * FROM Posts WHERE PostID = ?';
      db.query(selectPostSQL, [postId], (error, postResults) => {
        if (error) {
          console.error('Error fetching created post:', error);
          return res.status(500).json({ message: 'Error fetching created post' });
        }

        const createdPost = postResults[0];
        return res.json({ message: 'Post created successfully', post: createdPost });
      });
    });
  } catch (error) {
    console.error('Error decoding token:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
});

app.get('/get-posts', (req, res) => {
  
  const sql = `
    SELECT p.*, c.Content AS CommentContent, c.CreatedAt AS CommentCreatedAt
    FROM Posts p
    LEFT JOIN Comments c ON p.PostID = c.PostID
    ORDER BY c.CreatedAt DESC`;

  db.query(sql, (error, results) => {
    if (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ message: 'Error fetching posts' });
    } else {
      const postsWithComments = results.reduce((acc, curr) => {
        const postId = curr.PostID;

        if (!acc[postId]) {
          acc[postId] = {
            PostID: curr.PostID,
            Title: curr.Title,
            Content: curr.Content,
            CreatedAt: curr.CreatedAt,
            LastModifiedAt: curr.LastModifiedAt,
            Visibility: curr.Visibility,
            LatestComment: {
              Content: curr.CommentContent,
              CreatedAt: curr.CommentCreatedAt,
            },
          };
        } else {
         
          const latestComment = acc[postId].LatestComment;
          if (curr.CommentCreatedAt > latestComment.CreatedAt) {
            acc[postId].LatestComment = {
              Content: curr.CommentContent,
              CreatedAt: curr.CommentCreatedAt,
            };
          }
        }

        return acc;
      }, {});

      
      const postsArray = Object.values(postsWithComments);
      res.json({ posts: postsArray });
    }
  });
});

app.get('/posts', (req, res) => {
  const sql = 'SELECT * FROM Posts';

  db.query(sql, (error, results) => {
    if (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ message: 'Error fetching posts' });
    } else {
      res.json(results);
    }
  });
});

app.post('/add-comment', (req, res) => {
  const { postId, commentText } = req.body;
  const token = req.headers.authorization.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  try {
   
    const decodedToken = jwt.verify(token, jwtSecret);
    const userId = decodedToken.userId;

    const sql = 'INSERT INTO Comments (PostID, UserID, Content, CreatedAt, DisplayOrder) VALUES (?, ?, ?, NOW(), ?)';

    db.query(sql, [postId, userId, commentText, 100], (error, results) => {
      if (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Comment could not be added' });
      } else {
        res.json({ message: 'Comment added successfully' });
      }
    });
  } catch (error) {
    console.error('Error decoding token:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

app.get('/comments/:postId', (req, res) => {
  const postId = req.params.postId;

  const sql = `
  SELECT c.CommentID, c.Content, c.CreatedAt, c.UserID, c.ParentCommentID, u.Username
  FROM Comments c
  INNER JOIN UserAccounts u ON c.UserID = u.UserID
  WHERE c.PostID = ?`;

  db.query(sql, [postId], (error, results) => {
    if (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ error: 'Unable to fetch comments' });
    } else {
      const commentsWithUserIds = results.map((comment) => ({
        CommentID: comment.CommentID,
        Content: comment.Content,
        CreatedAt: comment.CreatedAt,
        Username: comment.Username,
        UserID: comment.UserID, 
        ParentCommentID: comment.ParentCommentID,
      }));
      res.json({ comments: commentsWithUserIds });
    }
  });
});

app.get('/comments', (req, res) => {
  const sql = `
    SELECT c.CommentID, c.Content, c.CreatedAt, u.Username
    FROM Comments c
    INNER JOIN UserAccounts u ON c.UserID = u.UserID`;

  db.query(sql, (error, results) => {
    if (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ error: 'Unable to fetch comments' });
    } else {
      const commentsWithUsernames = results.map((comment) => ({
        CommentID: comment.CommentID,
        Content: comment.Content,
        CreatedAt: comment.CreatedAt,
        Username: comment.Username,
      }));
      res.json({ comments: commentsWithUsernames });
    }
  });
});

app.put('/update-comment/:commentId', authenticateToken, (req, res) => {
  const { commentId } = req.params;
  const { updatedCommentText } = req.body;
  const userId = req.user.userId;

  const updateCommentSQL = 'UPDATE Comments SET Content = ?, LastModifiedAt = CURRENT_TIMESTAMP WHERE CommentID = ? AND UserID = ?';

  db.query(updateCommentSQL, [updatedCommentText, commentId, userId], (error, results) => {
    if (error) {
      console.error('Error updating comment:', error);
      res.status(500).json({ message: 'Error updating comment' });
    } else if (results.affectedRows === 0) {
      res.status(403).json({ message: 'Unauthorized or comment not found' });
    } else {
      res.json({ message: 'Comment updated successfully' });
    }
  });
});

// Add reply route
app.post('/add-reply', (req, res) => {
  const { post_id, user_id, content, parent_comment_id } = req.body;
  const token = req.headers.authorization.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  try {
    const decodedToken = jwt.verify(token, jwtSecret);
    const userId = decodedToken.userId;

    const sql = 'INSERT INTO Comments (PostID, UserID, Content, ParentCommentID, CreatedAt, DisplayOrder) VALUES (?, ?, ?, ?, NOW(), ?)';

    db.query(sql, [post_id, userId, content, parent_comment_id, 100], (error, results) => {
      if (error) {
        console.error('Error adding reply:', error);
        res.status(500).json({ message: 'Reply could not be added' });
      } else {
        res.json({ message: 'Reply added successfully' });
      }
    });
  } catch (error) {
    console.error('Error decoding token:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

app.put('/update-profile', authenticateToken, (req, res) => {
  const { email } = req.body;
  const userId = req.user.userId;

  const updateProfileSQL = 'UPDATE UserAccounts SET Email = ? WHERE UserID = ?';
  
  db.query(updateProfileSQL, [email, userId], (error, results) => {
    if (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'Update failed. ' + error.message });
    } else {
      res.json({ message: 'Profile updated successfully' });
    }
  });
});

app.get('/post/:postId', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const postId = req.params.postId;

  const deleteUserSQL = 'DELETE FROM UserAccounts WHERE UserID=?';

  db.query(deleteUserSQL, [userId], (error, results) => {
    if (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ message: 'Error fetching posts' });
    } else {
      res.json(results);
    }
  });
});

app.get('/posts', (req, res) => {
  const sql = 'SELECT * FROM Posts';

  db.query(sql, (error, results) => {
    if (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ message: 'Error fetching posts' });
    } else {
      res.json(results);
    }
  });
});


app.get('/posts/user/:userId', (req, res) => {
  const userId = req.params.userId;

  const sql = `
  SELECT p.*, u.Username as Author
  FROM Posts p
  INNER JOIN UserAccounts u ON p.UserID = u.UserID
  WHERE p.UserID = ?`;

  db.query(sql, [userId], (error, results) => {
    if (error) {
      console.error('Error fetching user posts:', error);
      res.status(500).json({ message: 'Error fetching user posts' });
    } else {
      res.json(results);
    }
  });
});

app.get('/users/:userId', (req, res) => {
  const userId = req.params.userId;
  const selectUserSQL = 'SELECT UserID, Username, Email FROM UserAccounts WHERE UserID = ?';

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decodedToken = jwt.verify(token, jwtSecret);
    const userId = decodedToken.userId;
    const createdAt = new Date();

    const sql = 'INSERT INTO Posts (UserID, Title, Content, CreatedAt, Visibility) VALUES (?, ?, ?, ?, ?)';

    db.query(sql, [userId, title, content, createdAt, visibility], (error, results) => {
      if (error) {
        console.error('Error creating post:', error);
        return res.status(500).json({ message: 'Error creating post' });
      }

      console.log('Post created successfully:', { title, content, createdAt, userId });

      
      const postId = results.insertId;
      const selectPostSQL = 'SELECT * FROM Posts WHERE PostID = ?';
      db.query(selectPostSQL, [postId], (error, postResults) => {
        if (error) {
          console.error('Error fetching created post:', error);
          return res.status(500).json({ message: 'Error fetching created post' });
        }

        const createdPost = postResults[0];
        return res.json({ message: 'Post created successfully', post: createdPost });
      });
    });
  } catch (error) {
    console.error('Error decoding token:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
});


app.put('/update-about-me', authenticateToken, (req, res) => {
  const { aboutMe } = req.body;
  const userId = req.user.userId;

  const updateAboutMeSQL = 'UPDATE UserAccounts SET Biography = ? WHERE UserID = ?';

  db.query(updateAboutMeSQL, [aboutMe, userId], (error, results) => {
    if (error) {
      console.error('Error updating About Me:', error);
      res.status(500).json({ message: 'Update failed' });
    } else {
      res.json({ message: 'About Me updated successfully' });
    }
  });
});

app.get('/about-me', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  const selectBioSQL = 'SELECT Biography FROM UserAccounts WHERE UserID = ?';

  db.query(selectBioSQL, [userId], (error, results) => {
    if (error) {
      console.error('Error fetching Biography:', error); 
      res.status(500).json({ message: 'Error fetching Biography' });
    } else if (results.length > 0) {
      const bio = results[0].Biography;
      res.json({ aboutMe: bio });
    } else {
      console.error('User not found');
      res.status(404).json({ message: 'User not found' });
    }
  });
});

app.get('/saved-posts', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  const selectSavedPostsSQL = 'SELECT sp.PostID, p.Title, p.Content FROM SavedPosts sp INNER JOIN Posts p ON sp.PostID = p.PostID WHERE sp.UserID = ?';

  db.query(selectSavedPostsSQL, [userId], (error, results) => {
    if (error) {
      console.error('Error fetching saved posts:', error);
      res.status(500).json({ message: 'Error fetching saved posts' });
    } else {
      // Extract the saved post IDs and additional post information
      res.json(results);
    }
  });
});

app.get('/get-current-email', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  const getEmailSQL = 'SELECT Email FROM UserAccounts WHERE UserID = ?';
  
  db.query(getEmailSQL, [userId], (error, results) => {
    if (error) {
      console.error('Error fetching current email:', error);
      res.status(500).json({ message: 'Error fetching email' });
    } else if (results.length === 0) {
      res.status(404).json({ message: 'Email not found' });
    } else {
      res.json({ email: results[0].Email });
    }
  });
});

app.get('/get-current-about-me', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  const selectAboutMeSQL = 'SELECT Biography FROM UserAccounts WHERE UserID = ?';
  
  db.query(selectAboutMeSQL, [userId], (error, results) => {
    if (error) {
      console.error('Error fetching About Me:', error);
      return res.status(500).json({ message: 'Error fetching About Me', error: error.message });
    } else if (results.length > 0) {
      const aboutMe = results[0].Biography;
      res.json({ aboutMe });
    } else {
      console.error('User not found');
      res.status(404).json({ message: 'User not found' });
    }
  });
});

app.get('/posts/:postId', (req, res) => {
  const postId = req.params.postId;

  const sql = `
    SELECT p.*, u.Username as Author, c.CommentID
FROM Posts p
INNER JOIN UserAccounts u ON p.UserID = u.UserID
LEFT JOIN Comments c ON p.PostID = c.PostID
WHERE p.PostID = ?;`;
    

  db.query(sql, [postId], (error, results) => {
    if (error) {
      console.error('Error fetching post details:', error);
      res.status(500).json({ message: 'Error fetching post details' });
    } else if (results.length > 0) {
      const postDetails = results[0];
      res.json({ message: 'Post details retrieved successfully', post: postDetails });
    } else {
      res.status(404).json({ message: 'Post not found' });
    }
  });
});

app.get('/my-posts', authenticateToken, (req, res) => {
  const userId = req.user.userId;

 
  const sql = `
    SELECT p.*
    FROM Posts p
    WHERE p.UserID = ?`;

  db.query(sql, [userId], (error, results) => {
    if (error) {
      console.error('Error fetching user posts:', error);
      res.status(500).json({ message: 'Error fetching user posts' });
    } else {
      res.json(results);
    }
  });
});

app.get('/my-comments', authenticateToken, (req, res) => {
  const userId = req.user.userId; 

  const sql = `
    SELECT c.*
    FROM Comments c
    WHERE c.UserID = ?`;

  db.query(sql, [userId], (error, results) => {
    if (error) {
      console.error('Error fetching user comments:', error);
      res.status(500).json({ message: 'Error fetching user comments' });
    } else {
      res.json(results);
    }
  });
});

app.post('/block-user', authenticateToken, (req, res) => {
  const { blockedUserId } = req.body;
  const userId = req.user.userId;

  const insertBlockSQL = 'INSERT INTO BlockedUsers (BlockingUserID, BlockedUserID) VALUES (?, ?)';

  db.query(insertBlockSQL, [userId, blockedUserId], (error, results) => {
    if (error) {
      console.error('Error blocking user:', error);
      res.status(500).json({ message: 'Error blocking user' });
    } else {
      res.json({ message: 'User blocked successfully' });
    }
  });
});

app.get('/blocked-users', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  const selectBlockedUsersSQL = 'SELECT u.UserID, u.Username FROM BlockedUsers b INNER JOIN UserAccounts u ON b.BlockedUserID = u.UserID WHERE b.BlockingUserID = ?';

  db.query(selectBlockedUsersSQL, [userId], (error, results) => {
    if (error) {
      console.error('Error fetching blocked users:', error);
      res.status(500).json({ message: 'Error fetching blocked users' });
    } else {
      res.json(results);
    }
  });
});

app.post('/check-user-blocked-status', authenticateToken, (req, res) => {
  const { userId } = req.body;
  const blockingUserId = req.user.userId; // Assuming you get the blocking user from authentication

  const selectBlockedStatusSQL = 'SELECT * FROM BlockedUsers WHERE BlockingUserID = ? AND BlockedUserID = ?';

  db.query(selectBlockedStatusSQL, [blockingUserId, userId], (error, results) => {
    if (error) {
      console.error('Error checking user blocked status:', error);
      res.status(500).json({ blocked: false, error: 'Error checking user blocked status' });
    } else {
      // Check if there is a result in the query
      const blocked = results.length > 0;
      res.status(200).json({ blocked });
    }
  });
});

app.post('/unblock-user', authenticateToken, (req, res) => {
  const { blockedUserId } = req.body;
  const userId = req.user.userId;

  const deleteBlockSQL = 'DELETE FROM BlockedUsers WHERE BlockingUserID = ? AND BlockedUserID = ?';

  db.query(deleteBlockSQL, [userId, blockedUserId], (error, results) => {
    if (error) {
      console.error('Error unblocking user:', error);
      res.status(500).json({ message: 'Error unblocking user' });
    } else {
      res.json({ message: 'User unblocked successfully' });
    }
  });
});

app.post('/save-post', authenticateToken, (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user.userId;

    if (!postId || !userId) {
      console.error('Invalid request data');
      return res.status(400).json({ message: 'Invalid request data' });
    }

    console.log('Saving post for user:', userId, 'Post ID:', postId);

    const insertSavedPostSQL = 'INSERT INTO SavedPosts (UserID, PostID) VALUES (?, ?)';

    db.query(insertSavedPostSQL, [userId, postId], (error, results) => {
      if (error) {
        console.error('Error saving post:', error);
        return res.status(500).json({ message: 'Error saving post' });
      }

      console.log('Post saved successfully for user:', userId, 'Post ID:', postId);

      res.json({ message: 'Post saved successfully' });
    });
  } catch (error) {
    console.error('Error decoding token:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
});

app.get('/other-users', (req, res) => {
  const selectOtherUsersSQL = 'SELECT UserID, Username, Email, Biography FROM UserAccounts';

  db.query(selectOtherUsersSQL, (error, results) => {
    if (error) {
      console.error('Error fetching other users:', error);
      res.status(500).json({ message: 'Error fetching other users' });
    } else {
      res.json(results);
    }
  });
});

app.put('/update-comment/:commentId', authenticateToken, (req, res) => {
  const { commentId } = req.params;
  const { updatedCommentText } = req.body;
  const userId = req.user.userId;

  const updateCommentSQL = 'UPDATE Comments SET Content = ?, LastModifiedAt = CURRENT_TIMESTAMP WHERE CommentID = ? AND UserID = ?';

  db.query(updateCommentSQL, [updatedCommentText, commentId, userId], (error, results) => {
    if (error) {
      console.error('Error updating comment:', error);
      res.status(500).json({ message: 'Error updating comment' });
    } else if (results.affectedRows === 0) {
      res.status(403).json({ message: 'Unauthorized or comment not found' });
    } else {
      res.json({ message: 'Comment updated successfully' });
    }
  });
});

app.put('/update-post/:postId', authenticateToken, (req, res) => {
  const { postId } = req.params;
  const { updatedTitle, updatedContent, updatedVisibility } = req.body;
  const userId = req.user.userId;
  const updatePostSQL = 'UPDATE Posts SET Title = ?, Content = ?, Visibility = ?, LastModifiedAt = CURRENT_TIMESTAMP WHERE PostID = ? AND UserID = ?';
  db.query(updatePostSQL, [updatedTitle, updatedContent, updatedVisibility, postId, userId], (error, results) => {
    if (error) {
      console.error('Error updating post:', error);
      res.status(500).json({ message: 'Error updating post' });
    } else if (results.affectedRows === 0) {
      res.status(403).json({ message: 'Unauthorized or post not found' });
    } else {
      res.json({ message: 'Post updated successfully' });
    }
  });
});

app.post('/api/tags', (req, res) => {
  const { name, postId } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Tag name is required' });
  }

  const insertTagQuery = 'INSERT INTO Tags (name, PostID) VALUES (?, ?)';

  db.query(insertTagQuery, [name, postId], (error, results) => {
    if (error) {
      console.error('Error creating tag:', error);
      return res.status(500).json({ message: 'Error creating tag' });
    }
    return res.status(201).json({ message: 'Tag created and associated with the post successfully' });
  });
});

app.get('/api/tags/:postId', (req, res) => {
  const postId = req.params.postId;

  const selectTagQuery = 'SELECT name FROM Tags WHERE PostID = ?';

  db.query(selectTagQuery, [postId], (error, results) => {
    if (error) {
      console.error('Error fetching tag:', error);
      return res.status(500).json({ message: 'Error fetching tag' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Tag not found for the post' });
    }

    const tag = results[0];
    return res.status(200).json({ tag });
  });
});

// Upvote a Post
app.post('/api/posts/:postId/upvote', authenticateToken, (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.userId;
  // Check if the user has already voted on this post
  const upvoteQuery = 'SELECT * FROM Votes WHERE UserID = ? AND PostID = ? AND VoteType = ?';
  db.query(upvoteQuery, [userId, postId, 'upvote'], (upvoteError, upvoteResults) => {
    if (upvoteError) {
      console.error('Error checking upvote:', upvoteError);
      return res.status(500).json({ message: 'Error checking upvote' });
    }

    if (upvoteResults.length > 0) {
      return res.status(400).json({ message: 'User has already upvoted this post' });
    }

    // Check if the user has downvoted this post
    const downvoteQuery = 'SELECT * FROM Votes WHERE UserID = ? AND PostID = ? AND VoteType = ?';
    db.query(downvoteQuery, [userId, postId, 'downvote'], (downvoteError, downvoteResults) => {
      if (downvoteError) {
        console.error('Error checking downvote:', downvoteError);
        return res.status(500).json({ message: 'Error checking downvote' });
      }

      if (downvoteResults.length > 0) {
        return res.status(400).json({ message: 'User has already downvoted this post' });
      }

      // If the user has not voted on this post, insert an upvote
      const insertUpvoteQuery = 'INSERT INTO Votes (UserID, PostID, VoteType) VALUES (?, ?, ?)';
      db.query(insertUpvoteQuery, [userId, postId, 'upvote'], (insertError) => {
        if (insertError) {
          console.error('Error upvoting post:', insertError);
          return res.status(500).json({ message: 'Error upvoting post' });
        }
        return res.status(200).json({ message: 'Upvoted post successfully' });
      });
    });
  });
});

// Downvote a Post
app.post('/api/posts/:postId/downvote', authenticateToken, (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.userId;

  // Check if the user has already voted on this post
  const downvoteQuery = 'SELECT * FROM Votes WHERE UserID = ? AND PostID = ? AND VoteType = ?';
  db.query(downvoteQuery, [userId, postId, 'downvote'], (downvoteError, downvoteResults) => {
    if (downvoteError) {
      console.error('Error checking downvote:', downvoteError);
      return res.status(500).json({ message: 'Error checking downvote' });
    }

    if (downvoteResults.length > 0) {
      return res.status(400).json({ message: 'User has already downvoted this post' });
    }

    // Check if the user has upvoted this post
    const upvoteQuery = 'SELECT * FROM Votes WHERE UserID = ? AND PostID = ? AND VoteType = ?';
    db.query(upvoteQuery, [userId, postId, 'upvote'], (upvoteError, upvoteResults) => {
      if (upvoteError) {
        console.error('Error checking upvote:', upvoteError);
        return res.status(500).json({ message: 'Error checking upvote' });
      }

      if (upvoteResults.length > 0) {
        return res.status(400).json({ message: 'User has already upvoted this post' });
      }

      // If the user has not voted on this post, insert a downvote
      const insertDownvoteQuery = 'INSERT INTO Votes (UserID, PostID, VoteType) VALUES (?, ?, ?)';
      db.query(insertDownvoteQuery, [userId, postId, 'downvote'], (insertError) => {
        if (insertError) {
          console.error('Error downvoting post:', insertError);
          return res.status(500).json({ message: 'Error downvoting post' });
        }
        return res.status(200).json({ message: 'Downvoted post successfully' });
      });
    });
  });
});

// Upvote a Comment
app.post('/api/comments/:commentId/upvote', authenticateToken, (req, res) => {
  const commentId = req.params.commentId;
  const userId = req.user.userId;

  // Check if the user has already voted on this comment
  const upvoteQuery = 'SELECT * FROM Votes WHERE UserID = ? AND CommentID = ? AND VoteType = ?';
  db.query(upvoteQuery, [userId, commentId, 'upvote'], (upvoteError, upvoteResults) => {
    if (upvoteError) {
      console.error('Error checking upvote:', upvoteError);
      return res.status(500).json({ message: 'Error checking upvote' });
    }

    if (upvoteResults.length > 0) {
      return res.status(400).json({ message: 'User has already upvoted this comment' });
    }

    // Check if the user has downvoted this comment
    const downvoteQuery = 'SELECT * FROM Votes WHERE UserID = ? AND CommentID = ? AND VoteType = ?';
    db.query(downvoteQuery, [userId, commentId, 'downvote'], (downvoteError, downvoteResults) => {
      if (downvoteError) {
        console.error('Error checking downvote:', downvoteError);
        return res.status(500).json({ message: 'Error checking downvote' });
      }

      if (downvoteResults.length > 0) {
        return res.status(400).json({ message: 'User has already downvoted this comment' });
      }

      // If the user has not voted on this comment, insert an upvote
      const insertUpvoteQuery = 'INSERT INTO Votes (UserID, CommentID, VoteType) VALUES (?, ?, ?)';
      db.query(insertUpvoteQuery, [userId, commentId, 'upvote'], (insertError) => {
        if (insertError) {
          console.error('Error upvoting comment:', insertError);
          return res.status(500).json({ message: 'Error upvoting comment' });
        }
        return res.status(200).json({ message: 'Upvoted comment successfully' });
      });
    });
  });
});

// Downvote a Comment
app.post('/api/comments/:commentId/downvote', authenticateToken, (req, res) => {
  const commentId = req.params.commentId;
  const userId = req.user.userId;

  // Check if the user has already voted on this comment
  const downvoteQuery = 'SELECT * FROM Votes WHERE UserID = ? AND CommentID = ? AND VoteType = ?';
  db.query(downvoteQuery, [userId, commentId, 'downvote'], (downvoteError, downvoteResults) => {
    if (downvoteError) {
      console.error('Error checking downvote:', downvoteError);
      return res.status(500).json({ message: 'Error checking downvote' });
    }

    if (downvoteResults.length > 0) {
      return res.status(400).json({ message: 'User has already downvoted this comment' });
    }

    // Check if the user has upvoted this comment
    const upvoteQuery = 'SELECT * FROM Votes WHERE UserID = ? AND CommentID = ? AND VoteType = ?';
    db.query(upvoteQuery, [userId, commentId, 'upvote'], (upvoteError, upvoteResults) => {
      if (upvoteError) {
        console.error('Error checking upvote:', upvoteError);
        return res.status(500).json({ message: 'Error checking upvote' });
      }

      if (upvoteResults.length > 0) {
        return res.status(400).json({ message: 'User has already upvoted this comment' });
      }

      // If the user has not voted on this comment, insert a downvote
      const insertDownvoteQuery = 'INSERT INTO Votes (UserID, CommentID, VoteType) VALUES (?, ?, ?)';
      db.query(insertDownvoteQuery, [userId, commentId, 'downvote'], (insertError) => {
        if (insertError) {
          console.error('Error downvoting comment:', insertError);
          return res.status(500).json({ message: 'Error downvoting comment' });
        }
        return res.status(200).json({ message: 'Downvoted comment successfully' });
      });
    });
  });
});

app.get('/api/posts/:postId/user-vote', authenticateToken, (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const selectPostVoteQuery = 'SELECT VoteType FROM Votes WHERE PostID = ? AND UserID = ?';
  db.query(selectPostVoteQuery, [postId, userId], (error, results) => {
    if (error) {
      console.error('Error fetching post vote:', error);
      return res.status(500).json({ message: 'Error fetching post vote' });
    }

    if (results.length === 0) {
      return res.status(200).json({ vote: null }); // No vote from the user
    }

    const vote = results[0].VoteType;
    return res.status(200).json({ vote });
  });
});

app.get('/api/comments/:postId/votes', authenticateToken, (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.userId;

  if (!userId || !postId) {
    return res.status(401).json({ message: 'Unauthorized or postId missing' });
  }

  // Fetching all votes (both post and comment votes) for the given post and user
  const query = `
    SELECT VoteType, CommentID
    FROM Votes
    WHERE (PostID = ? OR CommentID IN (SELECT CommentID FROM Comments WHERE PostID = ?)) AND UserID = ?
  `;

  db.query(query, [postId, postId, userId], (error, results) => {
    if (error) {
      console.error('Error fetching votes:', error);
      return res.status(500).json({ message: 'Error fetching votes' });
    }

    const postVote = results.find((row) => row.CommentID === null)?.VoteType || null;

    const commentVotes = {};
    results.forEach((row) => {
      if (row.CommentID !== null) {
        const commentId = row.CommentID.toString();
        commentVotes[commentId] = row.VoteType;
      }
    });

    return res.status(200).json({ postVote, commentVotes });
  });
});

app.post('/create-profile-picture', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { profilePictureUrl } = req.body;

  // Update the user's profile picture URL in the database
  const query = 'UPDATE UserAccounts SET ProfilePicture = ? WHERE UserID = ?';

  db.query(query, [profilePictureUrl, userId], (error) => {
    if (error) {
      console.error('Error creating profile picture:', error);
      return res.status(500).json({ error: 'Error creating profile picture' });
    }

    res.json({ message: 'Profile picture created successfully' });
  });
});

app.get('/get-profile-picture', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Fetch user data including the profile picture path
  const query = `
    SELECT Username, Email, ProfilePicture, Biography
    FROM UserAccounts
    WHERE UserID = ?
  `;

  db.query(query, [userId], (error, results) => {
    if (error) {
      console.error('Error fetching user profile:', error);
      return res.status(500).json({ message: 'Error fetching user profile' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userProfile = results[0];
    return res.status(200).json(userProfile);
  });
});

app.put('/update-profile-picture', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { profilePictureUrl } = req.body;

  // Update the user's profile picture URL in the database
  const query = 'UPDATE UserAccounts SET ProfilePicture = ? WHERE UserID = ?';

  db.query(query, [profilePictureUrl, userId], (error) => {
    if (error) {
      console.error('Error updating profile picture:', error);
      return res.status(500).json({ error: 'Error updating profile picture' });
    }

    res.json({ message: 'Profile picture updated successfully' });
  });
});

app.delete('/api/posts/:postId', authenticateToken, (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.userId;

  // Check if the user is the author of the post
  const checkAuthorQuery = 'SELECT * FROM Posts WHERE PostID = ? AND UserID = ?';
  db.query(checkAuthorQuery, [postId, userId], (error, results) => {
    if (error) {
      console.error('Error checking post author:', error);
      return res.status(500).json({ message: 'Error checking post author' });
    }

    if (results.length === 0) {
      return res.status(403).json({ message: 'Unauthorized to delete this post' });
    }

    // If the user is the author, proceed to delete the post
    const deletePostQuery = 'DELETE FROM Posts WHERE PostID = ?';
    db.query(deletePostQuery, [postId], (deleteError) => {
      if (deleteError) {
        console.error('Error deleting post:', deleteError);
        return res.status(500).json({ message: 'Error deleting post' });
      }

      return res.status(200).json({ message: 'Post deleted successfully' });
    });
  });
});

app.get('/api/posts/tag/:tagName', async (req, res) => {
  try {
    const tagName = req.params.tagName;

    // Fetch posts based on tag
    const selectPostsByTagQuery =
      'SELECT p.*, u.Username AS Author FROM Posts p ' +
      'JOIN UserAccounts u ON p.UserID = u.UserID ' +
      'JOIN Tags t ON p.PostID = t.PostID ' +
      'WHERE t.name = ?';

    const posts = await new Promise((resolve, reject) => {
      db.query(selectPostsByTagQuery, [tagName], (error, results) => {
        if (error) {
          console.error('Error fetching posts by tag:', error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });

    return res.status(200).json({ posts });
  } catch (error) {
    return res.status(500).json({ message: 'Error searching posts by tag' });
  }
});

// Get upvotes/downvotes for a post
app.get('/post/:postId/votes', authenticateToken, (req, res) => {
  const postId = req.params.postId;

  // Fetch the number of upvotes and downvotes for the post
  const getVotesQuery = 'SELECT COUNT(*) AS voteCount, VoteType FROM Votes WHERE PostID = ? GROUP BY VoteType';
  db.query(getVotesQuery, [postId], (error, results) => {
    if (error) {
      console.error('Error getting votes:', error);
      return res.status(500).json({ message: 'Error getting votes.' });
    }

    let upvotes = 0;
    let downvotes = 0;

    // Parse the results to get the count of upvotes and downvotes
    results.forEach((row) => {
      if (row.VoteType === 'upvote') {
        upvotes = row.voteCount;
      } else if (row.VoteType === 'downvote') {
        downvotes = row.voteCount;
      }
    });

    // Calculate the overall score or "points"
    const points = upvotes - downvotes;

    res.json({ upvotes, downvotes, points });
  });
});

// Get upvotes/downvotes for a comment
app.get('/comment/:commentId/votes', authenticateToken, (req, res) => {
  const commentId = req.params.commentId;

  // Fetch the number of upvotes and downvotes for the comment
  const getVotesQuery = 'SELECT COUNT(*) AS voteCount, VoteType FROM Votes WHERE CommentID = ? GROUP BY VoteType';
  db.query(getVotesQuery, [commentId], (error, results) => {
    if (error) {
      console.error('Error getting votes for comment:', error);
      return res.status(500).json({ message: 'Error getting votes for comment.' });
    }

    let upvotes = 0;
    let downvotes = 0;

    // Parse the results to get the count of upvotes and downvotes
    results.forEach((row) => {
      if (row.VoteType === 'upvote') {
        upvotes = row.voteCount;
      } else if (row.VoteType === 'downvote') {
        downvotes = row.voteCount;
      }
    });

    // Calculate the overall score or "points" for the comment
    const points = upvotes - downvotes;

    res.json({ upvotes, downvotes, points });
  });
});

app.delete('/api/comments/:commentId', authenticateToken, (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.userId;

  // Check if the user is blocked
  if (blockedUsers.has(userId)) {
    return res.status(403).json({ message: 'User is blocked' });
  }

  // Check if the comment exists
  const checkCommentQuery = 'SELECT * FROM Comments WHERE CommentID = ?';
  db.query(checkCommentQuery, [commentId], (checkCommentError, checkCommentResults) => {
    if (checkCommentError) {
      console.error('Error checking comment:', checkCommentError);
      return res.status(500).json({ message: 'Database error while checking comment.' });
    }

    if (checkCommentResults.length === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const comment = checkCommentResults[0];

    // Check if the user is the author of the comment or the post
    if (comment.UserID !== userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this comment' });
    }

    // Delete the comment
    const deleteCommentQuery = 'DELETE FROM Comments WHERE CommentID = ?';
    db.query(deleteCommentQuery, [commentId], (deleteCommentError) => {
      if (deleteCommentError) {
        console.error('Error deleting comment:', deleteCommentError);
        return res.status(500).json({ message: 'Database error while deleting comment.' });
      }

      res.json({ message: 'Comment deleted successfully' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});