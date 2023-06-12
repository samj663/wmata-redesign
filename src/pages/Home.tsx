import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from "./shared-components/Navbar";

export default function Home() {
  return (
    <div style={{height: "100%"}}>
      <Navbar/>
      <div style={{height: "71px"}}></div>
      <div className="container-fluid text-center">
        <h1 className="m-5">WMATA Information Hub</h1>
        <div className="row g-3 align-items-center m-5">
          <div className="col-5 d-flex container text-center">
            <input type="email" className="form-control p-2 m-2" id="exampleFormControlInput1" placeholder="Search bar not functional yet" disabled></input>
            <button type="button" className="btn btn-primary p-2 m-2" disabled>Search</button>
          </div>
        </div>
        <div className="row g-3">
          <div className="container text-center" >
            <Link to="/Stationlist">
              <button type="button" className="btn btn-primary p-2 m-2">Station Information</button>
            </Link>
            <Link to="/nexttrain">
              <button type="button" className="btn btn-primary p-2 m-2">Next Arrivals</button>
            </Link>
            <button type="button" className="btn btn-primary p-2 m-2" disabled> Bus Information</button>
            <button type="button" className="btn btn-primary p-2 m-2" disabled>Maps</button>
          </div>
        </div>
      </div>
    </div>
  );
}