import React, { useState, useEffect } from 'react';

const Theme = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    applyTheme();
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const applyTheme = () => {
    const body = document.body;
    if (isDarkMode) {
      body.classList.add('dark-mode');
    } else {
      body.classList.remove('dark-mode');
    }
  };

  return (
    <label>
      <input
        type="checkbox"
        checked={isDarkMode}
        onChange={toggleDarkMode}
      />
      Dark Mode
    </label>
  );
};

export default Theme;