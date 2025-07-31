// frontend/src/App.jsx
import React from 'react';
import './App.css'; // This path is correct as App.css is in the same folder as App.jsx

function App() {
  return (
    <div className="discord-clone-layout">
      {/* 1. Server List (Leftmost Sidebar) */}
      <div className="server-list">
        <div className="server-icon active">D</div> {/* Default Discord icon */}
        <div className="server-icon add-server">+</div> {/* Add Server icon */}
      </div>

      {/* 2. Server Sidebar / Channel List */}
      <div className="server-sidebar">
        <div className="server-header">
          <h3>Server Name</h3>
          {/* Dropdown for server settings */}
        </div>
        <div className="channel-category">
          <h4>TEXT CHANNELS</h4>
          <ul>
            <li># general</li>
            <li># announcements</li>
          </ul>
        </div>
        <div className="channel-category">
          <h4>VOICE CHANNELS</h4>
          <ul>
            <li>🔊 General</li>
          </ul>
        </div>
        <div className="user-status-display">
          <div className="user-avatar"></div>
          <span>User Name</span>
          {/* Mute/Deafen controls */}
        </div>
      </div>

      {/* 3. Chat Area (Main Content) */}
      <div className="chat-window">
        <div className="channel-header">
          <h3># general</h3> {/* Current channel name */}
        </div>
        <div className="message-list">
          {/* Placeholder for messages */}
          <div className="message-item">
            <span className="message-author">User1</span>
            <span className="message-timestamp">11:00 AM</span>
            <p className="message-content">Hello everyone!</p>
          </div>
          <div className="message-item">
            <span className="message-author">User2</span>
            <span className="message-timestamp">11:01 AM</span>
            <p className="message-content">Hi there!</p>
          </div>
        </div>
        <div className="chat-input">
          <input type="text" placeholder="Message #general" />
          <button>Send</button>
        </div>
      </div>

      {/* 4. Member List (Right Sidebar) */}
      <div className="member-list">
        <div className="member-category">
          <h4>ONLINE - 1</h4>
          <ul>
            <li>User Name</li>
          </ul>
        </div>
        <div className="member-category">
          <h4>OFFLINE - 0</h4>
          {/* No offline users for now */}
        </div>
      </div>
    </div>
  );
}

export default App;
