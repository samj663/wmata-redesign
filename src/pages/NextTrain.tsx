import React from "react";
import Navbar from "./shared-components/Navbar";
import NextArrivalsTable from "./shared-components/NextArrivalsTable";

export default function NextTrain() {
  const [station, setStation] = React.useState("");
  const [showResults, setResults] = React.useState(1);
  const [stationList, setStationList] = React.useState([]);
  
  const zip = (a1:any, a2:any) => a1.map((x:any, i:any) => [x, a2[i]]);

  const list = (t:any, i:number) =>
  <option key={i} value={t[0]}>{t[1]}</option>;

  React.useEffect(()=>{  
    getNamesAndCodes();
  },[stationList])

  async function getNamesAndCodes(){
    var a1, a2;
    if(stationList.length !== 0) return;
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
    setStationList(t)
  }

  const handleChange = (e:any) =>{
    e.preventDefault();
    setStation(e.target.value)
    setResults(0);
  }

  React.useEffect(()=>{  
    setStation(station);
  },[station])

  const handleSubmit =(e:any)=>{
    e.preventDefault()
    if(showResults === 0) setResults(1);
    setResults(0);
  }

  return (
    <div>
      <Navbar/>
      <div className="container text-center">
        <div style={{height: "71px", backgroundColor: "white"}}></div>
        <h1 className="m-4">Next Arrivals</h1>
        <ul className="nav justify-content-center nav-underline nav-fill m-4">
          <li className="nav-item">
            <a className="nav-link active" aria-current="page" href="#rail-next-arrivals" data-bs-toggle="tab">Rail Arrivals</a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#bus-next-arrival" data-bs-toggle="tab">Bus Arrivals</a>
          </li>
        </ul>
        <div className="tab-content">
          <div id="rail-next-arrivals" className="container tab-pane fade active show">
            <div  className="container-fluid text-center">
              
              <div className="row align-items-center justify-content-center">
                <div className="col-xl-4 col-md-12">
                  <select className="form-select" aria-label="Default select example" value={station} onChange={handleChange}>
                    <option defaultValue={""}>Select a Station</option>
                    {stationList.map(list)}
                  </select>
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
          <div id="bus-next-arrival" className="tab-pane fade">
            <h2>Bus stuff not implemented</h2>
          </div>
        </div>
        
      </div>
    </div>
  )
}