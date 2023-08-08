import React, { useState, useEffect, useRef} from 'react';
import NextBusTable from './shared-components/NextBusTable';

export default function BusRoute(props : any){
	const [route, setRoute] = useState(props.route)
	const [direction0, setDirection0] = useState(Object);
	const [direction1, setDirection1] = useState(Object);
	const [direction0_stops, set_direction0_stops] = useState([]);
	const [direction1_stops, set_direction1_stops] = useState([]);
	//const [direction0_path, set_direction0_path] = useState(null)
//	const [direction1_path, set_direction1_path] = useState(null)
	const [active_next_bus, set_active_next_bus] = useState(0);
	const elementRef = useRef<any>(null);
	const [height, setHeight] = useState(0);
	const [isLoading, setLoading] = useState(1);

	const handleClick = () =>{
		props.setRoute('');
		props.set_direction0_path(null)
		props.set_direction1_path(null)
	}

	const list = (t: any, index:number) =>
	<tr key={index}  onClick={() => {
		if(active_next_bus === t.StopID) set_active_next_bus(0)
		else set_active_next_bus(t.StopID)}}>
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

	useEffect(() => {
		setHeight(elementRef.current.clientHeight);
		fetchRouteInfo()
	}, [props.route]);

	async function fetchRouteInfo(){
		await fetch(`/api/busRoute?route=${route}`)
		.then(res => res.json())
		.then(value=>{
			setDirection0(value.paths.Direction0)
			setDirection1(value.paths.Direction1)
			set_direction0_stops(value.paths.Direction0.Stops)
			set_direction1_stops(value.paths.Direction1.Stops)
			console.log(value.paths.Direction0.Stops)
			var path0 : any = {
				'type': 'geojson',
				'data': {
					type: 'Feature',
					geometry: {
						type: 'LineString',
						coordinates: []
					},
					properties: {type: "line", title: "Direction0", description: "Direction0 path"}
				}
			};
			for(const e of value.paths.Direction0.Shape){
				path0.data.geometry.coordinates.push(
					[e.Lon,e.Lat]
				)
			}
			var path1 : any = {
				'type': 'geojson',
				'data': {
					type: 'Feature',
					geometry: {
						type: 'LineString',
						coordinates: []
					},
					properties: {type: "line", title: "Direction1", description: "Direction path"}
				}
			}
			for(const e of value.paths.Direction1.Shape){
				path0.data.geometry.coordinates.push(
					[e.Lon,e.Lat]
				)
			}
			console.log(value.paths.Direction0.Shape)
			props.set_direction0_path(path0)
			props.set_direction1_path(path1)
			setLoading(0)
		})
		.catch(function(error) {
			console.log('There has been a problem with your fetch operation: ' + error.message);
			setLoading(0)
			throw error;
		});
	}
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
			
			<div ref={elementRef} className="container d-flex sticky-top m-0 p-0" style={{backgroundColor: "white"}}>
			<button type="button" className="d-inline btn btn-outline-primary btn-sm col-md-2 col-2" onClick={() => handleClick()}>{"Back"}</button>
			<div className="col-md-6 col-6"></div>
				<ul className="nav d-inline nav-underline justify-content-start col-md-4 col-4">
					<li className="nav-item dropdown">
						<a className="nav-link active dropdown-toggle text-center" data-bs-toggle="dropdown" href="#" role="button" aria-expanded="false">Directions</a>
						<ul className="dropdown-menu">
							<a className="dropdown-item active" href="#direction0"  data-bs-toggle="tab">{direction0.DirectionText} TO {direction0.TripHeadsign}</a>
							<a className="dropdown-item" href="#direction1"  data-bs-toggle="tab">{direction1.DirectionText} TO {direction1.TripHeadsign}</a>
						</ul>
					</li>
				</ul>
			</div>
			<div className="tab-content"  style={{height: "calc(100% - 42px)"}}>
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