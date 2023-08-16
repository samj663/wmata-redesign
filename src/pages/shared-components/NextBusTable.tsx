import React, { useCallback, useEffect, useState, useRef } from 'react';

export default function NextBusTable(props: any) {
  const [busList, setBusList] = useState<any[]>([]);
  const [isLoading, setLoading] = useState(0);
	const [error, setError] = useState(1);
	const timer = useRef<number[]>([])

	/**
	 * These functions are used to keep track of any errors and alerts the
	 * user outside this component. Since this component can be used without
	 * these prop functions, we have to check if they were passed througn.
	 */
	const set_invalid_stop = props.set_invalid_stop ?  props.set_invalid_stop : null;
	const set_showBusResults = props.set_showBusResults ? props.set_showBusResults : null;

	const getNextBus = useCallback(async () => {
		if(!busList.length ) setLoading(1);
		for(const e of timer.current){
			clearTimeout(e);
		}
		fetch(`/api/nextBus?stopid=${props.StopID}`)
		.then(res => res.json())
		.then(value=>{
			console.log("GOT A JSON")
			if(value.error === undefined){
				setBusList(value.nextBus)
				timer.current.push(window.setTimeout(()=>{getNextBus()}, 10000))
				setLoading(0);
				if(set_invalid_stop) set_invalid_stop("")
				setError(1);
			}
			else if(value.error !== undefined){
				console.log("ERROR FOUND")
				if(set_invalid_stop) set_invalid_stop("is-invalid");
				if(set_showBusResults) set_showBusResults(1)
				setError(0)
		}
		})
		.catch(function(error) {
			console.log('There has been a problem with your fetch operation: ' + error.message);
			setLoading(0);
			throw error;
		});
  },[props.StopID, timer, busList.length, set_invalid_stop, set_showBusResults]);

  useEffect(() => {
		getNextBus();
		const element = document.getElementById(props.StopID);
    if(element) element.scrollIntoView();
		var t = timer.current;
		return()=>{
			for(const e of t){
				clearTimeout(e);
			}
    }
  },[props.StopID,timer, getNextBus]);
  //DestinationName is full station while Destination is abbreviated
	const trainList = (t: any, index:number) =>
	<tr key={index}>
		<td className="text-center col-1">{t.RouteID}</td>
		<td className="col-2">{t.VehicleID}</td>
		<td className="col-9">{t.DirectionText}</td>
		<td className="col-1">{t.Minutes}</td>
	</tr>

	const placeholder = (index: number) =>
	<tr key={index}>
		<td className="placeholder-glow text-center col-1">
			<span className="placeholder col-12"></span>
		</td>
		<td className="placeholder-glow col-1">
			<span className="placeholder col-12"></span>
		</td>
		<td className="placeholder-glow">
			<span className="placeholder col-12"></span>
		</td>
		<td className="col-1 placeholder-glow">
			<span className="placeholder col-12"></span>
		</td>
	</tr>

  return (
    <div>
		<table className="table text-center">
			<thead>
				<tr>
					<th scope="col-1">Route</th>
					<th scope="col-2">Vehicle ID</th>
					<th scope="col-8">Destination</th>
					<th scope="col-1">Time</th>
				</tr>
			</thead>
			<tbody className="table-group-divider">
				{isLoading ? [1,2,3].map(placeholder) : busList.map(trainList) }
				{error ? null : 
				<div>
					An error occured getting next bus data
				</div>}
			</tbody>
		</table>
    </div>
  );
}