import React from 'react';

const EmailSection = ({
  currentEmail,
  email,
  handleEmailChange,
  handleSubmit,
  message,
}) => {
  return (
    <div>
      <h3>Update Email</h3>
      <div>
        <p>Current Email: {currentEmail}</p>
      </div>
      <form onSubmit={handleSubmit}>
        <label>
          New Email:
          <input type="email" value={email} onChange={handleEmailChange} required />
        </label>
        <button className="buttons" type="submit">Update Email</button>
        {message && (
          <div className={message.includes('successfully') ? 'success' : 'error'}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default EmailSection;