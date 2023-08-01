import React, { useCallback, useEffect, useState, useRef } from 'react';

export default function NextArrivalsTable(props: any) {
  const [trains, setTrains] = useState<any[]>([]);
	const [isLoading, setLoading] = useState(0);
  const timer = useRef<number[]>([])

  const getNextTrain = useCallback(async () => {
		if(!trains.length ) setLoading(1);
		for(const e of timer.current){
			clearTimeout(e);
		}
		fetch(`/api/nextarrival?station=${props.station}&group=${props.group}`)
		.then(res => res.json())
		.then(value=>{
			setTrains(value)
			setLoading(0);
			
			timer.current.push(window.setTimeout(()=>{getNextTrain()}, 10000))
		})
		.catch(function(error) {
			console.log('There has been a problem with your fetch operation: ' + error.message);
			setLoading(0);
	//		const element = document.getElementById('station-name-header');
    //	element!.scrollIntoView();
			throw error;
		});
  },[props.group, props.station, timer, trains.length]);

  useEffect(() => {
		getNextTrain();
		const element = document.getElementById('station-name-header');
    if(element) element.scrollIntoView();
		var t = timer.current;
		return()=>{
			for(const e of t){
				clearTimeout(e);
			}
    }
  },[props.station, props.group, timer, getNextTrain]);
  //DestinationName is full station while Destination is abbreviated
	const trainList = (t: any, index:number) =>
	<tr key={index}>
		<td className="text-center col-1"><div className={"circle-table-margin transfer-station-circle "+t.Line}>{t.Line}</div></td>
		<td className="col-1">{t.Car}</td>
		<td className="col-9">{t.DestinationName}</td>
		<td className="col-1">{t.Min}</td>
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
					<th scope="col-1">Line</th>
					<th scope="col-1">Cars</th>
					<th scope="col-9">Destination</th>
					<th scope="col-1">Time</th>
				</tr>
			</thead>
			<tbody className="table-group-divider">
				{isLoading ? [1,2,3].map(placeholder) : trains.map(trainList) }
			</tbody>
		</table>
    </div>
  );
}