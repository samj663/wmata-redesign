import { useEffect, useRef} from 'react';
import {REACT_APP_MAPBOX_KEY, REACT_APP_MAPBOX_STYLE} from "../../tokens"

import stations from "./Metro_Stations_Regional.json";
var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
 
mapboxgl.accessToken = REACT_APP_MAPBOX_KEY;

export default function Map(props : any) {
  var map : any = useRef(null);
  var {lon, lat, markers, zoom, station} = props
  const mapContainer = useRef(null);
  var  markerTracker : any = useRef([])

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
      map.current.on("load", () =>{
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
        map.current.resize();
       
      })
    }
  },[lon, lat, markers, zoom])

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

  return (
    <div ref={mapContainer} className="map-container" style={{height: "100%"}}></div>
  );
}