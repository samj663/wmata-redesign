import React, { useState, useEffect, useRef} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from "./shared-components/Navbar";
import Map from "./shared-components/Map"
import NextArrivalsTable from "./shared-components/NextArrivalsTable";
var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
 
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;

export default function Station(props : any) {
  var location = useLocation();
  var navigate = useNavigate();
  const [station, setStation] = useState(location.state.station);
  const [stationInfo, setStationInfo] = useState(null);
  const [lat, setLat] = useState(0);
  const [lon, setLon] = useState(0);
  const [showMap, setMap] = useState(0);
  const [geojson_markers, setMarkers] = useState(null);
  useEffect(()=>{  
    setMap(0);
    setStation(location.state.station);
    fetchStation();
   // console.log(JSON.stringify(location))
  /*  const fetchStation = async () => {
      const data = await (await fetch(`/api/stationInfo?station=${station}`)).json();
      setStationInfo(data);
      setLat(data.Lat);
      setLon(data.Lon);
      if(lat ==0){
        setMap(0);
      }else setMap(1);
  //    setLocation(data.Lat, data.Lon)

      console.log("BEFORE HELLO???");
    }*/
  //  fetchStation();
 //   console.log("lat: "+ lat);
   console.log("HELLOOO??");
  },[lat, lon, station])
/*
  function setLocation(lat : number, lon : number){
    console.log("lat: "+ lat);

    setLat(lat);
    setLon(lon);
    
  }*/

  async function fetchStation(){
    await fetch(`/api/stationInfo?station=${station}`)
    .then(res => res.json())
    .then(value=>{
    //  console.log("Should be before HELLOR");
    //  console.log(value);
      setLat(value.Lat);
      setLon(value.Lon)
      console.log(value.entrances)
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
      setMarkers(temp);
      console.log("LATSHOUTLD CHANGE: " + lat);
      if(lon !== 0){
        setMap(1);
      }
    })
  }

  const goBack = () =>{
    navigate("/stationlist",{replace: true})
  }
  return (
    <div style={{height: "100%"}}>
      <Navbar/>
      <div className="container-fluid" style={{height: "calc(100% - 71px)"}}>
        <div className="row align-items-start"style={{height: "100%"}}>
          <div className="col-5" style={{height:"100%"}}>
           {showMap ? <Map lat={lat} lon={lon} markers={geojson_markers}/> : null}
          </div>
          <div className="col-7" style={{height:"100%"}}>
           <div>
            <button type="button" className="btn btn-link" onClick={goBack}>Go Back</button>
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
        </div>
      </div>
    </div>
  );
}



