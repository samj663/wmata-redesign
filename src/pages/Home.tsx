import React from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../tokens';
import { AlertsOffCanvas } from './shared-components/AlertsOffCanvas';
import Navbar from "./shared-components/Navbar";

export default function Home() {
  const [alerts, setAlerts] = React.useState<any>([])
  
  React.useEffect(()=>{  
    getAlerts();
  },[])

  async function getAlerts(){
    let output : any = []
      await fetch(`${API_URL}/api/alerts`)
      .then(res => res.json())
      .then(value=>{
        if(value !== null){
          for(const f of value){
            if( output.find((e:any) => e.IncidentID === f.IncidentID)) continue;
            else output.push(f);
          }
        }
      })
      .catch(e=>console.error(e))

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

  const alertsList = (t:any, index:number)=>
    <div className={" align-items-center d-flex mb-2 pb-2 pt-2"} key={index} style={{borderRadius: "10px", backgroundColor: "lightgray"}}>
      <div className={"transfer-station-circle col-2 m-2 "+t.LinesAffected.slice(0,2)} key={index+t.LinesAffected.slice(0,2)} id={index+t.LinesAffected.slice(0,2)}>{t.LinesAffected.slice(0,2)} </div>
      <p className="m-0">{t.Description}</p>
    </div>;
  
  return (
    <div className=" background-logo-new" style={{height: "100%", zIndex: 0}}>
      <Navbar/>
      <div style={{height: "61px"}}></div>
      <div className="container-fluid text-center" style={{ zIndex: 2}}>
      <h1 className="mt-5 mb-5">DC Metro Information Hub</h1>
      <div className="row align-items-center">
        <div className="d-inline-block container text-center" >
          <Link to="/stationlist" className="d-inline-block m-2 align-items-center card-custom">
            <div className="card text-white bg-primary card-custom">
              <img src={require("../images/greenline_metro_800_525_90.jpg")} className="card-img-top home-button-image card-image-custom" alt=""></img>
              <div className="card-footer">Rail</div>
            </div>
          </Link>
          <Link to="/busroutelist" className="d-inline-block m-2 gap-2 align-items-center card-custom">
            <div className="card text-white bg-primary card-custom">
              <img src={require("../images/WMATA_2006_Orion_VII_CNG_30_ft.JPG")} className="card-img-top home-button-image card-image-custom" alt=""></img>
              <div className="card-footer">Bus</div>
            </div>
          </Link>
          <Link to="/nexttrain" className="d-inline-block m-2 gap-2 align-items-center card-custom">
            <div className="card text-white bg-primary card-custom">
              <img src={require("../images/WMATA_PIDS_display.jpg")} className="card-img-top home-button-image card-image-custom" alt=""></img>
              <div className="card-footer">Next Arrival</div>
            </div>
          </Link>
          <Link to="/alerts" className="d-inline-block m-2 gap-2 align-items-center card-custom">
            <div className="card text-white bg-primary card-custom">
              <img src={require("../images/WMATA_PM35_at_Eisenhower_Avenue.jpg")} className="card-img-top home-button-image card-image-custom" alt=""></img>
              <div className="card-footer">Alerts</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
    <div className="offcanvas offcanvas-start" tabIndex={-1} id="offcanvasExample" aria-labelledby="offcanvasExampleLabel">
      <div className="offcanvas-header text-center">
        <h1 className="offcanvas-title" id="offcanvasExampleLabel">Alerts</h1>
        <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
      </div>
      <div className="offcanvas-body">
      {!alerts.length ? <h5 className="p-2" style={{backgroundColor: "lightgreen", borderRadius: "15px"}}>No alerts</h5> : alerts.map(alertsList)}
      </div>
    </div>
    <AlertsOffCanvas/>
    </div>
  );
}

/*
<div className="home-button-rail">
            <div className="home-button"> Rail </div>
            <div className="home-button-image-container">
              <div className="home-button-image-overlay"></div>
              <img src={require("../images/greenline_metro_800_525_90.jpg")} className="home-button-image"></img>
            </div>
          </div>

          <button type="button" className="btn btn-primary" data-bs-toggle="offcanvas" data-bs-target="#alertsoffcanvas" aria-controls="alertsoffcanvas">Alerts</button>
*/