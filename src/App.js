import React from 'react';
import './App.css';

function App() {

  let titleClick = () => { console.log("huzzah"); };

  return (
    <div className="App">
      <header className="App-header">
        <a className="App-link" href="#" onClick={titleClick}>Session Link</a>
      </header>

    </div>
  );
}

export default App;
