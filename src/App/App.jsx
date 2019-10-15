import React from 'react';
import './App.css';
import { Button } from 'react-bootstrap';
import SearchPage from '../SearchPage/SearchPage';

export default class App extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      userId: '',
      access_token: ''
    };
  }

  handleLogin() {
    const url =
      'https://id.twitch.tv/oauth2/authorize?client_id=dongwnp1521i40tkp2dbyug5y5t6e3&redirect_uri=http://localhost&response_type=token+id_token&scope=openid&callback=?';
    fetch(url, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers':
          'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With',
        'Access-Control-Allow-Methods': 'DELETE, POST, GET, OPTIONS'
      }
    })
      .then(response => {
        console.log(response);
      })
      .catch(error => {
        console.log(error.response);
      });
  }

  render() {
    const loginPage = (
      <div className="LoginPage">
        <Button size="lg" type="primary" onClick={this.handleLogin}>
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
