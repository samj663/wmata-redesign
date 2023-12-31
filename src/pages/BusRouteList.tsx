import { useState, useEffect, useRef} from 'react';

import Navbar from "./shared-components/Navbar";
import BusMap from './shared-components/BusMap';
import BusRoute from './BusRoute';
import { AlertsOffCanvas } from './shared-components/AlertsOffCanvas';
import { API_URL } from '../tokens';

export default function BusRouteList(){
  const [routeList, setRouteList]= useState([]);
  const [route, setRoute] = useState("");
  const [isLoading, setLoading] = useState(1);
  const [height, setHeight] = useState(0);
  const [active_stops, set_active_stops] = useState(null);
  const [active_path, set_active_path] = useState(null);
  const [center_to, set_center_to] = useState(null);
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
  <tr key={index} >
    <td className="align-middle">
      <div className="align-items-center placeholder-glow" >
        <span className="align-items-center placeholder col-7" style={{height: "17px"}}></span>
      </div>
    </td>
  </tr>;

  useEffect(() => {
    setHeight(elementRef.current.clientHeight);
    window.addEventListener("resize", ()=>{
      if(elementRef.current!== null) setHeight(elementRef.current.clientHeight);
    });
  },[elementRef]);

  useEffect(()=>{
    if(!routeList) setLoading(1)
    if(route === "" && routeList.length === 0){
      try{
        fetch(`${API_URL}/api/busRouteList`)
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
  },[route, routeList])

  function handleBusRouteList(){
    return(
      <div className="row align-items-start text-center" id="next-train-tables" style={{height: "100%"}}>
        <table className="table table-hover" style={{height: "100%"}}>
        <thead>
            <tr>
              <th scope="col">
                <div className="position-relative">Metrobus Routes</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {/*Array.from(Array(10).keys()).map(listPlaceholder)*/}
            {isLoading ? Array.from(Array(10).keys()).map(listPlaceholder) : routeList.map(list)}
          </tbody>
        </table>
      </div>
    )
  }

  return(
    <div style={{height: "100%", backgroundColor: "white"}}>
      <Navbar/>
      <div style={{height: "61px"}}></div>
      <div ref={elementRef}>
        <ul className="nav nav-tabs justify-content-center nav-fill d-md-none  nav-justified">
          <li id="map-tab" className="nav-item">
            <a className="nav-link" href="#map" data-bs-toggle="tab">Map</a>
          </li>
          <li className="nav-item">
            <a className="nav-link active" aria-current="page" href="#info" data-bs-toggle="tab">Bus Routes</a>
          </li>
        </ul>
      </div>
      <div className="tab-content d-flex row m-0 p-0" style={{height: `calc(100% - 61px - ${height}px)`}}>
        <div id="map" className="col d-md-block tab-pane col-lg-6 col-md-6 m-0 p-0" style={{height: "100%"}}>
            <div className="m-0 p-0" style={{height: "100%"}}>
              <BusMap line_path={active_path} markers={null} stops={active_stops} center_to={center_to} route={route} Layers={[]}/>
          </div>
        </div>
        <div id="info" className="col tab-pane active show col-lg-6 col-md-6 overflow-auto" style={{height: "100%"}}>
          {route.length ? <BusRoute set_center_to={set_center_to} set_active_stops={set_active_stops} set_active_path={set_active_path} route={route} setRoute={setRoute}/>  :  handleBusRouteList()}
        </div>
      </div>
      <AlertsOffCanvas/>
    </div>
  )
}