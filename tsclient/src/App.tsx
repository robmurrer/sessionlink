import React from 'react';
import logo from './logo.svg';
import './App.css';
import { Playbox } from './components/Playbox';
import { BlockProps } from './components/Block';
import uuid from 'uuid/v4';

const App: React.FC = () => {

  //parse url for id param
  //if none do welcome id
  //prepopulate welcome block props in indexedb

  let b0: BlockProps = {
    id: uuid(), 
    title: "Welcome Click Anywhere to Make a Note",
    created: Date.now(),
  };

  return (
    <div className="App"> 
      <Playbox block={b0}></Playbox>
    </div>
  );
}

export default App;
