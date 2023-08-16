import React from "react";
import { AlertsOffCanvas } from "./shared-components/AlertsOffCanvas";
import Navbar from "./shared-components/Navbar";
import NextArrivalsTable from "./shared-components/NextArrivalsTable";
import NextBusTable from "./shared-components/NextBusTable";

export default function NextArrivals(props:any) {
  const [station, setStation] = React.useState("");
  const [showResults, setResults] = React.useState(1);
  const [stationList, setStationList] = React.useState([]);
  const [isLoading, setLoading] = React.useState(1);
  const [stopID, set_stopID] = React.useState("");
  const [showBusResults, set_showBusResults] = React.useState(1);

  const list = (t:any, i:number) =>
  <option key={i} value={t}>{t}</option>;

  React.useEffect(()=>{  
    getNamesAndCodes();
  },[])

  async function getNamesAndCodes(){
    var a2 : any = [];
    await fetch('/api/stationList?get=names')
    .then(res => res.json())
    .then(value=>{ a2 = value; setLoading(0)})
    .catch(function(error) {
      console.log('There has been a problem with your fetch operation: ' + error.message);
      throw error;
    })
    setStationList(Array.from(new Set(a2.sort())));
  }

  const handleChange = (e:any) =>{
    e.preventDefault();
    setStation(e.target.value)
    setResults(0);
  }

  const handleSubmit = (e:any) =>{
    e.preventDefault();
    set_showBusResults(0);
  }

  React.useEffect(()=>{  
    setStation(station);
  },[station])

  return (
    <div>
      <Navbar/>
      <AlertsOffCanvas/>
      <div className="text-center">
        <div style={{height: "61px", backgroundColor: "white"}}></div>
        <h1 className="m-4">Next Arrivals</h1>
        <div className="container">
        <div className="card">
          <div className="card-header">
            <ul className="nav justify-content-center nav-tabs nav-justified card-header-tabs nav-fill">
              <li className="nav-item">
                <a className={`nav-link ${props.showRail}`} aria-current="page" href="#rail-next-arrivals" data-bs-toggle="tab">Rail Arrivals</a>
              </li>
              <li className="nav-item">
                <a className={`nav-link ${props.showBus}`} href="#bus-next-arrival" data-bs-toggle="tab">Bus Arrivals</a>
              </li>
            </ul>
          </div>
          <div className="card-body tab-content">
            <div id="rail-next-arrivals" className={`tab-pane fade ${props.showRail} show`}>
              <div  className="container-fluid text-center">
                <div className="row align-items-center justify-content-center">
                  <div className="col-xl-4 col-md-12">
                    {
                    !isLoading ? 
                    <select className="form-select" aria-label="Default select example" value={station} onChange={handleChange}>
                      <option defaultValue={""}>Select a Station</option>
                      {stationList.map(list)}
                    </select>
                    : 
                    <div className="placeholder-glow">
                      <select className="form-select placeholder" aria-label="Default select example" value={station} onChange={handleChange}></select>
                    </div>
                    }
                  </div>
                </div>
              </div>
              <div className="row m-0 mt-4" id="next-train-tables">
                <div className="col-xl-6 col-md-12">
                  {showResults? null : <NextArrivalsTable key={station + "1"} station={station} group="1"/>}
                </div>
                <div className="col-xl-6 col-md-12">
                  {showResults? null : <NextArrivalsTable key={station + "2"} station={station} group="2"/>}
                </div>
              </div>
            </div>
            <div id="bus-next-arrival" className={`tab-pane fade ${props.showBus} show`}>
              <form className="col-12 col-sm-8 col-lg-6 d-flex container text-center"  onSubmit={(e)=>handleSubmit(e)}>
                <input type="text" className="form-control m-1 " id="exampleFormControlInput1" placeholder="" value={stopID} onChange={e=>set_stopID(e.target.value)}></input>
                <button type="submit" className="btn btn-primary m-1 ">Search</button>
              </form>
              <div className="row m-0 mt-4" id="next-train-tables">
                {showBusResults? null : <NextBusTable StopID={stopID}/>}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}