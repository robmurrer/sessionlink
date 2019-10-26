import React from 'react';
import logo from './logo.svg';
import './App.css';
import { Playbox } from './components/Playbox';
import { BlockProps } from './components/Block';
import uuid from 'uuid/v4';

const App: React.FC = () => {

  const url = new URL(document.URL);
  let id = url.searchParams.get('id');

  if (id === null) {
    id = uuid(); 
    window.location.href = window.location.href + "?id=" + id;
  }

  let b0: BlockProps = {
    id: id, 
    title: "hi mom, hi dad!",
    value: "Love you jess",
  };


  return (
    <div className="App"> 
      <Playbox block={b0}></Playbox>
    </div>
  );
}

export default App;
