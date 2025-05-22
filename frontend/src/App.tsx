import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CreateEvent from './pages/CreateEvent'
import EventTypeSelector from './components/EventTypeSelector'
import InviteGuests from './pages/InviteGuests'
import EventGuestView from './pages/EventGuestView'
import EventsList from './components/EventsList'
import ManageEvent from './pages/ManageEvent'
import BillSplit from './pages/BillSplit'

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { isAuthenticated, loginWithRedirect, logout } = useAuth0()
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'))
  
  const onLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    })
  }

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('darkMode', newDarkMode.toString())
  }

  return (
    <nav className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          to="/" 
          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          {t('common.home')}
        </Link>
        <Link 
          to="/create-event" 
          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          {t('common.createEvent')}
        </Link>
      </div>
      <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:ml-auto">
        <button
          onClick={() => {
            const newLang = i18n.language === 'en' ? 'es' : 'en'
            i18n.changeLanguage(newLang)
          }}
          className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        >
          {i18n.language === 'en' ? '🇺🇸 EN' : '🇪🇸 ES'}
        </button>
        <button
          onClick={toggleDarkMode}
          className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        >
          {isDarkMode ? `🌙 ${t('common.dark')}` : `🌞 ${t('common.light')}`}
        </button>
        {isAuthenticated ? (
          <button 
          className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          onClick={onLogout}>Logout</button>
        ) : (
          <button 
           className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          onClick={() => loginWithRedirect()}>Login</button>
        )}
      </div>
    </nav>
  )
}

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="mt-8 py-4 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
        <p>© {currentYear} Jona Rovner. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <a 
            href="https://rovners.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-primary-600 dark:hover:text-primary-400"
          >
            Portfolio
          </a>
          <a 
            href="https://github.com/jonrovner" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-primary-600 dark:hover:text-primary-400"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}

const App: React.FC = () => {
  const { t } = useTranslation()

  useEffect(() => {
    const savedPreference = localStorage.getItem('darkMode')
    if (savedPreference !== null) {
      if (savedPreference === 'true') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: 'https://gather-api'
      }}
    >
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
          <div className="container mx-auto px-4 sm:px-6 py-4 flex-grow">
            <Navbar />
            
            <Routes>
              <Route path="/" element={
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-8 text-gray-900 dark:text-white">
                    {t('common.welcome')}
                  </h1>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 sm:mb-8">
                    {t('common.welcomeSubtitle')}
                  </p>
                  <EventsList />
                </div>
              } />
              <Route path="/create-event" element={<EventTypeSelector />} />
              <Route path="/create-event/:type" element={<CreateEvent />} />
              <Route path="/events/:id/invite" element={<InviteGuests />} />
              <Route path="/events/:id/manage" element={<ManageEvent />} />
              <Route path="/event/guest/:token" element={<EventGuestView />} />
              <Route path="/events/:id/bill-split" element={<BillSplit />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </Auth0Provider>
  )
}

export default App
  