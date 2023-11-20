CREATE DATABASE amindal_db;
USE amindal_db;

CREATE TABLE UserAccounts (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL,
    Email VARCHAR(100) NULL,
    PasswordHash BINARY(60) NOT NULL,
    ProfilePicture VARCHAR(255),
    Biography TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (Username),
    UNIQUE (Email)
);

CREATE TABLE Posts (
    PostID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    Title VARCHAR(255) NOT NULL,
    Content TEXT NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    LastModifiedAt DATETIME DEFAULT NULL,
    Visibility ENUM('public', 'unlisted', 'private') DEFAULT 'public',
    LatestCommentCreatedAt DATETIME DEFAULT NULL,
    FOREIGN KEY (UserID) REFERENCES UserAccounts(UserID)
);

CREATE TABLE Comments (
    CommentID INT AUTO_INCREMENT PRIMARY KEY,
    PostID INT NOT NULL,
    UserID INT NOT NULL,
    Content TEXT NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    LastModifiedAt DATETIME DEFAULT NULL,
    ParentCommentID INT DEFAULT NULL,
    DisplayOrder INT NOT NULL,
    FOREIGN KEY (PostID) REFERENCES Posts(PostID),
    FOREIGN KEY (UserID) REFERENCES UserAccounts(UserID),
    FOREIGN KEY (ParentCommentID) REFERENCES Comments(CommentID)
);

CREATE TABLE Votes (
    VoteID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    PostID INT DEFAULT NULL,
    CommentID INT DEFAULT NULL,
    VoteType ENUM('upvote', 'downvote') NOT NULL,
    FOREIGN KEY (UserID) REFERENCES UserAccounts(UserID),
    FOREIGN KEY (PostID) REFERENCES Posts(PostID),
    FOREIGN KEY (CommentID) REFERENCES Comments(CommentID)
);

CREATE TABLE BlockedUsers (
    BlockingUserID INT NOT NULL,
    BlockedUserID INT NOT NULL,
    PRIMARY KEY (BlockingUserID, BlockedUserID),
    FOREIGN KEY (BlockingUserID) REFERENCES UserAccounts(UserID),
    FOREIGN KEY (BlockedUserID) REFERENCES UserAccounts(UserID)
);

CREATE TABLE SavedPosts (
    UserSavedPostID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    PostID INT NOT NULL,
    SavedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES UserAccounts(UserID),
    FOREIGN KEY (PostID) REFERENCES Posts(PostID)
);

CREATE TABLE Tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    PostID INT DEFAULT NULL,
    FOREIGN KEY (PostID) REFERENCES Posts(PostID)
);

