import React, { useState, useEffect, useRef} from 'react';
import NextArrivalsTable from "./shared-components/NextArrivalsTable";
var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
 
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;

export default function Station(props : any) {
  const [station, setStation] = useState(props.station);
 // const [stationInfo, setStationInfo] = useState(null);
  const [lat, setLat] = useState(0);
  const [lon, setLon] = useState(0);

  useEffect(()=>{  
    setStation(props.station);
    fetchStation();
  },[lat, lon, station])

  async function fetchStation(){
    await fetch(`/api/stationInfo?station=${station}`)
    .then(res => res.json())
    .then(value=>{
     // setStationInfo(value)
      props.setLat(value.Lat);
      props.setLon(value.Lon)
      setLat(value.Lat);
      setLon(value.Lon)

      var temp : any = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [lon, lat]
            },
            properties: {
              type: "station",
              title: station,
              description: "Station Item"
            }
          }
        ]
      };
      for(const e of value.entrances){
        temp.features.push({
          type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [e.Lon, e.Lat]
            },
            properties: {
              type: e.Type,
              title: e.Name,
              description: e.Description
            }
        })
      }
     // console.log(temp);
      props.setMarkers(temp);
      props.setZoom(16.5);
    })
  }

  const handleClick =() =>{
    props.setMarkers(null);
    props.setZoom(16);
    props.setStation('');
  }
  return (
    <div style={{height: "100%"}}>
      <div className="d-flex justify-content-start">
        <button type="button" className="btn btn-link" onClick={() => handleClick()}>Go Back</button>
      </div>
      <div className="d-flex justify-content-start align-items-center">
        <h1 >{station}</h1>
        <div className={"transfer-station-circle RD"}>RD</div>
        <div className={"transfer-station-circle OR"}>OR</div>
        <div className={"transfer-station-circle YL"}>YL</div>
        <div className={"transfer-station-circle GR"}>GR</div>
        <div className={"transfer-station-circle BL"}>BL</div>
        <div className={"transfer-station-circle SV"}>SV</div>
      </div>
      <div className="row align-items-start text-center" id="next-train-tables">
        <div className="col-6">
          <NextArrivalsTable station={station} group="1"/>
        </div>
        <div className="col-6">
          <NextArrivalsTable station={station} group="2"/>
        </div>
      </div>
    </div>
  );
}