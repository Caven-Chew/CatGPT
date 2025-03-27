import React from 'react';
import Styles from './App.module.css';
import NavBar from './NavBar/NavBar';
import ChatFunction from './ChatFunction/ChatFunction';

function App() {
  return (
    <div className={Styles.App}>
      <NavBar />
      <ChatFunction />
    </div>
  );
}

export default App;
