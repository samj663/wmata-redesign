import "../../style.css";
import logo from "../../images/WMATA_Metro_Logo.svg.png";
import React from 'react';
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary fixed-top">
      <div className="container-fluid">
      <Link to="/" className="navbar-brand align-text-end">
        <img src={logo} alt="Logo" width="35" height=" 24" className="d-inline-block align-text-center"></img>
      </Link>
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse" id="navbarSupportedContent">
        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
          <li className="nav-item dropdown">
            <Link to="/" className="nav-link dropdown-toggle" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              Rail
            </Link>
            <ul className="dropdown-menu">
              <li><Link to="/Stationlist" className="dropdown-item">Stations</Link></li>
              <li><Link to="/nexttrain" className="dropdown-item">Next Train</Link></li>
              <li><hr className="dropdown-divider"></hr></li>
              <li><Link to="/" className="dropdown-item disabled" >Something else here</Link></li>
            </ul>
          </li>
          <li className="nav-item dropdown">
            <Link to="/" className="nav-link dropdown-toggle disabled" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              Bus
            </Link>
            <ul className="dropdown-menu">
              <li><Link to="/Station" className="dropdown-item" state={{props: {station: "Anacostia"}}}>Stations</Link></li>
              <li><Link to="/nexttrain" className="dropdown-item">Next Train</Link></li>
              <li><hr className="dropdown-divider"></hr></li>
              <li><Link to="/" className="dropdown-item disabled" >Something else here</Link></li>
            </ul>
          </li>
          <li className="nav-item">
            <Link to="/" className="nav-link disabled" aria-current="page">
              Maps
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/alerts" className="nav-link">Alerts</Link>
          </li>
        </ul>
      </div>
    </div>
  </nav>
  );
}

export default Navbar;