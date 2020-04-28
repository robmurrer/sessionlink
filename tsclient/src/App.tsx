import React from 'react';
import logo from './logo.svg';
import './App.css';
import { PlayBlock } from './components/PlayBlock';
import uuid from 'uuid/v4';
import { Commando } from './Commando';
import { User } from './User';

const App: React.FC = () => {

  const url = new URL(document.URL);
  let id = url.searchParams.get('id');

  if (id === null) {
    id = uuid(); 
    window.location.href = window.location.href + "?id=" + id;
  }

  const commando = new Commando(id)
  const user = User.Create(); 

  return (
    <div className="App"> 
      <PlayBlock id={id} user={user} commando={commando}/>
    </div>
  );
}

export default App;
