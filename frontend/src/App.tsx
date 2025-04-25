import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Auth0Provider } from '@auth0/auth0-react'
import { useEffect, useState } from 'react'
import CreateEvent from './pages/CreateEvent'
import InviteGuests from './pages/InviteGuests'
import EventGuestView from './pages/EventGuestView'
import EventsList from './components/EventsList'
import ManageEvent from './pages/ManageEvent'

const App: React.FC = () => {
  const [isDark, setIsDark] = useState(() => {
    // Check if user has a saved preference
    const savedPreference = localStorage.getItem('darkMode')
    if (savedPreference !== null) {
      return savedPreference === 'true'
    }
    // If no saved preference, check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    // Update localStorage when dark mode changes
    localStorage.setItem('darkMode', isDark.toString())
    
    // Add or remove dark class from html element
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
    >
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto p-4">
            <nav className="mb-8 flex gap-4 items-center">
              <Link 
                to="/" 
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Home
              </Link>
              <Link 
                to="/create-event" 
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Create Event
              </Link>
              <button
                onClick={() => setIsDark(!isDark)}
                className="ml-auto px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              >
                {isDark ? '🌞 Light' : '🌙 Dark'}
              </button>
            </nav>
            
            <Routes>
              <Route path="/" element={
                <div>
                  <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Welcome to Gather</h1>
                  <p className="text-gray-700 dark:text-gray-300 mb-8">
                    Create and manage your events with ease
                  </p>
                  <EventsList />
                </div>
              } />
              <Route path="/create-event" element={<CreateEvent />} />
              <Route path="/events/:id/invite" element={<InviteGuests />} />
              <Route path="/events/:id/manage" element={<ManageEvent />} />
              <Route path="/event/:token" element={<EventGuestView />} />
            </Routes>
          </div>
        </div>
      </Router>
    </Auth0Provider>
  )
}

export default App
