import React, { useState, useEffect, useRef} from 'react';

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
  const [height, setHeight] = useState(0);
  const [isLoading, setLoading] = useState(1);
  const elementRef = useRef<any>(null);

  const list = (t: string, index:number) =>
  <tr key={index}  onClick={() => setStation(t)}>
    <td>
      <div className="position-relative p-2">
        {t}
        <div className={"small-station-circle"}></div>
      </div>
    </td>
  </tr>;

const listPlaceholder = (t: any, index:number) =>
<tr key={index}>
  <td>
    <div className="placeholder-glow position-relative p-2">
      <span className="placeholder col-9"></span>
    </div>
  </td>
</tr>;

  useEffect(() => {
    setHeight(elementRef.current.clientHeight);
  }, [height]);

  useEffect(()=>{
    if(!station.length) {
      setMarkers(null);
      setLat(38.89834);
      setLon(-77.021851);
      setZoom(12);
    }
  },[station,lat, lon, geojson_markers, zoom])

  useEffect(()=>{
    setLoading(1)
    if(station === ""){
      try{
        fetch(`/api/stationList`)
        .then(res => res.json())
        .then(value=>{
          setStationList(Array.from(new Set(value.sort())));
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
      <div className="row align-items-start text-center" id="next-train-tables">
        <table className="table table-hover">
          <thead>
            <tr>
              <th scope="col"  className="p-2">
                <div className="position-relative p-2">Stations</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from(Array(10).keys()).map(listPlaceholder) : stationList.map(list)}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div style={{height: "100%", backgroundColor: "white"}}>
      <Navbar/>
      <div style={{height: "71px"}}></div>
      <div ref={elementRef}>
        <ul className="nav nav-tabs justify-content-center nav-fill d-md-none  nav-justified">
          <li className="nav-item">
            <a className="nav-link" href="#map" data-bs-toggle="tab">Map</a>
          </li>
          <li className="nav-item">
            <a className="nav-link active" aria-current="page" href="#info" data-bs-toggle="tab">Information</a>
          </li>
        </ul>
      </div>
      <div className="tab-content d-flex row m-0 p-0" style={{height: `calc(100% - 71px - ${height}px)`}}>
        <div id="map" className="col d-md-block tab-pane col-lg-6 col-md-6 m-0 p-0" style={{height: "100%"}}>
            <div className="m-0 p-0" style={{height: "100%"}}>
              <Map lat={lat} lon={lon} zoom={zoom} markers={geojson_markers} station={station}/>
          </div>
        </div>
        <div id="info" className="col tab-pane active show col-lg-6 col-md-6 overflow-auto" style={{height: "100%"}}>
          <div className="" style={{height: "100%"}}>
            {station.length ? <Station  station={station} setStation={setStation} setMarkers={setMarkers} setLat={setLat} setLon={setLon} setZoom={setZoom}/>  :  handleStationList()}
          </div>
        </div>
      </div>
    </div>
  );
}