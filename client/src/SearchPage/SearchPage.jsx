import React from 'react';
import 'bootswatch/dist/darkly/bootstrap.min.css';
import './SearchPage.css';
import Axios from 'axios';
import moment from 'moment';
import { Jumbotron, Table, InputGroup, Form, Button } from 'react-bootstrap';

export default class SearchPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      numMonths: '',
      subscribers: []
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      nextState.numMonths !== this.state.numMonths ||
      nextState.subscribers !== this.state.subscribers
    );
  }

  getFilteredSubs = e => {
    e.preventDefault();
    Axios.get(
      `/channel_subscribers?channelID=${localStorage.getItem(
        'sub_milestone_channel_id'
      )}`
    )
      .then(response => {
        const subs = response.data.subscriptions;
        const now = moment();
        const filteredSubs = [];
        for (var i = 0; i < subs.length; i++) {
          const subDuration = moment.utc(subs[i].created_at);
          const numMonths = now.diff(subDuration, 'months', true);
          if (numMonths < this.state.numMonths) {
            break;
          }
          filteredSubs.push({
            name: subs[i].user.display_name,
            numMonths: Math.floor(numMonths)
          });
        }
        this.setState({ subscribers: filteredSubs });
      })
      .catch(error => {
        alert('Error occured retrieving subs');
      });
  };

  handleMonthsChange = e => {
    this.setState({ numMonths: e.target.value });
  };

  render() {
    let subRows = [];
    this.state.subscribers.forEach(sub => {
      subRows.push(
        <tr>
          <td>{sub.name}</td>
          <td>{sub.numMonths}</td>
        </tr>
      );
    });

    return (
      <div>
      <Button className="logoutBtn btn" href="/logout">Logout</Button>
        <Jumbotron className="viewSubs">
          <h3>View Subs</h3>
          <Form onSubmit={e => this.getFilteredSubs(e)}>
            <Form.Control
              className="monthsInput"
              type="number"
              placeholder="# of Months"
              value={this.state.numMonths}
              onChange={this.handleMonthsChange}
              required
            />
            <Button className="searchBtn btn" type="submit">
              Search
            </Button>
          </Form>
          <br />
          <Table bordered>
            <thead>
              <th>Subscriber</th>
              <th># Months</th>
            </thead>
            <tbody>{subRows}</tbody>
          </Table>
        </Jumbotron>
      </div>
    );
  }
}
