import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from "./shared-components/Navbar";

export default function Home() {
  const [alerts, setAlerts] = React.useState<any>([])
  
  React.useEffect(()=>{  
    getAlerts();
  },[])

  async function getAlerts(){
    let output : any = []
      await fetch(`/api/alerts`)
      .then(res => res.json())
      .then(value=>{
        if(value !== null){
          for(const f of value){
            if( output.find((e:any) => e.IncidentID === f.IncidentID)) continue;
            else output.push(f);
          }
        }
      })
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
    <div style={{height: "100%", backgroundColor: "white"}}>
      <Navbar/>
      <div style={{height: "71px"}}></div>
      <div className="container-fluid text-center">
        <h1 className="mt-5 mb-5">WMATA Information Hub</h1>
        <div className="row align-items-center">
          <div className="col-12 col-sm-8 col-lg-6 d-flex container text-center">
            <input type="email" className="form-control m-1 " id="exampleFormControlInput1" placeholder="Search bar not functional yet" disabled></input>
            <button type="button" className="btn btn-primary m-1 " disabled>Search</button>
          </div>
        </div>
        <div className="row">
          <div className="d-grid d-sm-inline-block container text-center mt-5" >
            <Link to="/Stationlist" className="d-grid d-sm-inline-block m-1 gap-2">
              <button type="button" className="btn btn-primary">Station Information</button>
            </Link>
            <Link to="/nexttrain" className="d-grid d-sm-inline-block m-1 gap-2">
              <button type="button" className="btn btn-primary">Next Arrivals</button>
            </Link>
            <Link to="/" className="d-grid d-sm-inline-block m-1 gap-2">
              <button type="button" className="btn btn-primary" disabled> Bus Information</button>
            </Link>
            <Link to="/" className="d-grid d-sm-inline-block m-1 gap-2">
              <button type="button" className="btn btn-primary" disabled>Maps</button>
            </Link>
            <div className="d-grid d-sm-inline-block m-1 gap-2">
              <button type="button" className="btn btn-primary" data-bs-toggle="offcanvas" data-bs-target="#offcanvasExample" aria-controls="offcanvasExample">Alerts</button>
            </div>
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
    </div>
  );
}