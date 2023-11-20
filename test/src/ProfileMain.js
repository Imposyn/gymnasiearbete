import React, { useState } from 'react';

const ProfileMain = ({
  aboutMe,
  isEditingAboutMe,
  handleAboutMeChange,
  handleSubmitAboutMe,
  message,
  toggleEditingAboutMe,
}) => {
  const [isEdited, setIsEdited] = useState(false);

  const handleAboutMeSubmit = async (e) => {
    e.preventDefault();
    if (isEdited) {
      setIsEdited(false);
      handleSubmitAboutMe(e);
    }
  };

  return (
    <div>
      <h3>About Me</h3>
      <form onSubmit={handleAboutMeSubmit}>
        <label>
          About Me:
          <textarea
            value={aboutMe}
            onChange={(e) => {
              handleAboutMeChange(e);
              setIsEdited(true);
            }}
            rows="4"
            required
            disabled={!isEditingAboutMe}
          />
        </label>
        {isEditingAboutMe ? (
  <button className="buttons" type="submit">Save About Me</button>
  ) : (
<button className="buttons" type="button" onClick={toggleEditingAboutMe}>
  Edit About Me
</button>
)}
      </form>
      {message && (
        <div className={message.includes('successfully') ? 'success' : 'error'}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ProfileMain;