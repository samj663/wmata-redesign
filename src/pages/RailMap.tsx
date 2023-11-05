import React, { useState, useEffect, useRef} from 'react';

import Navbar from "./shared-components/Navbar";
import Map from "./shared-components/Map";
import Station from './Station';
import { AlertsOffCanvas } from './shared-components/AlertsOffCanvas';
import { API_URL } from '../tokens';

export default function RailMap() {

  return (
    <div style={{height:`100%`, backgroundColor: "white"}}>
      <Navbar/>
      <AlertsOffCanvas/>
      <div style={{height: "61px"}}></div>
      <div className="tab-content d-flex row m-0 p-0" style={{height: `calc(100% - 61px`}}>
        <div id="map" className="col d-md-block tab m-0 p-0" style={{height: "100%"}}>
            <div className="m-0 p-0" style={{height: "100%"}}>
              <Map lat={38.89834} lon={-77.021851} zoom={11} markers={null} station=""/>
          </div>
        </div>

      </div>
    </div>
  );
}