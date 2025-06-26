import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import "./sideBar.css";
import barangayLogo from '../assets/login/barangay-logo.png';
import dashboardIcon from '../assets/side-bar/Server.png';
import addFamilyIcon from '../assets/side-bar/Add Family.png';
import distributeAidIcon from '../assets/side-bar/Send.png';
import logoutIcon from '../assets/side-bar/Log out.png';

const SidebarLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={`dashboard ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <button 
            className="hamburger" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            &#9776;
          </button>

          {sidebarOpen && (
            <>
              <div className="logo-container">
                <img 
                  src={barangayLogo} 
                  alt="Barangay Logo" 
                  className="logo" 
                  loading="lazy"
                />
              </div>
              <span className="app-title">AGAP</span>
            </>
          )}
        </div>

        <nav className="nav-links">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => isActive ? "active-link" : ""}
          >
            {sidebarOpen ? (
              <>
                <img src={dashboardIcon} alt="Dashboard" className="nav-icon" />
                <span>Dashboard</span>
              </>
            ) : (
              <img src={dashboardIcon} alt="Dashboard" className="nav-icon" />
            )}
          </NavLink>
          <NavLink 
            to="/register-family" 
            className={({ isActive }) => isActive ? "active-link" : ""}
          >
            {sidebarOpen ? (
              <>
                <img src={addFamilyIcon} alt="Add Family" className="nav-icon" />
                <span>Add Family</span>
              </>
            ) : (
              <img src={addFamilyIcon} alt="Add Family" className="nav-icon" />
            )}
          </NavLink>
          <NavLink 
            to="/distribute-aid" 
            className={({ isActive }) => isActive ? "active-link" : ""}
          >
            {sidebarOpen ? (
              <>
                <img src={distributeAidIcon} alt="Distribute Aid" className="nav-icon" />
                <span>Distribute Aid</span>
              </>
            ) : (
              <img src={distributeAidIcon} alt="Distribute Aid" className="nav-icon" />
            )}
          </NavLink>
          <NavLink to="/">
            {sidebarOpen ? (
              <>
                <img src={logoutIcon} alt="Log Out" className="nav-icon logout-icon" />
                <span>Log Out</span>
              </>
            ) : (
              <img src={logoutIcon} alt="Log Out" className="nav-icon logout-icon" />
            )}
          </NavLink>
        </nav>
      </div>

      <div className="main-content-wrapper">
        <div className="main-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SidebarLayout;