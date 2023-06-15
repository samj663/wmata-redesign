import React from 'react';
import Navbar from "./shared-components/Navbar";

export default function Alerts() {
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
    <div className={" d-flex text-center justify-content-center align-items-center m-1"} key={index} style={{borderRadius: "15px"}}>
      <div className={"col-1 transfer-station-circle "+t.LinesAffected.slice(0,2)} key={index+t.LinesAffected.slice(0,2)} id={index+t.LinesAffected.slice(0,2)}> {t.LinesAffected.slice(0,2)} </div>
      <p className="d-flex justify-content-center align-items-center m-1 p-2">{t.Description}</p>
    </div>;

  return (
    <div className="m-4 text-center">
        <Navbar/>
        <div style={{height: "71px"}}></div>
        <h1 className="mb-4 text-center">Alerts</h1>
        {!alerts.length ? <h5 className="p-2" style={{backgroundColor: "lightgreen", borderRadius: "15px"}}>No alerts</h5> : alerts.map(alertsList)}
    </div>
  );
}

