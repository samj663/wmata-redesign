import React, { useState, useEffect, useRef} from 'react';

var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
 
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;

export default function BusMap(props : any) {
  var map : any = useRef(null);
  const mapContainer = useRef(null);
  const [lat, setLat] = useState(38.89834);
  const [lng, setLng] = useState(-77.021851);
  const [zoom, setZoom] = useState(12);
  const [geojson_markers, setMarkers] = useState<any>(null)
  var  markerTracker : any = useRef([])

  useEffect(()=>{
 //   setLng(props.lon);
 //   setLat(props.lat);
    setMarkers(props.markers);
    
    if (map.current) return; // initialize map only once
    else{
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: process.env.REACT_APP_MAPBOX_STYLE,
        center: [-77.021851 ,38.89834 ],
        zoom: zoom
      });

      map.current.on('idle',function(){ map.current.resize() })

      map.current.on("load", () =>{
    /*    console.log(props.direction0_path)
          map.current.addSource('Direction0',props.direction0_path);
        //  map.current.addSource('Direction1',props.direction1_path);
          map.current.addLayer({
            'id': 'route',
            'type': 'line',
            'source': 'Direction0',
            'layout': {
            
            'line-cap': 'round'
            },
            'paint': {
            'line-color': '#000',
            'line-width': 6
            }
          });*/
        
      })
    }
  },[props.lon, props.lat, lat,lng, props.markers, zoom, props.zoom])

  useEffect(()=>{
    if (!map.current) return; // initialize map only once
      console.log(props.direction0_path)
    
      if(props.direction0_path === null || props.direction1_path === null){
        console.log("DELETING LAYER")
        if(map.current.getLayer('route') !== undefined){
          map.current.removeLayer('route');
          map.current.removeSource('Direction0')
        }
        return;
      }
      if(map.current.getSource('Direction0') === undefined){
        console.log(map.current.getSource('Direction0'))
        map.current.addSource('Direction0',props.direction0_path)
      }
        map.current.on("dataloading", () =>{
          if(map.current.getLayer('route') === undefined){
            map.current.addLayer({
              'id': 'route',
              'type': 'line',
              'source': 'Direction0',
              'layout': {
              
              'line-cap': 'round'
              },
              'paint': {
              'line-color': '#000',
              'line-width': 6
              }
            });
          }
        map.current.resize();
      })
     },[props.direction0_path, props.direction1_path, props.route])



  useEffect(() => {
    
    setMarkers(props.markers);
    if (!map.current ) return; // wait for map to initialize
    map.current.resize();
    map.current.flyTo({ 
      'center': [lng,lat], 
      'zoom': zoom || 16.5
    });
    
    if(markerTracker.current.length > 0 && !props.markers){
      for (var i = markerTracker.current.length -1; i>=0; i--){
          markerTracker.current[i].remove();
      }
      markerTracker.current = [];
//      map.current.setLayoutProperty('station-circles', 'visibility', 'visible');
      return;
    }
    if(geojson_markers === null || props.station === "") return;
    else{
      /*This finds station coordinates within geojson and uses them instead
       * of the one provided by WMATA. I did this because the geojson seems 
       * to propvide a location thats more in the middle of the entrance 
       * locations
       */
      const features = map.current.querySourceFeatures('Stations', {
        sourceLayer: "station-circles",
        filter: ['==', 'NAME', props.station]
      });

      if(features.length > 0){
        setLng(features[0].geometry.coordinates[0])
        setLat(features[0].geometry.coordinates[1])
      }
      for (const feature of geojson_markers!.features) {
          const el = document.createElement('div');
          if(feature.properties.type === "Elevator"){
              el.className = 'elevator-marker';
          }
          else if(feature.properties.type === "Escalator"){
              el.className = 'escalator-marker';
          }
          else el.className = 'marker';
          var t = new mapboxgl.Marker(el).setLngLat(feature.geometry.coordinates).addTo(map.current);
          markerTracker.current.push(t);
      }
    //  map.current.setLayoutProperty('station-circles', 'visibility', 'visible');
    }
    // 
 /*   map.current.on('click', 'station-circles', (e:any) => {
        map.current.flyTo({
        'center': e.features[0].geometry.coordinates,
        'zoom': 16.5
        });
        });*/
   map.current.on("click", () => {
         map.current.flyTo({ 
            'center': [lng,lat], 
            'zoom': zoom || 16.5
        });
    });
  },[props.lon, props.lat,lat,lng, props.markers, props.zoom, geojson_markers, props.station, zoom]);
  
  return (
    <div ref={mapContainer} className="map-container"></div>
  );
}