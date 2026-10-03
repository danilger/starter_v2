import { NavLink, Route, Routes } from 'react-router-dom'
import { About } from './pages/About'
import { Home } from './pages/Home'

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
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </>
  )
}

export default App
