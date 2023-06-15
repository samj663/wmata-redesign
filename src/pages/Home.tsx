import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from "./shared-components/Navbar";

export default function Home() {
  return (
    <div style={{height: "100%", backgroundColor: "white"}}>
      <Navbar/>
      <div style={{height: "71px"}}></div>
      <div className="container-fluid text-center">
        <h1 className="mt-5 mb-5">WMATA Information Hub</h1>
        <div className="row align-items-center">
          <div className="col-12 col-sm-8 col-lg-6 d-flex container text-center">
            <input type="email" className="form-control m-1 " id="exampleFormControlInput1" placeholder="Search bar not functional yet" disabled></input>
            <button type="button" className="btn btn-primary m-1 " disabled>Search</button>
          </div>
        </div>
        <div className="row">
          <div className="d-grid d-sm-inline-block container text-center mt-5" >
            <Link to="/Stationlist" className="d-grid d-sm-inline-block m-1 gap-2">
              <button type="button" className="btn btn-primary">Station Information</button>
            </Link>
            <Link to="/nexttrain" className="d-grid d-sm-inline-block m-1 gap-2">
              <button type="button" className="btn btn-primary">Next Arrivals</button>
            </Link>
            <Link to="/" className="d-grid d-sm-inline-block m-1 gap-2">
              <button type="button" className="btn btn-primary" disabled> Bus Information</button>
            </Link>
            <Link to="/" className="d-grid d-sm-inline-block m-1 gap-2">
              <button type="button" className="btn btn-primary" disabled>Maps</button>
            </Link>
            <Link to="/alerts" className="d-grid d-sm-inline-block m-1 gap-2">
              <button type="button" className="btn btn-primary">Alerts</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}