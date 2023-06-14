import React, { useState, useEffect} from 'react';
//import { Link } from 'react-router-dom';

import Navbar from "./shared-components/Navbar";
import Map from "./shared-components/Map";
import Station from './Station';

export default function StationList(props : any) {
  const [stationList, setStationList] = useState([]);
  const [lat, setLat] = useState(38.89834);
  const [lon, setLon] = useState(-77.021851);
  const [zoom, setZoom] = useState(12);
  const [station, setStation] = useState("");
  const [geojson_markers, setMarkers] = useState(null);

  const list = (t: string, index:number) =>
  <tr key={index}>
    <td>
      <div className="position-relative p-2" onClick={() => setStation(t)}>
        {t}
        <div className={"transfer-station-circle-RD"}></div>
        </div>
      </td>
  </tr>;
  
  useEffect(()=>{
    if(!station.length) {
      setMarkers(null);
      setLat(38.89834 );
      setLon(-77.021851);
      setZoom(12);
    }
  },[lat, lon, geojson_markers, zoom])

  useEffect(()=>{
  if(station === ""){
    try{
      fetch(`/api/stationList`)
      .then(res => res.json())
      .then(value=>{
        setStationList(value.sort());
      })
    }
    catch(error:any) {
      if (error.name === "AbortError") return;
      console.log("Error ", error);
   }
  }
  },[station])

  function handleStationList(){
    return(
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
    )
  }
  return (
    <div style={{height: "100%", backgroundColor: "white"}}>
      <Navbar/>
      <div style={{height: "71px"}}></div>
      <div className="container-fluid text-center" style={{height: "calc(100% - 71px)"}}>
        <div className="row align-items-start"style={{height: "100%"}}>
          <div id="map" className="col-lg-6 col-md-6 d-none d-md-block" style={{height:"100%"}}>
           <Map lat={lat} lon={lon} zoom={zoom} markers={geojson_markers} station={station}/>
          </div>
          <div id="info" className="col-lg-6 col-md-6 overflow-auto" style={{height:"100%"}}>
            {station.length ? <Station  station={station} setStation={setStation} setMarkers={setMarkers} setLat={setLat} setLon={setLon} setZoom={setZoom}/>  :  handleStationList()}
          </div>
        </div>
      </div>
    </div>
  );
}