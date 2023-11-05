import {useState, useEffect, useRef, useCallback} from 'react';
import {REACT_APP_MAPBOX_KEY, REACT_APP_MAPBOX_STYLE} from "../../tokens"
import { API_URL } from '../../tokens';
var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
mapboxgl.accessToken = REACT_APP_MAPBOX_KEY;

export default function MapComp(props : any) {
  var map : any = useRef(null);
  var {lon, lat, markers, zoom, station} = props
  const {setStation} = props;
  const mapContainer = useRef(null);
  var  markerTracker : any = useRef([])
  var  trainMarkerMap : any = useRef(new Map())
  var  stationMarkerTracker : any = useRef([])
  const timer = useRef<number[]>([])
  const [liveTrain, setLiveTrain] = useState(true);
  
  const stationMarkers = useCallback(async () => {
    if (!map.current ) return; // wait for map to initialize
    map.current.resize();  
    fetch(`${API_URL}/api/stationInfo`)
		.then(res => res.json())
		.then(value=>{
			if(value.error === undefined){
        for (const station of value){
            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<h6>${station.Name}</h6>
              <div>${station.Address.Street +", " +station.Address.City+", " + station.Address.State+", " + station.Address.Zip}</div>`)
            const el = document.createElement('div');
            el.className = 'marker'; 
            var t = new mapboxgl.Marker(el)
              .setLngLat([station.Lon, station.Lat])
              .addTo(map.current)
              .setPopup(popup)

            t.getElement().addEventListener('click', () => {
              if(setStation) setStation(station.Name)
            });

            stationMarkerTracker.current.push(t)
          }
        }
		})
		.catch(function(error) {
			console.log('There has been a problem with your fetch operation: ' + error.message);
      throw error;
    });
  },[setStation]);

  useEffect(()=>{
    if (map.current) return; // initialize map only once
    else{
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: REACT_APP_MAPBOX_STYLE,
        center: [-77.021851, 38.89834],
        zoom: zoom,
        attributionControl: false,
        logoPosition: "top-right"
      });
      
        let img = document.getElementById('map-tab');
        if (img){
          img.addEventListener('click', (event) => {
            map.current.resize()
          })
        }

      map.current.on('idle',function(){ map.current.resize() })
      map.current.on("load", async () =>{
        stationMarkers();
        map.current.addSource('Trains', { 'type': 'geojson', 'data':  null});
        map.current.addLayer({
          'id': 'train_positions',
          'type': 'circle',
          'source': 'Trains',
          "layout": {
            'icon-image': "train-icon",
            'icon-rotate': ['get', 'rotation']
        },
          'filter': ['==', '$type', 'Point']
        });
        map.current.resize();
      })
    }
  },[lon, lat, markers, zoom, stationMarkers])

  /**
   * Gets live train information from the api and generates markers for each
   * one on the map. Will run every 5 seconds.
   */
  const getTrainPos = useCallback(async () => {
		for(const e of timer.current){
			clearTimeout(e);
		}
		fetch(`${API_URL}/api/trainpositions`)
		.then(res => res.json())
		.then(value=>{
			if(value.error === undefined){
        for (const feature of value.features){
          if(trainMarkerMap.current.get(feature.properties.id) === undefined){
            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<h6>${feature.properties.line} Line Train</h6>
              <div> Destination: -not available-</div>
              <div> Train Info: ${feature.properties.licensePlate[0]} Car</div>`)

            const el = document.createElement('div');
            if(["RED","ORANGE","YELLOW","GREEN","BLUE","SILVER"].includes(feature.properties.line)){
              el.className = 'train-icon-' + feature.properties.line;
            }
            else el.className = 'train-icon'; 
            var t = new mapboxgl.Marker(el)
              .setLngLat(feature.geometry.coordinates)
              .addTo(map.current)
              .setPopup(popup)
              .setRotation(feature.properties.rotation)
            trainMarkerMap.current.set(feature.properties.id,t)
          }
          else{
            trainMarkerMap.current.get(feature.properties.id)
              .setLngLat(feature.geometry.coordinates)
              .setRotation(feature.properties.rotation);
          }
        }
				timer.current.push(window.setTimeout(()=>{getTrainPos()}, 5000))
			}
		})
		.catch(function(error) {
			console.log('There has been a problem with your fetch operation: ' + error.message);
      throw error;
    });
  },[timer]);

  useEffect(() => {
    if (!map.current ) return; // wait for map to initialize
    map.current.resize();
    
    if(markerTracker.current.length > 0 && !markers){
      map.current.setLayoutProperty('station-circles', 'visibility', 'visible');
      for (var i = markerTracker.current.length -1; i>=0; i--){
          markerTracker.current[i].remove();
      }
      markerTracker.current = [];
      return;
    }
    if(markers === null || props.station === "") return;
    else{

        map.current.setLayoutProperty('station-circles', 'visibility', 'none');

      for (const feature of markers!.features) {
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<h6> ${feature.properties.title}</h6>
           <div>${feature.properties.description}</div>`)
        const el = document.createElement('div');
        if(feature.properties.type === "Elevator"){
            el.className = 'elevator-marker';
        }
        else if(feature.properties.type === "Escalator"){
            el.className = 'escalator-marker';
        }
        else continue;
        var t = new mapboxgl.Marker(el)
          .setLngLat(feature.geometry.coordinates)
          .setPopup(popup) 
          .addTo(map.current);
        markerTracker.current.push(t);
      }
    }

  },[lon, lat, markers, station, zoom,props.station]);

  useEffect(()=>{
    map.current.flyTo({ 
      'center': [lon,lat], 
      'zoom': zoom || 16.5
    });

  },[lon,lat, zoom])
  
  const handleChange = (e:any) =>{
    setLiveTrain(e.target.checked);
  }
  useEffect(() => {
    if(liveTrain === false){
      for(const e of timer.current){
        clearTimeout(e);
      }
      trainMarkerMap.current.forEach((values:any, keys:any)=>{
        values.remove();
        trainMarkerMap.current.delete(keys);
      })
    } 
    else{
      getTrainPos();
    }
  },[liveTrain, getTrainPos])

  return (
    <div  style={{height: "100%",position:"relative"}}>
      <div className="m-3 bottom-0 end-0 position-absolute shadow bg-body-tertiary rounded-pill" style={{zIndex:"1"}}>
        <div className="justify-content-center mt-1 mb-1 ms-2 me-2 form-check-reverse form-switch" style={{ cursor:"pointer"}} >
          <input style={{ cursor:"pointer"}} onChange={handleChange} checked={liveTrain} className="form-check-input" type="checkbox" role="switch" id="showLiveTrains"></input>
          <label style={{ cursor:"pointer"}} className=" form-check-label"htmlFor="showLiveTrains"> Show Live Trains </label>
        </div>
      </div>
      <div ref={mapContainer} className="map-container" style={{height: "100%"}}></div>
    </div>
  );
}

export {MapComp as Map}