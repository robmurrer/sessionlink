import React from 'react';
import './App.css';
import Playbox from './Playbox'

function App() {

  const titleClick = () => { console.log("huzzah"); };

  return (
    <div className="App">
      <header className="App-header">
        <a className="App-link" href="#" onClick={titleClick}>Session Link</a>
      </header>
      <Playbox />
    </div>
  );
}

export default App;
