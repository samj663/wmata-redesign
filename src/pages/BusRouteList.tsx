import React, { useState, useEffect, useRef} from 'react';

import Navbar from "./shared-components/Navbar";
<<<<<<< HEAD
import BusMap from './shared-components/BusMap';
=======
import Map from "./shared-components/Map";
import BusMap from './shared-components/BusMap';
import Station from './Station';
>>>>>>> e6bcdfd5a31abda072b4276b9480be337f6621de
import BusRoute from './BusRoute';
import { AlertsOffCanvas } from './shared-components/AlertsOffCanvas';

export default function BusRouteList(props: any){
  const [routeList, setRouteList]= useState([]);
  const [route, setRoute] = useState("");
  const [isLoading, setLoading] = useState(1);
  const [height, setHeight] = useState(0);
<<<<<<< HEAD
  const [active_stops, set_active_stops] = useState(null);
  const [active_path, set_active_path] = useState(null);
  const [center_to, set_center_to] = useState(null);
=======
  const [direction0_path, set_direction0_path] = useState(null)
	const [direction1_path, set_direction1_path] = useState(null)
>>>>>>> e6bcdfd5a31abda072b4276b9480be337f6621de
  const elementRef = useRef<any>(null);

  const list = (t: any, index:number) =>
  <tr key={index}  onClick={() => {setRoute(t.RouteID)}}>
    <td>
      <div className="d-flex align-items-center position-relative justify-content-start" >
        <div className="d-inline col-5 align-items-center" style={{fontWeight: "Bold", fontSize: "20px"}} >{t.RouteID}</div>
        <div className="d-inline col-7 align-items-center">{t.LineDescription}</div>
      </div>
    </td>
  </tr>;

  const listPlaceholder = (t: any, index:number) =>
  <tr key={index}>
    <td>
      <div className="placeholder-glow position-relative p-2">
        <span className="placeholder col-9"></span>
      </div>
    </td>
  </tr>;

  useEffect(() => {
    setHeight(elementRef.current.clientHeight);
  }, [height]);

  useEffect(()=>{
    if(!routeList) setLoading(1)
    if(route === ""){
      try{
        fetch(`/api/busRouteList`)
        .then(res => res.json())
        .then(value=>{
          setRouteList(Array.from(new Set(value.sort())));
          setLoading(0)
        })
      }
      catch(error:any) {
        if (error.name === "AbortError") return;
        console.log("Error ", error);
        setLoading(0)
      }
    }
  },[route])

  function handleBusRouteList(){
    return(
      <div className="row align-items-start text-center overflow-auto" id="next-train-tables" style={{height: "100%"}}>
        <table className="table table-hover">
          <thead>
            <tr>
              <th scope="col">
                <div className="position-relative">Metrobus Routes</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from(Array(10).keys()).map(listPlaceholder) : routeList.map(list)}
          </tbody>
        </table>
      </div>
    )
  }

  return(
    <div style={{height: "100%", backgroundColor: "white"}}>
      <Navbar/>
<<<<<<< HEAD
      <div style={{height: "61px"}}></div>
=======
      <div style={{height: "71px"}}></div>
>>>>>>> e6bcdfd5a31abda072b4276b9480be337f6621de
      <div ref={elementRef}>
        <ul className="nav nav-tabs justify-content-center nav-fill d-md-none  nav-justified">
          <li className="nav-item">
            <a className="nav-link" href="#map" data-bs-toggle="tab">Map</a>
          </li>
          <li className="nav-item">
            <a className="nav-link active" aria-current="page" href="#info" data-bs-toggle="tab">Information</a>
          </li>
        </ul>
      </div>
      <div className="tab-content d-flex row m-0 p-0" style={{height: `calc(100% - 71px - ${height}px)`}}>
        <div id="map" className="col d-md-block tab-pane col-lg-6 col-md-6 m-0 p-0" style={{height: "100%"}}>
            <div className="m-0 p-0" style={{height: "100%"}}>
<<<<<<< HEAD
              <BusMap line_path={active_path} markers={null} stops={active_stops} center_to={center_to} route={route} Layers={[]}/>
          </div>
        </div>
        <div id="info" className="col tab-pane active show col-lg-6 col-md-6" style={{height: "100%"}}>
          {route.length ? <BusRoute set_center_to={set_center_to} set_active_stops={set_active_stops} set_active_path={set_active_path} route={route} setRoute={setRoute}/>  :  handleBusRouteList()}
        </div>
      </div>
      <AlertsOffCanvas/>
    </div>
  )
=======
              <BusMap direction0_path={direction0_path} direction1_path={direction1_path} markers={null} route={route} Layers={[]}/>
          </div>
        </div>
        <div id="info" className="col tab-pane active show col-lg-6 col-md-6" style={{height: "100%"}}>
          {route.length ? <BusRoute set_direction0_path={set_direction0_path} set_direction1_path={set_direction1_path} route={route} setRoute={setRoute}/>  :  handleBusRouteList()}
        </div>
      </div>
      <AlertsOffCanvas/>
    </div>)
>>>>>>> e6bcdfd5a31abda072b4276b9480be337f6621de
}