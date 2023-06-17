import React, { useState, useEffect} from 'react';
import NextArrivalsTable from "./shared-components/NextArrivalsTable";

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

  const alertsList = (t:any, index:number)=>
  <div className={" align-items-center d-flex mb-2 pb-2 pt-2"} key={index} style={{borderRadius: "10px", backgroundColor: "lightgray"}}>
    <div className={"transfer-station-circle col-2 m-2 "+t.LinesAffected.slice(0,2)} key={index+t.LinesAffected.slice(0,2)} id={index+t.LinesAffected.slice(0,2)}>{t.LinesAffected.slice(0,2)} </div>
    <p className="m-0">{t.Description}</p>
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
          value.forEach((f:any)=>{
            if(output.find((e:any) => e.IncidentID === f.IncidentID)) return;
            else output.push(f);
          })
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
    <div style={{height: "100%"}} className="p-md-3">
      <div className="d-md-flex  mt-md-0 mt-3 mb-md-0 mb-3">
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
      <div className="row align-items-start" id="next-train-tables">
        <div className="col-xl-6 col-md-12">
          <NextArrivalsTable station={station} group="1"/>
        </div>
        <div className="col-xl-6 col-md-12">
          <NextArrivalsTable station={station} group="2"/>
        </div>
      </div>
      <div className="container p-sm-4 text-center">
        <div className="row">
          <div className="col-xl-4 col-md-12 mt-4">
            <select className="form-select" aria-label="Default select example" value={fare} onChange={handleChange}>
              <option defaultValue={""}>Select Station</option>
              {fareList.map(list)}
            </select>
          </div>
          <div className="col-xl-3 col-4 mt-4 p-0">
            Peak Fare: 
            <div>
              {f.PeakTime}
            </div>
          </div>
          <div className="col-xl-2 col-4 mt-4 p-0">
            Off Peak: 
            <div>
              {f.OffPeakTime}
            </div>
          </div>
          <div className="col-xl-3 col-4 mt-4 p-0">
            Reduced: 
            <div>
              {f.SeniorDisabled}
            </div>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="row">
          <div className="col-xl-6 col-md-12 p-0">
            <h2 className="m-4 text-center">Alerts</h2>
            {!alerts.length ? <p className="p-2 text-center" style={{backgroundColor: "lightgray", borderRadius: "15px", fontSize: "20px"}}>No alerts</p> : alerts.map(alertsList)}
          </div>
          <div className="col-xl-6 col-md-12">
            <h2 className="m-4 text-center">Entrances</h2>
            {entrances.map(entrance)}
          </div>
        </div>
      </div>
    </div>
  );
}