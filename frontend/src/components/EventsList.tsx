import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { useTranslation } from 'react-i18next';
const API_URL = import.meta.env.VITE_API_URL;

interface IEvent {
  _id: string;
  name: string;
  description?: string;
  date: string;
  location: string;
  needs: Array<{
    item: string;
    status: 'open' | 'claimed';
  }>;
  creator: string;
  hostName: string;
  invitees: Array<{
    name: string;
    emailOrPhone: string;
    hasAccepted?: boolean;
    reminderPreference?: 'email' | 'sms';
  }>;
}

const EventsList: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading: isAuthLoading, getAccessTokenSilently } = useAuth0();
  const [createdEvents, setCreatedEvents] = useState<IEvent[]>([]);
  const [invitedEvents, setInvitedEvents] = useState<IEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!isAuthenticated || !user?.sub) {
        setIsLoading(false);
        return;
      }

      try {
        const token = await getAccessTokenSilently();
        
        // Fetch created events
        const createdResponse = await axios.get(`${API_URL}/api/events`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // Fetch all events and filter for invited ones
        const allEventsResponse = await axios.get(`${API_URL}/api/events`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const invitedEvents = allEventsResponse.data.filter((event: IEvent) => 
          event.creator !== user.sub && 
          event.invitees.some((invitee: { emailOrPhone: string }) => invitee.emailOrPhone === user.email)
        );

        // Sort events by date
        const sortByDate = (a: IEvent, b: IEvent) => 
          new Date(a.date).getTime() - new Date(b.date).getTime();

        setCreatedEvents(createdResponse.data.sort(sortByDate));
        setInvitedEvents(invitedEvents.sort(sortByDate));
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(t('event.error.loading'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [isAuthenticated, user?.sub, user?.email, t]);

  if (isAuthLoading) {
    return <div className="text-center p-4">{t('common.loading')}</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-600 dark:text-gray-400">{t('event.loginRequired')}</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center p-4">{t('event.loading')}</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-600">{error}</div>;
  }

  const renderEventCard = (event: IEvent) => (
    <div 
      key={event._id}
      className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-grow">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {event.name}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {new Date(event.date).toLocaleString()}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            {event.location}
          </p>
          {event.description && (
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              {event.description}
            </p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('event.hostedBy', { host: event.hostName })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('event.itemsNeeded', { count: event.needs.filter(need => need.status === 'open').length })}
          </p>
          <Link
            to={`/events/${event._id}/manage`}
            className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            {t('event.manage.button')}
          </Link>
        </div>
      </div>
    </div>
  );

  if (createdEvents.length === 0 && invitedEvents.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-600 dark:text-gray-400">{t('event.noEvents')}</p>
        <Link 
          to="/create-event" 
          className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          {t('event.createFirst')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {createdEvents.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            {t('event.myEvents')}
          </h2>
          <div className="grid gap-4">
            {createdEvents.map(renderEventCard)}
          </div>
        </div>
      )}

      {invitedEvents.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            {t('event.invitedEvents')}
          </h2>
          <div className="grid gap-4">
            {invitedEvents.map(renderEventCard)}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsList; 