import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Station from './pages/Station';
import React from 'react';
import NextTrain from './pages/NextTrain';
import Alerts from './pages/Alerts';
import StationList from './pages/StationList';

/**
 * This component handles routing to the propper page.
 * @returns Component based on routing
 */
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stationlist" element={<StationList />} />
        <Route path="/station" element={<Station />} />
        <Route path="/nexttrain" element={<NextTrain />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/*" element={<div>Not a valid path. Will point to a "404 not found" page</div>} />
      </Routes>
    </Router>
  );
};

export default App;
