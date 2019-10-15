import React from 'react';
import './App.css';
import { Button } from 'react-bootstrap';
import SearchPage from '../SearchPage/SearchPage';

export default class App extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      clientId: '',
      userId: ''
    };
  }

  render() {
    const loginPage = (
      <div className="LoginPage">
        <Button size="lg" type="primary">
          Login to Twitch
        </Button>
      </div>
    );
    return this.state.userId === '' ? (
      loginPage
    ) : (
      <SearchPage userId={this.state.userId} />
    );
  }
}
