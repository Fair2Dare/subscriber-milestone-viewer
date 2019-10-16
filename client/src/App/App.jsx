import React from 'react';
import 'bootswatch/dist/darkly/bootstrap.min.css';
import './App.css';
import { Button, Jumbotron } from 'react-bootstrap';

const App = () => (
  <div className="appStyle">
    <Jumbotron>
      <h1>Subscriber Milestone Viewer</h1>
      <br />
      <Button className="twitchBtn" size="lg" href="/auth/twitch">
        Login to Twitch
      </Button>
    </Jumbotron>
  </div>
);

export default App;
