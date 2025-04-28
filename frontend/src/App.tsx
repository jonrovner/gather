import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CreateEvent from './pages/CreateEvent'
import InviteGuests from './pages/InviteGuests'
import EventGuestView from './pages/EventGuestView'
import EventsList from './components/EventsList'
import ManageEvent from './pages/ManageEvent'

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { isAuthenticated, loginWithRedirect, logout } = useAuth0()
  
  const onLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    })
  }

  return (
    <nav className="mb-8 flex gap-4 items-center">
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
      <div className="ml-auto flex gap-2">
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
          onClick={() => {
            const isDark = document.documentElement.classList.contains('dark')
            document.documentElement.classList.toggle('dark')
            localStorage.setItem('darkMode', (!isDark).toString())
          }}
          className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        >
          {document.documentElement.classList.contains('dark') ? `🌙 ${t('common.dark')}` : `🌞 ${t('common.light')}`}
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
        redirect_uri: window.location.origin
      }}
    >
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto p-4">
            <Navbar />
            
            <Routes>
              <Route path="/" element={
                <div>
                  <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
                    {t('common.welcome')}
                  </h1>
                  <p className="text-gray-700 dark:text-gray-300 mb-8">
                    {t('common.welcomeSubtitle')}
                  </p>
                  <EventsList />
                </div>
              } />
              <Route path="/create-event" element={<CreateEvent />} />
              <Route path="/events/:id/invite" element={<InviteGuests />} />
              <Route path="/events/:id/manage" element={<ManageEvent />} />
              <Route path="/event/guest/:token" element={<EventGuestView />} />
            </Routes>
          </div>
        </div>
      </Router>
    </Auth0Provider>
  )
}

export default App
  