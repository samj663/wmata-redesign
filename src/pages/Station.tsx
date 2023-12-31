import { useState, useEffect, useCallback} from 'react';
import { API_URL } from '../tokens';
import NextArrivalsTable from "./shared-components/NextArrivalsTable";

export default function Station(props : any) {
  var {station} = props
  const [lines, setLines] = useState<any>(props.lines)
  const [stationInfo, setStationInfo] = useState<any>();
  const [f, setF] = useState<any>({PeakTime: 0, OffPeakTime: 0, SeniorDisabled: 0});
  const [fare, setFare] = useState('');
  const [fareList, setFareList] = useState([]);
  const [entrances, setEntrances] = useState<any>([]);
  const [alerts, setAlerts] = useState<any>([]);
  const [isLoading, setLoading] = useState(1);
  const [isFareLoading, setFareLoading] = useState(0);

  //Checks if functions were passed through props
  const setLon = props.setLon ?  props.setLon : null;
	const setLat = props.setLat ? props.setLat : null;
  const setMarkers = props.setMarkers ? props.setMarkers : null;
  const setZoom = props.setZoom ? props.setZoom : null;
  const setStation = props.setStation ? props.setStation : null;

  const list = (t:any, i:number) =>
    <option key={i} value={t}>{t}</option>

  const alertsList = (t:any, index:number)=>
    <div className={"align-items-center d-flex mb-2 pb-2 pt-2"} key={index} style={{borderRadius: "10px", backgroundColor: "lightgray"}}>
      <div className={"transfer-station-circle col-2 m-2 "+t.LinesAffected.slice(0,2)} key={index+t.LinesAffected.slice(0,2)} id={index+t.LinesAffected.slice(0,2)}>{t.LinesAffected.slice(0,2)} </div>
      <p className="m-0">{t.Description}</p>
    </div>

  const alertsPlaceholder = (t:any, index:number)=>
    <div className="placeholder-glow" key={index}>
      <div className={"placeholder align-items-center d-flex mb-2 pb-2 pt-2"}  style={{borderRadius: "10px", backgroundColor: "lightgray"}}>
        <div className={"placeholder transfer-station-circle col-2 m-2 "} key={index + t} id={index.toString()}>{} </div>
        <p className="placeholder m-0">{t.Description}</p>
      </div>
    </div>

  const entrance = (t:any, index: number) =>
    <div className="text-left"key={index}>
      <p className="text-left">{t.Name}</p>
    </div>

  useEffect(() => {
    const element = document.getElementById('info');
    
    if(element){
      element.scroll({
        top: 0,
      });
    }
  }, []);
  
  const fetchStation = useCallback(async () => {
    getNamesAndCodes();
    var output = {lat: 0, lon: 0, markers: null, zoom: 0}
    await fetch(`${API_URL}/api/stationInfo?station=${station}`)
    .then(res => res.json())
    .then(value=>{
      setStationInfo(value)
      setEntrances(value.entrances);
      output.lat = value.Lat;
      output.lon = value.Lon;
      if(setLat) setLat(value.Lat);
      if(setLon) setLon(value.Lon);

        setLines(value.lines)
      
      var temp : any = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [value.Lon, value.Lat]
            },
            properties: {
              type: "station",
              title: station,
              description: value.Address.Street + ", " +value.Address.City+ ", " + value.Address.State
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
      if(setMarkers) setMarkers(temp);
      if(setZoom) setZoom(16.5);
      output.zoom = 16.5;
      output.markers =temp;
    })
    .catch(function(error) {
      console.log('There has been a problem with your fetch operation: ' + error.message);
      throw error;
    });
    return output;
  },[station, setLat, setLon, setMarkers, setZoom])

  useEffect(()=>{
    fetchStation();
  },[fetchStation])

  const getAlerts = useCallback(async () =>{
    if(lines !== undefined){
      setLoading(1);
      let output: any[] = [];
      
      let temp1: any[] = [];
      await fetch(`${API_URL}/api/alerts`)
      .then(res => res.json())
      .then(value=>{
        if(value !== null){
          value.forEach((f:any)=>{
            if(temp1.find((e:any) => e.IncidentID === f.IncidentID)) return;
            else temp1.push(f);
          })
        }
      })

      output = output.concat(temp1)

      let temp:any = []
      for(const e of output){
        let array = e.LinesAffected.split(/;[\s]?/).filter(function(fn:any) { return fn !== ''; })
        for(const f of array){
          let object:any = Object.create(e)
          object.LinesAffected = f+";"
          if(lines.includes(f)) temp.push(object);
     //     console.log(f)
        }
      }
      output = temp;
      setAlerts(output)
      setLoading(0);
    }
  },[lines])

  async function getNamesAndCodes(){
    var a2 : any = [];
    await fetch(`${API_URL}/api/stationList?get=names`)
    .then(res => res.json())
    .then(value=>{ a2 = value })
    .catch(function(error) {
      console.log('There has been a problem with your fetch operation: ' + error.message);
      throw error;
    })
    setFareList(Array.from(new Set(a2.sort())));
  }

  const handleClick = () =>{
    if(setMarkers) setMarkers(null);
    if(setZoom) setZoom(16);
    if(setStation) setStation('');
  }

  const handleChange=(e:any)=>{
    e.preventDefault()
    setFare(e.target.value)
  }

  const linesServed = (value:any, index:any)=>
    <div className={"transfer-station-circle "+value} key={index+value} id={index+value}>{value} </div>;

  const fetchFares = useCallback(async () =>{
    if(stationInfo === undefined) return
    setFareLoading(1)
    await fetch(`${API_URL}/api/fares?sourcestation=${stationInfo.Code}&destinationstation=${fare}`)
    .then(res=>res.json())
    .then(value=>{ setF(value) ; setFareLoading(0)})
    .catch(function(error) {
      console.log('There has been a problem with your fetch operation: ' + error.message);
      throw error;
    });
  }, [fare, stationInfo])

  useEffect(()=>{  
    fetchFares();
  },[fetchFares])

  useEffect(()=>{  
    setLoading(1);
    getAlerts();
  },[getAlerts])

  function isThereAlerts(){
    if(lines !== undefined){
      if(isLoading === 1){
        return([1].map(alertsPlaceholder));
      }
      if(alerts.length > 0) return(alerts.map(alertsList));
      else if(lines.length > 0 && isLoading === 0){
        return(<p className="p-2 text-center" style={{backgroundColor: "lightgray", borderRadius: "15px", fontSize: "20px"}}>No alerts</p>)
      }
      else return([1].map(alertsPlaceholder));
    }
	}

  return (
    <div style={{height: "100%"}} className="p-md-3">
      <div className="d-md-flex  mt-md-0 mt-3 mb-md-0 mb-3">
        <div className="d-flex flex-grow-1 justify-content-start justify-content-md-start align-items-center">
          <h1 className="d-flex" id="page-header">{station}</h1>
          <div className="d-md-flex align-items-center d-none">
            {lines ? lines.map(linesServed) : null}
          </div>
          <div className="d-flex flex-grow-1 d-md-none justify-content-end align-items-center">
            {fareList.length ?
            <button type="button" className="btn btn-outline-primary btn-sm m-1" onClick={() => handleClick()}>{"Back"}</button>
            :
            <div className="placeholder-glow"><button type="button" className="btn btn-outline-primary btn-sm m-1 placeholder">{"Back"}</button></div>
            }
          </div>
        </div>
        <div className="d-md-flex justify-content-end align-items-center d-none">
          {fareList.length ?
            <button type="button" className="btn btn-outline-primary m-1" onClick={() => handleClick()}>{"Back"}</button>
            :
            <div className="placeholder-glow"><button type="button" className="btn btn-outline-primary m-1 placeholder">{"Back"}</button></div>
          }
        </div>
      </div>
      <div className="row align-items-start" id="next-train-tables">
          <NextArrivalsTable station={station} includeTransf="true"/>
      </div>
      <div className="container p-sm-4 text-center">
        <div className="row">
          <div className="col-xl-4 col-md-12 mt-4">
            {fareList.length ? 
              <select className="form-select" aria-label="Default select example" value={fare} onChange={handleChange}>
                <option defaultValue={""}>Select Station</option>
                {fareList.map(list)}
              </select>
              : 
              <div className="placeholder-glow">
                <select className="form-select placeholder" aria-label="Default select example" value={station} onChange={handleChange}></select>
              </div>
            }
          </div>
          <div className="col-xl-3 col-4 mt-4 p-0">
            Peak Fare: 
            <div>
              {isFareLoading ? <div className="placeholder-glow"><div className="placeholder col-6"></div></div>: f.PeakTime}
            </div>
          </div>
          <div className="col-xl-2 col-4 mt-4 p-0">
            Off Peak: 
            <div>
              {isFareLoading ? <div className="placeholder-glow"><div className="placeholder col-6"></div></div>: f.OffPeakTime}
            </div>
          </div>
          <div className="col-xl-3 col-4 mt-4 p-0">
            Reduced: 
            <div>
              {isFareLoading ? <div className="placeholder-glow"><div className="placeholder col-6"></div></div>: f.SeniorDisabled}
            </div>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="row">
          <div className="col-xl-6 col-md-12 p-0">
            <h2 className="m-4 text-center">Alerts</h2>
            {isThereAlerts()}
          </div>
          <div className="col-xl-6 col-md-12">
            <h2 className="m-4 text-center">Entrances</h2>
            {!entrances.length ? [1].map(alertsPlaceholder) : entrances.map(entrance)}
          </div>
        </div>
      </div>
    </div>
  );
}