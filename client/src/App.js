import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/login';  
import SidebarLayout from "./pages/sideBar";
import Dashboard from './pages/dashboard';
import RegisterFamily from './pages/registerFamily';
import DistributeAid from './pages/distributeAid';


function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes with Sidebar */}
          <Route element={<SidebarLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/register-family" element={<RegisterFamily />} />
            <Route path="/distribute-aid" element={<DistributeAid />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
