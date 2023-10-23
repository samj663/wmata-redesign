import {useEffect, useState} from 'react';
import { API_URL } from '../../tokens';

export function AlertsOffCanvas(){
  const [alerts, setAlerts] = useState<any>([])
  useEffect(()=>{  
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

  return(
      <div className="offcanvas offcanvas-start" tabIndex={-1} id="alertsoffcanvas" aria-labelledby="alertsoffcanvas">
      <div className="offcanvas-header text-center">
        <h1 className="offcanvas-title" id="offcanvasExampleLabel">Alerts</h1>
        <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
      </div>
      <div className="offcanvas-body">
      {!alerts.length ? <h5 className="p-2" style={{backgroundColor: "lightgreen", borderRadius: "15px"}}>No alerts</h5> : alerts.map(alertsList)}
      </div>
    </div>
  )
}