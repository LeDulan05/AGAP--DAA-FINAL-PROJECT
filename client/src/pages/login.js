import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./login.css";
import barangayLogo from '../assets/login/barangay-logo.png';
import vector1 from '../assets/login/vector1.png';
import ellipse1 from '../assets/login/ellipse1.png';
import ellipse2 from '../assets/login/ellipse2.png';
import ellipse3 from '../assets/login/ellipse3.png';
import user from '../assets/login/user.png';
import lock from '../assets/login/lock.png';

function Login() {
  const [username, setUsername] = useState('admin'); //Default username
  const [password, setPassword] = useState('password'); //Default password
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    if (username === 'admin' && password === 'password') {
      localStorage.setItem('isLoggedIn', 'true');
      navigate('/dashboard');
    } else {
      alert('Invalid username or password');
    }
  };

  return (
    <div className="loginPage">
      <img src={vector1} alt="background vector" className="v1" />
      <img src={ellipse3} alt="background ellipse" className="e3" />
      <img src={ellipse2} alt="background ellipse" className="e2" />
      <img src={ellipse1} alt="background ellipse" className="e1" />

      
      <img src={barangayLogo} alt="Barangay Logo" className="logo" />

      {/* Login Form */}
      <form onSubmit={handleLogin}>
        <div className="inputWithIcon">
          <input
            type="text"
            placeholder="USERNAME"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <span className="userIcon">
            <img src={user} alt="user icon" />
          </span>
        </div>

        <div className="inputWithIcon">
          <input
            type="password"
            placeholder="PASSWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span className="userIcon">
            <img src={lock} alt="lock icon" />
          </span>
        </div>
        
        <button type="submit">LOGIN</button>
      </form>
    </div>
  );
}

export default Login;