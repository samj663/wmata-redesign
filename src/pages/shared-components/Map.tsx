import {useState, useEffect, useRef, useCallback} from 'react';
import {REACT_APP_MAPBOX_KEY, REACT_APP_MAPBOX_STYLE} from "../../tokens"
import { API_URL } from '../../tokens';
import stations from "./Metro_Stations_Regional.json";
var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
mapboxgl.accessToken = REACT_APP_MAPBOX_KEY;

export default function Map(props : any) {
  var map : any = useRef(null);
  var {lon, lat, markers, zoom, station} = props
  const mapContainer = useRef(null);
  var  markerTracker : any = useRef([])
  var  trainMarkerTracker : any = useRef([])
  const timer = useRef<number[]>([])
  const [liveTrain, setLiveTrain] = useState(true);

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
   //     let train_pos = await fetch(`${API_URL}/api/trainpositions`)
        
        map.current.addSource('Trains', { 'type': 'geojson', 'data':  null});
        map.current.addSource('Stations', { 'type': 'geojson', 'data': stations });
        map.current.addLayer({
          'id': 'station-circles',
          'type': 'circle',
          'source': 'Stations',
          'paint': {
              'circle-radius': 6,
              'circle-color': '#ffffff',
              'circle-stroke-width': 5
          },
          'filter': ['==', '$type', 'Point']
        });
    //    console.log(train_pos)
        map.current.addLayer({
          'id': 'train_positions',
          'type': 'circle',
          'source': 'Trains',
          "layout": {
            'icon-image': "train-icon",
            'icon-rotate': ['get', 'rotation']
        },
         /* 'paint': {
              'circle-radius': 6,
              'circle-color': [
                'match',
                ['get', 'line'],
                'RED',
                '#BF0D3E',
                'BLUE',
                '#009CDE',
                'ORANGE',
                '#ED8B00',
                'YELLOW',
                '#FFD100',
                'GREEN',
                '#00B140',
                'SILVER',
                '#919D9D',
                * other * '#ccc'
                ],
              'circle-stroke-width': 5
          },*/
          'filter': ['==', '$type', 'Point']
        });
        map.current.resize();
    //    getTrainPos();
      })
    }
  },[lon, lat, markers, zoom])

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
        if(trainMarkerTracker.current.length > 0){
          for (var i = trainMarkerTracker.current.length -1; i>=0; i--){
            trainMarkerTracker.current[i].remove();
          }
          trainMarkerTracker.current = [];
        }
        
        for (const feature of value.features){
          const el = document.createElement('div');
          el.className = 'train-icon';
          var t = new mapboxgl.Marker(el).setLngLat(feature.geometry.coordinates).addTo(map.current);
          t.setRotation(feature.properties.rotation)
          trainMarkerTracker.current.push(t);
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
    map.current.flyTo({ 
      'center': [lon,lat], 
      'zoom': zoom || 16.5
    });
    
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

      /* This finds station coordinates within geojson and uses them instead
       * of the one provided by WMATA. I did this because the geojson seems 
       * to propvide a location thats more in the middle of the entrance 
       * locations
       */
    /*  const features = map.current.querySourceFeatures('Stations', {
        sourceLayer: "station-circles",
        filter: ['==', 'NAME', props.station]
      });

      if(features.length > 0){

     //   lon = features[0].geometry.coordinates[0]
       // lat = features[0].geometry.coordinates[1]
      }*/
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
        else el.className = 'marker';
        var t = new mapboxgl.Marker(el).setLngLat(feature.geometry.coordinates).setPopup(popup).addTo(map.current);
        markerTracker.current.push(t);
      }
    }
   
/*  map.current.on("click", () => {
      map.current.flyTo({ 
        'center': [lon,lat], 
        'zoom': zoom || 16.5
      });
    });*/
  },[lon, lat, markers, station, zoom,props.station]);

  const handleChange = (e:any) =>{
    setLiveTrain(e.target.checked);
  }
  useEffect(() => {
    if(liveTrain === false){
      console.log("Hello")
      for(const e of timer.current){
        clearTimeout(e);
      }
      if(trainMarkerTracker.current.length > 0){
        for (var i = trainMarkerTracker.current.length -1; i>=0; i--){
          trainMarkerTracker.current[i].remove();
        }
        trainMarkerTracker.current = [];
      }
    } 
    else{
      getTrainPos();
    }
  },[liveTrain, getTrainPos])

  return (
    <div  style={{height: "100%",position:"relative"}}>
      <div className="m-3 bottom-0 end-0 position-absolute shadow bg-body-tertiary rounded-pill" style={{zIndex:"1"}}>
        <div className="justify-content-center mt-1 mb-1 ms-2 me-2 form-check-reverse form-switch" >
          <input onChange={handleChange} checked={liveTrain} className="form-check-input" type="checkbox" role="switch" id="showLiveTrains"></input>
          <label className=" form-check-label"htmlFor="showLiveTrains"> Show Live Trains </label>
        </div>
      </div>
      <div ref={mapContainer} className="map-container" style={{height: "100%"}}></div>
    </div>
  );
}