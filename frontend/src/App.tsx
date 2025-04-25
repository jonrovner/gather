import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Auth0Provider } from '@auth0/auth0-react'
import CreateEvent from './pages/CreateEvent'
import InviteGuests from './pages/InviteGuests'
import EventGuestView from './pages/EventGuestView'

const App: React.FC = () => {
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
            <nav className="mb-8 flex gap-4">
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
            </nav>
            
            <Routes>
              <Route path="/" element={
                <div className="text-center">
                  <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Welcome to Gather</h1>
                  <p className="text-gray-700 dark:text-gray-300">
                    Create and manage your events with ease
                  </p>
                </div>
              } />
              <Route path="/create-event" element={<CreateEvent />} />
              <Route path="/events/:id/invite" element={<InviteGuests />} />
              <Route path="/event/:token" element={<EventGuestView />} />
            </Routes>
          </div>
        </div>
      </Router>
    </Auth0Provider>
  )
}

export default App
