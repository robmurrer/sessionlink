import React from 'react';
import logo from './logo.svg';
import './App.css';
import { Playbox } from './components/Playbox';
import { BlockProps } from './components/Block';
import uuid from 'uuid/v4';

const App: React.FC = () => {

  let b0 : BlockProps = {
    id: uuid(), 
    title: "Untitled",
  };

  return (
    <div className="App"> 
      <Playbox block={b0}></Playbox>
    </div>
  );
}

export default App;
