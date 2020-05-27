import React from 'react';
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Landing from './Landing';
import Interface from './Interface';
import "./App.css";

function App() {

  return (
    <Router basename="/dfclick">
      <Switch>
        <Route exact path="/" component={Landing} />
        <Route path="/interface" component={Interface} />
      </Switch>
    </Router>
  );
}

export default App;
