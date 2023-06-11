import React, { useState, useEffect} from 'react';
//import { Link } from 'react-router-dom';

import Navbar from "./shared-components/Navbar";
//import NextArrivalsTable from "./shared-components/NextArrivalsTable";
import Map from "./shared-components/Map";
import Station from './Station';

export default function StationList(props : any) {
  const [stationList, setStationList] = useState([]);
  const [lat, setLat] = useState(38.89834);
  const [lon, setLon] = useState(-77.021851);
 // const [showMap, setMap] = useState(0);
  const [zoom, setZoom] = useState(12);
//  const [showStation, setShowStation] = useState(0); // 0 means a statino wasn't selected.
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
  //  console.log(station);
  //  console.log(geojson_markers);
  if(station === ""){
    try{
      fetch(`/api/stationList`)
      .then(res => res.json())
      .then(value=>{
        setStationList(value);
      })
    }
    catch(error:any) {
      if (error.name === "AbortError") return;
      console.log("Error ", error);
   }
  }
  },[lat, lon, station, geojson_markers, zoom])

  /*
  function handleStation(station : string){
    setStation(station)
  }

  function setLocation(lat : number, lon : number){
    setLat(lat);
    setLon(lon);
    setMap(0);
  }*/

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
    <div style={{height: "100%"}}>
      <Navbar/>
      <div className="container-fluid text-center" style={{height: "calc(100% - 71px)"}}>
        <div className="row align-items-start"style={{height: "100%"}}>
          <div className="col-5" style={{height:"100%"}}>
           <Map lat={lat} lon={lon} zoom={zoom} markers={geojson_markers} />
          </div>
          <div className="col-7 overflow-auto" style={{height:"100%"}}>
            {station.length ? <Station station={station} setStation={setStation} setMarkers={setMarkers} setLat={setLat} setLon={setLon} setZoom={setZoom}/>  :  handleStationList()}
          </div>
        </div>
      </div>
    </div>
  );
}