import React from 'react';
import './App.css';
import { Button } from 'react-bootstrap';
import SearchPage from '../SearchPage/SearchPage';

export default class App extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      userId: '',
      access_token: '',
      content: ''
    };
  }

  render() {
    const loginPage = (
      <div className="LoginPage">
        <Button size="lg" type="primary" href="/auth/twitch">
          Login to Twitch
        </Button>
        <br/>
      </div>
    );
    return this.state.userId === '' ? (
      loginPage
    ) : (
      <SearchPage userId={this.state.userId} />
    );
  }
}
