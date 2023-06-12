import React, { useState, useEffect, useRef} from 'react';
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

  const list = (t:any, i:number) =>
    <option key={i} value={t[0]}>{t[1]}</option>

  const zip = (a1:any, a2:any) => a1.map((x:any, i:any) => 
    [x, a2[i]]
  );

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
      console.log(value.entrances);
      setEntrances(value.entrances);

      let l = [];
      if(value.LineCode1 !== null) l.push(value.LineCode1);
      if(value.LineCode2 !== null) l.push(value.LineCode2);
      if(value.LineCode3 !== null) l.push(value.LineCode3);
      if(value.LineCode4 !== null) l.push(value.LineCode4);
      setLines(l);

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

  async function getNamesAndCodes(){
    var a1, a2;
    await fetch('/api/stationList?get=codes')
    .then(res => res.json())
    .then(value=>{ a1 = value })
    .catch(function(error) {
      console.log('There has been a problem with your fetch operation: ' + error.message);throw error;
    });
    await fetch('/api/stationList?get=names')
    .then(res => res.json())
    .then(value=>{ a2 = value })
    .catch(function(error) {
      console.log('There has been a problem with your fetch operation: ' + error.message);
      throw error;
    })
    var t = zip(a1,a2).sort((x:any,y:any)=>{
      if(x[1] < y[1]) return -1;
      else if (x[1] > y[1]) return 1;
      return 0;
    })
    setFareList(t)
  }

  const handleClick =() =>{
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
      <div className="d-flex justify-content-start p-2">
        <button type="button" className="btn btn-link" onClick={() => handleClick()}>Go Back</button>
      </div>
      <div className="d-flex justify-content-start align-items-center  p-2">
        <h1 >{station}</h1>
        {lines.map(linesServed)}
      </div>
      <div className="row align-items-start text-center  p-2" id="next-train-tables">
        <div className="col-6">
          <NextArrivalsTable station={station} group="1"/>
        </div>
        <div className="col-6">
          <NextArrivalsTable station={station} group="2"/>
        </div>
      </div>
      <div className="container p-4">
        <div className="row">
          <div className="col">
            <select className="form-select" aria-label="Default select example" value={fare} onChange={handleChange}>
              <option defaultValue={""}>Select Station</option>
              {fareList.map(list)}
            </select>
          </div>
          <div className="col">
            PeakTime: {f.PeakTime}
          </div>
          <div className="col">
            OffPeakTime: {f.OffPeakTime}
          </div>
          <div className="col">
            SeniorDisabled: {f.SeniorDisabled}
          </div>
        </div>
      </div>
      <div className="p-3 container">
        <div className="row">
          <div className="col">
            <h3 className="">Alerts</h3>
          </div>
          <div className="col overflow-auto">
            <h3>Entrances</h3>
            {entrances.map(entrance)}
          </div>
        </div>
      </div>
    </div>
  );
}