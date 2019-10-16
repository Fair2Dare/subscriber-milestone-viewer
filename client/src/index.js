import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App/App';
import SearchPage from './SearchPage/SearchPage';

if (
  localStorage.getItem('sub_milestone_channel_id') !== null
) {
  ReactDOM.render(<SearchPage />, document.getElementById('root'));
} else {
  ReactDOM.render(<App />, document.getElementById('root'));
}
