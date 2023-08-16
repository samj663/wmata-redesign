import React, { useState, useEffect, useRef} from 'react';

var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
 
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;

export default function BusMap(props : any) {
  var map : any = useRef(null);
  const mapContainer = useRef(null);
<<<<<<< HEAD

  useEffect(()=>{
    if(map.current == null) return;
    map.current.flyTo({
      center: props.center_to,
      zoom: 15
      })
  },[props.center_to])

  useEffect(()=>{
=======
  const [lat, setLat] = useState(38.89834);
  const [lng, setLng] = useState(-77.021851);
  const [zoom, setZoom] = useState(12);
  const [geojson_markers, setMarkers] = useState<any>(null)
  var  markerTracker : any = useRef([])

  useEffect(()=>{
 //   setLng(props.lon);
 //   setLat(props.lat);
    setMarkers(props.markers);
    
>>>>>>> e6bcdfd5a31abda072b4276b9480be337f6621de
    if (map.current) return; // initialize map only once
    else{
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: process.env.REACT_APP_MAPBOX_STYLE,
        center: [-77.021851 ,38.89834 ],
<<<<<<< HEAD
        zoom: 12
=======
        zoom: zoom
>>>>>>> e6bcdfd5a31abda072b4276b9480be337f6621de
      });

      map.current.on('idle',function(){ map.current.resize() })

      map.current.on("load", () =>{
<<<<<<< HEAD
        map.current.addSource('path',{
          'type': 'geojson',
          'data': {
            "type": "Feature",
            "geometry": {
              "type": "LineString",
               "coordinates": [[38.89834,-77.021851],[38.90834,-77.031851]]
            },
          }
        })
        map.current.addSource('stops',{
          'type': 'geojson',
          'data': {
            "type": "FeatureCollection",
            "features": [
              {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                 "coordinates": [38.89834,-77.021851]
              },
              }
            ]
          }
        })
        map.current.addLayer({
          'id': 'route',
          'type': 'line',
          'source': 'path',
          'layout': {
          
          'line-cap': 'round'
          },
          'paint': {
          'line-color': '#000',
          'line-width': 6
          }
        });
        map.current.addLayer({
          'id': 'stop',
          'source': 'stops',
          'type': 'circle',
          'paint': {
            'circle-radius': 4,
              'circle-color': '#ffffff',
              'circle-stroke-width': 3
          },
          'filter': ['==', '$type', 'Point']
        });
        map.current.resize()
      })
    }
  },[props.lon, props.lat, props.markers, props.zoom])


  useEffect(()=>{
    if (!map.current) return; // initialize map only once
    var bounds : any;
    if(props.line_path === null) return;
    else if(map.current.getSource('path') !== undefined){
      map.current.getSource('path').setData(props.line_path.data)

      const coordinates = props.line_path.data.geometry.coordinates

      bounds = new mapboxgl.LngLatBounds(coordinates[0],coordinates[0])

      for (const coord of coordinates) { bounds.extend(coord) }

      map.current.fitBounds(bounds, { padding: 20 });

    }
    if(props.stops === null) return ;
    else if(map.current.getSource('stops') !== undefined){
      console.log(props.stops)
      map.current.getSource('stops').setData(props.stops.data)
      map.current.resize()
    }
    map.current.on("click", () => {
      map.current.fitBounds(bounds, { padding: 20 });
    });
  },[props.line_path, props.direction1_path, props.route, props.stops])

=======
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
  
>>>>>>> e6bcdfd5a31abda072b4276b9480be337f6621de
  return (
    <div ref={mapContainer} className="map-container"></div>
  );
}