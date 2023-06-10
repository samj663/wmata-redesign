import React, { useState, useEffect} from 'react';
import { Link } from 'react-router-dom';

import Navbar from "./shared-components/Navbar";
import NextArrivalsTable from "./shared-components/NextArrivalsTable";
import Map from "./shared-components/Map";

export default function StationList(props : any) {
  const [stationList, setStationList] = useState([]);
  const [lat, setLat] = useState(0);
  const [lon, setLon] = useState(0);
  const [showMap, setMap] = useState(0);

  const list = (t: string, index:number) =>
  <tr key={index}>
    <td>
      <div className="position-relative p-2">
        <Link to="/Station" className="stretched-link" state={{ station: t }}></Link>
        {t}
        <div className={"transfer-station-circle-RD"}></div>
        </div>
      </td>
  </tr>;
  useEffect(()=>{
    fetch(`/api/stationList`)
    .then(res => res.json())
    .then(value=>{
      setStationList(value);
      console.log("KJLFONIVB ")
    })
  },[lat, lon])

  function setLocation(lat : number, lon : number){
    setLat(lat);
    setLon(lon);
    setMap(0);
  }

  return (
    <div style={{height: "100%"}}>
      <Navbar/>
      <div className="container-fluid text-center" style={{height: "calc(100% - 71px)"}}>
        <div className="row align-items-start"style={{height: "100%"}}>
          <div className="col-5" style={{height:"100%"}}>
           {showMap ? null : <Map lat={38.9072} lon={-77.0369} zoom={12}/>}
          </div>
          <div className="col-7 overflow-auto" style={{height:"100%"}}>
            <div className="row align-items-start" id="next-train-tables">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th scope="col">Stations</th>
                  </tr>
                </thead>
                <tbody>
                  {stationList.map(list)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}