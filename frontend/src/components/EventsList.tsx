import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
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
}

const EventsList: React.FC = () => {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth0();
  const [events, setEvents] = useState<IEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!isAuthenticated || !user?.sub) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/events`, {
          params: {
            creator: user.sub
          }
        });
        // Sort events by date
        const sortedEvents = response.data.sort((a: IEvent, b: IEvent) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setEvents(sortedEvents);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [isAuthenticated, user?.sub]);

  if (isAuthLoading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-600 dark:text-gray-400">Please log in to view your events</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center p-4">Loading events...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-600">{error}</div>;
  }

  if (events.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-600 dark:text-gray-400">No upcoming events</p>
        <Link 
          to="/create-event" 
          className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Create Your First Event
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {events.map((event) => (
        <div 
          key={event._id}
          className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
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
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {event.needs.filter(need => need.status === 'open').length} items needed
              </p>
              <Link
                to={`/events/${event._id}/manage`}
                className="mt-2 inline-block px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Manage
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventsList; 