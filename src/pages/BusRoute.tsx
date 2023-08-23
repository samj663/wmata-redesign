import React, { useState, useEffect, useRef, useCallback} from 'react';
import { API_URL } from '../tokens';
import NextBusTable from './shared-components/NextBusTable';

export default function BusRoute(props : any){
	var {set_center_to, route, set_active_stops, set_active_path, setRoute} = props

	//const [routeName, setRouteName] = useState(route)
	const [direction0, setDirection0] = useState(Object);
	const [direction1, setDirection1] = useState(Object);
	const [direction0_stops, set_direction0_stops] = useState([]);
	const [direction0_stops_geojson, set_direction0_stops_geojson] = useState(null);
	const [direction1_stops_geojson, set_direction1_stops_geojson] = useState(null);
	const [direction1_stops, set_direction1_stops] = useState([]);
	const [direction0_path, set_direction0_path] = useState(null)
	const [direction1_path, set_direction1_path] = useState(null)
	const [active_next_bus, set_active_next_bus] = useState(0);
	const elementRef = useRef<any>(null);
	const [height, setHeight] = useState(0);
	const [isLoading, setLoading] = useState(1);

	const handleClick = () =>{
		setRoute('');
		set_active_path(null)
	}
	

	useEffect(() => {
		setHeight(elementRef.current.clientHeight);
	  }, [height]);

	const list = (t: any, index:number) =>
	<tr key={index}  onClick={() => {
		if(active_next_bus === t.StopID) set_active_next_bus(0)
		else set_active_next_bus(t.StopID)
		set_center_to([t.Lon,t.Lat])
	}}>
		<td>
			<div className="d-flex align-items-center position-relative justify-content-start" >
				<div className="d-inline col-5 align-items-center"  style={{fontWeight: "Bold", fontSize: "20px"}} >{t.StopID}</div>
				<div className="d-inline col-7 align-items-center">{t.Name}</div>
			</div>
			<div>
				{active_next_bus !== t.StopID ? null: <NextBusTable StopID={t.StopID}/>}
			</div>
		</td>
	</tr>;

	const listPlaceholder = (t: any, index:number) =>
	<tr key={index}>
		<td>
			<div className="placeholder-glow position-relative">
				<span className="placeholder col-9"></span>
			</div>
		</td>
	</tr>;

	const fetchRouteInfo = useCallback(async () => {
		await fetch(`${API_URL}/api/busRoute?route=${route}`)
		.then(res => res.json())
		.then(value=>{

			setDirection0(value.paths.Direction0)
			setDirection1(value.paths.Direction1)
	//		setRouteName(value.name)
			if(value.paths.Direction0 !== null){
				set_direction0_stops(value.paths.Direction0.Stops);
				console.log(value.paths.Direction0.Stops)
				var path0 : any = {
					'type': 'geojson',
					'data': {
						'type': 'Feature',
						'geometry': {
							'type': 'LineString',
							'coordinates': []
						},
						'properties': {type: "line", title: "Direction1", description: "Direction path"}
					}
				}
				var stops0 : any = {
					'type': 'geojson',
					'data': {
						'type': 'FeatureCollection',
						'features': []
					}
				}
				
				for(const e of value.paths.Direction0.Stops){
					stops0.data.features.push(
						{
							'type': 'Feature',
							'geometry': {
								'type': 'Point',
								'coordinates': [e.Lon,e.Lat]
							},
							'properties': {stopID: e.StopID}
						}
					)
				}

				for(const e of value.paths.Direction0.Shape){
					path0.data.geometry.coordinates.push(
						[e.Lon,e.Lat]
					)
				}
				set_active_stops(stops0)
				set_direction0_stops_geojson(stops0)
				set_direction0_path(path0)
				set_active_path(path0)
			}
			else{
				set_direction0_stops([]);
			}
			if(value.paths.Direction1 !== null){
				set_direction1_stops(value.paths.Direction1.Stops)
			
				var path1 : any = {
					'type': 'geojson',
					'data': {
						'type': 'Feature',
						'geometry': {
							'type': 'LineString',
							'coordinates': []
						},
						'properties': {type: "line", title: "Direction1", description: "Direction path"}
					}
				}
				var stops1 : any = {
						'type': 'geojson',
						'data': {
							'type': 'FeatureCollection',
							'features': []
						}
				}
				for(const e of value.paths.Direction1.Stops){
					stops1.data.features.push(
						{
							'type': 'Feature',
							'geometry': {
								'type': 'Point',
								'coordinates': [e.Lon,e.Lat]
							}
						}
					)
				}
				for(const e of value.paths.Direction1.Shape){
					path1.data.geometry.coordinates.push(
						[e.Lon,e.Lat]
					)
				}
				set_direction1_stops_geojson(stops1);
				set_direction1_path(path1)
			}
			else{
				set_direction1_stops([]);
			}
			
			setLoading(0)
		})
		.catch(function(error) {
			console.log('There has been a problem with your fetch operation: ' + error.message);
			setLoading(0)
			throw error;
		});
	}, [route, set_active_path, set_active_stops]);


	useEffect(() => {
		setHeight(elementRef.current.clientHeight);
		fetchRouteInfo()
	},[fetchRouteInfo]);


	function handleBusStopList(direction:any){
		return(
			<div className="align-items-start text-center" id="next-train-tables">
				<table className="table table-hover">
					<thead>
						<tr>
						</tr>
					</thead>
					<tbody>
						{isLoading ? Array.from(Array(10).keys()).map(listPlaceholder) : direction.map(list)}
					</tbody>
				</table>
			</div>
		)
	}
	return(
		<div className="" style={{height: "100%", backgroundColor: "white"}}>
			<div ref={elementRef}>
				<h3 className="text-center p-1 m-0">{route}</h3>
				<div  className="container d-flex sticky-top m-0 p-0" style={{backgroundColor: "white"}}>
				<button type="button" className="d-inline btn btn-outline-primary btn-sm col-md-2 col-2" onClick={() => handleClick()}>{"Back"}</button>
				<div className="col-md-6 col-6"></div>
					<ul className="nav d-inline nav-underline justify-content-start col-md-4 col-4">
						<li className="nav-item dropdown">
							<a className="nav-link active dropdown-toggle text-center" data-bs-toggle="dropdown" role="button" aria-expanded="false">Directions</a>
							<ul className="dropdown-menu">
								<a className="dropdown-item active" href="#direction0"  data-bs-toggle="tab" onClick={()=>{set_active_path(direction0_path); set_active_stops(direction0_stops_geojson)}}>{direction0 ? direction0.DirectionText : ""} TO {direction0 ? direction0.TripHeadsign : ""}</a>
								<a className="dropdown-item" href="#direction1"  data-bs-toggle="tab" onClick={()=>{set_active_path(direction1_path); set_active_stops(direction1_stops_geojson)}}>{direction1 ? direction1.DirectionText : ""} TO {direction1 ? direction1.TripHeadsign : ""}</a>
							</ul>
						</li>
					</ul>
				</div>
			</div>
			<div className="tab-content"  style={{height: `calc(100% - ${height}px - 42px)`}}>
				<div id="direction0" className="tab-pane active overflow-auto"  style={{height: "100%"}}>
					<div className="" style={{height: "100%"}}>
						{handleBusStopList(direction0_stops)}
					</div>
				</div>
				<div id="direction1" className="tab-pane overflow-auto" style={{height: "100%"}}>
					<div className="" style={{height: "100%"}}>
						{handleBusStopList(direction1_stops)}
					</div>
				</div>
			</div>
		</div>
	)
}