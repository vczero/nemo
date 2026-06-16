import React from 'react'
import OceanCanvas from '../components/OceanCanvas'
import HatchLoginCard from '../components/HatchLoginCard'
import './Login.css'

const Login = () => {
  return (
    <div className="login-container">
      <OceanCanvas />
      <div className="login-wrapper">
        <HatchLoginCard />
      </div>
    </div>
  )
}

export default Login
