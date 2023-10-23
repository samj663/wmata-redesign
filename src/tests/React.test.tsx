/**
 * These tests aim to verify if the page loads certain elements and check if
 * certain features are working as expected. They are not made to check the structure
 * of the webpage to allow for flexibility.
 * 
 * This uses the API currenlty in production. The server takes a while to boot up,
 * so beforeAll will call it to wake up.
 */

import {render, cleanup, screen, act, waitFor, queryByAttribute, getByLabelText, getByText,getAllByText} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import NextArrivalsTable from '../pages/shared-components/NextArrivalsTable';
import Station from '../pages/Station';
import App from "../App"
import {describe, expect, test} from '@jest/globals';
import NextBusTable from '../pages/shared-components/NextBusTable';
import StationList from '../pages/StationList';
import Map from '../pages/shared-components/Map';
import {AlertsOffCanvas} from '../pages/shared-components/AlertsOffCanvas';

const {default : fetch} = require('node-fetch');
const getById = queryByAttribute.bind(null, 'id');
var key = process.env.WMATA_KEY;

jest.setTimeout(600000)

describe("React Tests", () => {
  afterEach(cleanup);

  // Server takes about 5-7 minutes but jest is set to timeout in 10 minutes just in case 
  beforeAll(async ()=>{
    await fetch("https://wmata-backend.onrender.com/api")
  })

  test('Load Next Arrivals table', async () => {
    let dom = await render(<NextArrivalsTable station="Fort Totten" group="2" includeTransf="true"/>)
    let input = getById(dom.container, "next-arrival-tables")
    expect(input).not.toBeNull
  //  await screen.findAllByText("next-arrival-tables")
  })

  test('Home page to Next Arrivals page', async () => {
    let dom = await render(<App/>)

    let input = getById(dom.container, 'page-header')
    expect(input).toHaveTextContent('DC Metro Information Hub')

    await waitFor(() => {
       userEvent.click(screen.getByText('Next Arrival'))
    })

    input = getById(dom.container, 'page-header')
    expect(input).toHaveTextContent('Next Arrivals')
  })

  test('Station Component', async () => {
    var lat = 0
    var lon = 0
    var zoom = 0;
    var station = "Anacostia"
    var markers = null
    const setLat = (t:any) => {lat = t}
    const setLon = (t:any) => {lon = t}
    const setStation = (t:any) => {station = t}
    const setMarkers = (t:any) => {markers= t}
    const setZoom = (t:any) => {zoom = t}
    var dom:any;

    await act( async () => {
      dom = render(<Station station={station}lines={["GR"]} setStation={setStation} setMarkers={setMarkers} setLat={setLat} setLon={setLon} setZoom={setZoom}/>)
    });
    
    await waitFor(() => {
      let input = getById(dom.container, 'page-header')
      expect(input).toHaveTextContent('Anacostia')
      expect(station).toBe('Anacostia')
      expect(lat).toBe(38.862072)
      expect(lon).toBe(-76.995648)
    })
  })

  test('Next Bus Table StopID = 1000031', async () => {
    var dom : any; 
    var busResponse = await fetch("https://wmata-backend.onrender.com/api/nextBus?stopid=1000031");
    var rawBus = await busResponse.json();

    await act( async () => {
      dom = render(<NextBusTable StopID="1000031"/>)
    });

    for(const e of rawBus.nextBus){
      await waitFor(() => {
        let input = getAllByText(dom.container, e.RouteID)
        expect(input).not.toBeNull
        input = getAllByText(dom.container, e.DirectionText)
        expect(input).not.toBeNull
        input = getAllByText(dom.container, e.Minutes)
        expect(input).not.toBeNull
      })
    }
  })

  test('Next Arrivals Table station = Metro Center', async () => {
    var dom : any; 
    var busResponse = await fetch("https://wmata-backend.onrender.com/api/nextarrival?station=Metro%20Center");
    var rawBus = await busResponse.json();

    await act( async () => {
      dom = render(<NextArrivalsTable station="Metro Center" includeTransf="true"/>)
    });

    for(const e of rawBus){
      await waitFor(() => {
        let input = getAllByText(dom.container, e.Car)
        expect(input).not.toBeNull
        input = getAllByText(dom.container, e.DestinationName)
        expect(input).not.toBeNull
        input = getAllByText(dom.container, e.Min)
        expect(input).not.toBeNull
        input = getAllByText(dom.container, e.Line)
        expect(input).not.toBeNull
      })
    }
  })

  test('AlertsOffCanvas Component', async () => {
    var dom : any; 
    var response = await fetch("https://wmata-backend.onrender.com/api/alerts");
    var alerts = await response.json();

    await act( async () => {
      dom = render(<AlertsOffCanvas />)
    });

    for(const e of alerts){
      await waitFor(() => {
        let input = getAllByText(dom.container, e.Description)
        expect(input).not.toBeNull
      })
    }
  })
})

export{}