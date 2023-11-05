import React, { useState, useEffect, useRef} from 'react';

import Navbar from "./shared-components/Navbar";
import Map from "./shared-components/Map";
import Station from './Station';
import { AlertsOffCanvas } from './shared-components/AlertsOffCanvas';
import { API_URL } from '../tokens';

export default function StationList() {
  const [stationList, setStationList] = useState<any>();
  const [lat, setLat] = useState(38.89834);
  const [lon, setLon] = useState(-77.021851);
  const [zoom, setZoom] = useState(11);
  const [station, setStation] = useState("");
  const [geojson_markers, setMarkers] = useState(null);
  const [height, setHeight] = useState(0);
  const [isLoading, setLoading] = useState(1);
  const elementRef = useRef<any>(null);
  const [lines, setLines] = useState<any>([])

  const list = (t: any, index:number) =>
  <tr key={index} onClick={() => {setStation(t[0]); setLines(t[1])}} style={{cursor: "pointer"}}>
    <td className="d-flex justify-content-center cursor-pointer">
      <div className="fw-medium position-relative p-2">
        {t[0]}
      </div>
      <div className="d-flex justify-content-center align-items-center">
        {t[1].map(lineCircles)}
      </div>
    </td>
  </tr>;

  const lineCircles = (t: any, index:number) =>
      <div key={index}className={"small-station-circle " + t}></div>

  const listPlaceholder = (t: any, index:number) =>
  <tr key={index} >
    <td className="align-middle">
      <div className="align-items-center placeholder-glow" >
        <span className="align-items-center placeholder col-7" style={{height: "17px"}}></span>
      </div>
    </td>
  </tr>;

  useEffect(() => {
    setHeight(elementRef.current.clientHeight);
    window.addEventListener("resize", ()=>{
      if(elementRef.current!== null) setHeight(elementRef.current.clientHeight);
    });
  },[elementRef]);

  useEffect(()=>{
    if(!station.length) {
      setMarkers(null);
      setLat(38.89834);
      setLon(-77.021851);
      setZoom(11);
    }
  },[station,lat, lon, geojson_markers, zoom])

  useEffect(()=>{
    setLoading(1)
    if(station === ""){
      try{
        fetch(`${API_URL}/api/stationList?get=lines`)
        .then(res => res.json())
        .then(value=>{
          var temp = Object.entries(value)
          temp.sort((x:any,y:any)=>{
            if(x[0] < y[0]){
              return -1
            }
            if(x[0] > y[0]){
              return 1
            }
            return 0
          })
          setStationList(temp);
          setLoading(0)
        })
      }
      catch(error:any) {
        if (error.name === "AbortError") return;
        console.log("Error ", error);
        setLoading(0)
      }
    }
  },[station])

  function handleStationList(){
    return(
      <div className="row align-items-start text-center" id="next-train-tables" style={{height: "100%"}}>
        <table className="table table-hover" style={{height: "100%"}}>
          <tbody>
          {/*Array.from(Array(10).keys()).map(listPlaceholder)*/}
            {isLoading ? Array.from(Array(10).keys()).map(listPlaceholder) : stationList.map(list)}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div style={{height:`100%`, backgroundColor: "white"}}>
      <Navbar/>
      <AlertsOffCanvas/>
      <div style={{height: "61px"}}></div>
      <div ref={elementRef}>
        <ul className="nav nav-tabs justify-content-center nav-fill d-md-none  nav-justified">
          <li id="map-tab" className="nav-item">
            <a className="nav-link" href="#map" data-bs-toggle="tab">Map</a>
          </li>
          <li className="nav-item">
            <a className="nav-link active" aria-current="page" href="#info" data-bs-toggle="tab">Stations</a>
          </li>
        </ul>
      </div>
      <div className="tab-content d-flex row m-0 p-0" style={{height: `calc(100% - 61px - ${height}px)`}}>
        <div id="map" className="col d-md-block tab-pane col-lg-6 col-md-6 m-0 p-0" style={{height: "100%"}}>
            <div className="m-0 p-0" style={{height: "100%"}}>
              <Map lat={lat} lon={lon} zoom={zoom} markers={geojson_markers} station={station} setStation={setStation}/>
          </div>
        </div>
        <div id="info" className="col tab-pane active show col-lg-6 col-md-6 overflow-auto" style={{height: "100%"}}>
          <div className="" style={{height: "100%"}}>
            {station.length ? <Station lines={lines} station={station} setStation={setStation} setMarkers={setMarkers} setLat={setLat} setLon={setLon} setZoom={setZoom}/>  :  handleStationList()}
          </div>
        </div>
      </div>
    </div>
  );
}