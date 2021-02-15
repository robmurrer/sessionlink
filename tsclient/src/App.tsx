import React from 'react';
import logo from './logo.svg';
import './App.css';
import './dark-theme.css'
import './light-theme.css'
import { extendTheme } from "@chakra-ui/react"
import { PlayBlock } from './components/PlayBlock';
import uuid from 'uuid/v4';

//old
import { BlockProps }  from './components/Block'
import { Playbox }  from './components/Playbox'

//new
import { Commando } from './Commando'
import { User } from './User'
import { ChakraProvider } from "@chakra-ui/react";

const App: React.FC = () => {
  const url = new URL(document.URL);
  let id = url.searchParams.get('id');
  //http://my.com/?id=test

  //if we have no root_block id on URL, we create one!
  if (id === null) {
    id = uuid() 
    window.location.href = window.location.href + "?id=" + id
  }

  let b0: BlockProps = {
    id: id,
    title: "hi jay",
    value: "test"
  }

  return (
    <ChakraProvider>
      <div className="App">
        <Playbox block={b0}></Playbox>
      </div>
    </ChakraProvider>
  )
}
/*
  // Hierarchical Block Flow (not working w/ Sync)
  //
  //Commando is our command processor
  // it will sync to local storage and send to server
  //
  const commando = new Commando(id)

  //Sees if user has been created before,
  //if not then it will create
  const user = User.Create(); 

  return (
    <div className="App"> 
      <PlayBlock id={id} user={user} commando={commando}/>
    </div>
  );
}
*/

export default App;
