import React, { useState, useEffect} from 'react';
import NextArrivalsTable from "./shared-components/NextArrivalsTable";
var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
 
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;

export default function Station(props : any) {
  const [station, setStation] = useState(props.station);
  const [stationInfo, setStationInfo] = useState<any>();
  const [lat, setLat] = useState(0);
  const [lon, setLon] = useState(0);
  const [f, setF] = useState<any>({PeakTime: 0, OffPeakTime: 0, SeniorDisabled: 0});
  const [fare, setFare] = useState('');
  const [fareList, setFareList] = useState([]);
  const [lines, setLines] = useState<any>([]);
  const [entrances, setEntrances] = useState<any>([]);
  const [alerts, setAlerts] = useState<any>([]);

  const list = (t:any, i:number) =>
    <option key={i} value={t}>{t}</option>

  const zip = (a1:any, a2:any) => a1.map((x:any, i:any) => 
    [x, a2[i]]
  );

  const alertsList = (t:any, index:number)=>
  <div className={t.LinesAffected.slice(0,2) + " d-flex text-center justify-center m-1"} key={index} style={{borderRadius: "15px"}}>
    <p className="justify-content-center align-items-center m-1  p-2">{t.Description}</p>
  </div>

  const entrance = (t:any, index: number) =>
  <div className="text-left"key={index}>
    <p className="text-left">{t.Name}</p>
  </div>

  useEffect(()=>{  
    setStation(props.station);
    fetchStation();
  },[props.station])

  useEffect(()=>{  
    fetchFares();
  },[fare])
  
  async function fetchStation(){
    getNamesAndCodes();
    await fetch(`/api/stationInfo?station=${station}`)
    .then(res => res.json())
    .then(value=>{
      setStationInfo(value)
      props.setLat(value.Lat);
      props.setLon(value.Lon)
      setLat(value.Lat);
      setLon(value.Lon);
      setEntrances(value.entrances);
      setLines(value.lines);

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
      props.setMarkers(temp);
      props.setZoom(16.5);
    })
    .catch(function(error) {
      console.log('There has been a problem with your fetch operation: ' + error.message);
      throw error;
    });
  }
  useEffect(()=>{  
    getAlerts();
  },[lines])

  async function getAlerts(){
    let output : any = []
    for(const e of lines){
      await fetch(`/api/alerts?line=${e}`)
      .then(res => res.json())
      .then(value=>{
        if(value !== null){
          for(const f of value){
            if( output.find((e:any) => e.IncidentID === f.IncidentID)) continue;
            else output.push(f);
          }
        }
      })
    }
    let temp:any = []
    for(const e of output){
      let array = e.LinesAffected.split(/;[\s]?/).filter(function(fn:any) { return fn !== ''; })
      if(array.length > 1){
        for(const f of array){
          let object:any = Object.create(e)
          object.LinesAffected = f+";"
          temp.push(object);
        }
      }
      else temp.push(e)
    }
    output = temp;
    setAlerts(output)
  }

  async function getNamesAndCodes(){
    var a2 : any = [];
    await fetch('/api/stationList?get=names')
    .then(res => res.json())
    .then(value=>{ a2 = value })
    .catch(function(error) {
      console.log('There has been a problem with your fetch operation: ' + error.message);
      throw error;
    })
    setFareList(Array.from(new Set(a2.sort())));
  }

  const handleClick = () =>{
    props.setMarkers(null);
    props.setZoom(16);
    props.setStation('');
  }

  const handleChange=(e:any)=>{
    e.preventDefault()
    setFare(e.target.value)
  }

  const linesServed = (value:any, index:any)=>
    <div className={"transfer-station-circle "+value} key={index+value} id={index+value}>{value} </div>;
  
  async function fetchFares(){
    if(stationInfo === undefined) return
    await fetch(`/api/fares?sourcestation=${stationInfo.Code}&destinationstation=${fare}`)
    .then(res=>res.json())
    .then(value=>{ setF(value) })
    .catch(function(error) {
      console.log('There has been a problem with your fetch operation: ' + error.message);
      throw error;
    });
  }

  return (
    <div style={{height: "100%"}}>
      <div className="d-md-flex mt-2 mb-2">
        <div className="d-flex flex-grow-1 justify-content-start justify-content-md-start align-items-center">
          <h1 className="d-flex">{station}</h1>
          <div className="d-md-flex align-items-center d-none">
            {lines.map(linesServed)}
          </div>
          <div className="d-flex flex-grow-1 d-md-none justify-content-end align-items-center">
            <button type="button" className="btn btn-outline-primary btn-sm m-1" onClick={() => handleClick()}>{"Back"}</button>
          </div>
        </div>
        <div className="d-md-flex justify-content-end align-items-center d-none">
          <button type="button" className="btn btn-outline-primary m-1" onClick={() => handleClick()}>{"Back"}</button>
        </div>
      </div>
      <div className="row align-items-start text-center" id="next-train-tables">
        <div className="col-xl-6 col-md-12">
          <NextArrivalsTable station={station} group="1"/>
        </div>
        <div className="col-xl-6 col-md-12">
          <NextArrivalsTable station={station} group="2"/>
        </div>
      </div>
      <div className="container p-sm-4">
        <div className="row">
          <div className="col-xl-4 col-md-12 mt-4">
            <select className="form-select" aria-label="Default select example" value={fare} onChange={handleChange}>
              <option defaultValue={""}>Select Station</option>
              {fareList.map(list)}
            </select>
          </div>
          <div className="col-xl-3 col-4 mt-4">
            Peak Fare: 
            <div>
              {f.PeakTime}
            </div>
          </div>
          <div className="col-xl-2 col-4 mt-4">
            Off Peak: 
            <div>
              {f.OffPeakTime}
            </div>
          </div>
          <div className="col-xl-3 col-4 mt-4">
            Reduced: 
            <div>
              {f.SeniorDisabled}
            </div>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="row">
          <div className="col-xl-6 col-md-12">
            <h2 className="m-4">Alerts</h2>
            {!alerts.length ? <h5 className="p-2" style={{backgroundColor: "lightgreen", borderRadius: "15px"}}>No alerts</h5> : alerts.map(alertsList)}
          </div>
          <div className="col-xl-6 col-md-12 overflow-auto">
            <h2 className="m-4">Entrances</h2>
            {entrances.map(entrance)}
          </div>
        </div>
      </div>
    </div>
  );
}