import { NavLink, Route, Routes } from 'react-router-dom'
import { About } from './pages/About'
import { Home } from './pages/Home'
import './App.css'

function App() {
  return (
    <>
      <nav className="app-nav" aria-label="Main">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/about">About</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </>
  )
}

export default App
