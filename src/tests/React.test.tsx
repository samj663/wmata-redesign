/**
 * Thus uses the API currenlty in production. Since the server takes a while to boot up,
 * so beforeAll will call
 */

import {render, cleanup, screen, act, waitFor, queryByAttribute, getByLabelText, getByText} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import NextArrivalsTable from '../pages/shared-components/NextArrivalsTable';
import Station from '../pages/Station';
import App from "../App"
import {describe, expect, test} from '@jest/globals';
import NextBusTable from '../pages/shared-components/NextBusTable';

const {default : fetch} = require('node-fetch');
const getById = queryByAttribute.bind(null, 'id');

jest.setTimeout(600000)

describe("React Tests", () => {
  afterEach(cleanup);

  // Server takes about 5-7 minutes but jest isset to timeout in 10 minutes just in case 
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

  test('Next Bus Table Component', async () => {
    var dom:any;

    await act( async () => {
      dom = render(<NextBusTable stopID="1000031"/>)
    });
    
    await waitFor(() => {
      let input = getByText(dom.container, 'Route')
      expect(input).not.toBeNull
      input = getByText(dom.container, 'Destination')
      expect(input).not.toBeNull
    })
  })

})

export{}