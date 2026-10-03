import { NavLink, Route, Routes } from 'react-router-dom'
import { About } from './pages/About'
import { Calculator } from './pages/Calculator'
import { Home } from './pages/Home'
import { Weather } from './pages/Weather'

function App() {
  return (
    <>
      <nav
        className="flex justify-center gap-4 border-b border-border px-4 py-3 text-sm"
        aria-label="Main"
      >
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive
              ? 'font-semibold text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/about"
          className={({ isActive }) =>
            isActive
              ? 'font-semibold text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }
        >
          About
        </NavLink>
        <NavLink
          to="/calculator"
          className={({ isActive }) =>
            isActive
              ? 'font-semibold text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }
        >
          Calculator
        </NavLink>
        <NavLink
          to="/weather"
          className={({ isActive }) =>
            isActive
              ? 'font-semibold text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }
        >
          Weather
        </NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/weather" element={<Weather />} />
      </Routes>
    </>
  )
}

export default App
