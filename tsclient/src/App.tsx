import React from 'react';
import logo from './logo.svg';
import './App.css';
import { PlayBlock } from './components/PlayBlock';
import uuid from 'uuid/v4';
import { Commando } from './Commando';

const App: React.FC = () => {

  const url = new URL(document.URL);
  let id = url.searchParams.get('id');

  if (id === null) {
    id = uuid(); 
    window.location.href = window.location.href + "?id=" + id;
  }

  const commando = new Commando(id)

  return (
    <div className="App"> 
      <PlayBlock id={id} commando={commando}/>
    </div>
  );
}

export default App;
