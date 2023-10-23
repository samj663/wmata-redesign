import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
//import Station from './pages/Station';
//import React from 'react';
import NextArrivals from './pages/NextArrivals';
import Alerts from './pages/Alerts';
import StationList from './pages/StationList';
import BusRouteList from './pages/BusRouteList';
//import BusRoute from './pages/BusRoute';
//import NextBusTable from './pages/shared-components/NextBusTable';
//import Station from './pages/Station'

/**
 * This component handles routing to the propper page.
 * @returns Component based on routing
 */
const App = () => {

  return (
    <div className="main" style={{height: "100%"}}>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stationlist" element={<StationList />} />
        <Route path="/nexttrain" element={<NextArrivals showBus={""} showRail={"active"}/>} />
        <Route path="/nextbus" element={<NextArrivals showBus={"active"} showRail={""}/>} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/busroutelist" element={<BusRouteList />} />
        <Route path="/*" element={<div>Not a valid path. Will point to a "404 not found" page</div>} />
      </Routes>
    </Router>
    </div>
  );
};

export default App;
