import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import InvoicePage from './pages/InvoicePage';
import DashboardPage from './pages/DashboardPage';

const App = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" exact component={DashboardPage} />
        <Route path="/invoices" component={InvoicePage} />
      </Switch>
    </Router>
  );
};

export default App;