import React, { useCallback, useEffect, useState, useRef } from 'react';

export default function NextBusTable(props: any) {
  const [busList, setBusList] = useState<any[]>([]);
  const [isLoading, setLoading] = useState(0);
	const [error, setError] = useState(1);
  const timer = useRef<number[]>([])

  const getNextBus = useCallback(async () => {
		if(!busList.length ) setLoading(1);
		for(const e of timer.current){
			clearTimeout(e);
		}
		fetch(`/api/nextBus?stopid=${props.StopID}`)
		.then(res => res.json())
		.then(value=>{
			console.log(value)
			if(value.error === undefined){
				setBusList(value.nextBus)
				console.log("jovrif");
				timer.current.push(window.setTimeout(()=>{getNextBus()}, 10000))
				setLoading(0);
				setError(1);
			}
			else if(value.error !== undefined){
				console.log("IBGRVNO");
				setError(0)
		}
		})
		.catch(function(error) {
			console.log('There has been a problem with your fetch operation: ' + error.message);
			setLoading(0);
			throw error;
		});
  },[props.StopID,timer, busList.length]);

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