import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
const API_URL = import.meta.env.VITE_API_URL;

interface INeed {
  _id: string;
  item: string;
  cost?: number;
  claimedBy?: string;
  status: 'open' | 'claimed';
}

interface IEvent {
  _id: string;
  name: string;
  description?: string;
  date: string;
  location: string;
  needs: INeed[];
  invitee: {
    name: string;
    emailOrPhone: string;
    invitation: string;
    claimedItems: string[];
  };
}

const EventGuestView: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();

  const [event, setEvent] = useState<IEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNeed, setSelectedNeed] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [actualCost, setActualCost] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const fetchEvent = async () => {
      if (!token) return;

      try {
        const response = await axios.get(`${API_URL}/api/events/guest/${token}`);
        const eventData = response.data;  
        console.log('Fetched event data:', eventData); // Debug log
        console.log('Needs data:', eventData.needs); // Debug needs specifically
        
        setEvent(eventData);
      } catch (error) {
        console.error('Error fetching event:', error);
        alert('Failed to load event details.');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchEvent();
    }
  }, [token]);

  const handleClaimItem = async (needId: string) => {
    if (!event?._id) {
      alert('Event ID is missing');
      return;
    }

    try {
      await axios.put(`${API_URL}/api/events/invitee/${token}/needs/${needId}/claim`);
      
      // Update local state
      setEvent(prev => prev ? {
        ...prev,
        needs: prev.needs.map(need => 
          need._id === needId 
            ? { ...need, claimedBy: prev.invitee.name, status: 'claimed' }
            : need
        )
      } : null);
      
      setSelectedNeed(null);
    } catch (error) {
      console.error('Error claiming item:', error);
      alert('Failed to claim item.');
    }
  };

  const handleAcceptInvitation = async () => {
    if (!token) return;

    setIsAccepting(true);
    try {
      await axios.put(`${API_URL}/api/events/invitee/${token}/accept`, {
        invitation: 'accepted'
      });
      
      // Update local state
      setEvent(prev => prev ? {
        ...prev,
        invitee: {
          ...prev.invitee,
          invitation: 'accepted'
        }
      } : null);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('Failed to accept invitation.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleUpdateCost = async (needId: string) => {
    if (!event?._id) {
      alert('Event ID is missing');
      return;
    }

    const cost = actualCost[needId];
    if (!cost || cost <= 0) {
      alert('Please enter a valid cost');
      return;
    }

    try {
      await axios.put(`${API_URL}/api/events/${event._id}/needs/${needId}/cost`, {
        cost: cost
      });
      
      // Update local state
      setEvent(prev => prev ? {
        ...prev,
        needs: prev.needs.map(need => 
          need._id === needId 
            ? { ...need, cost: cost }
            : need
        )
      } : null);
      
      // Clear the input
      setActualCost(prev => ({ ...prev, [needId]: 0 }));
    } catch (error) {
      console.error('Error updating cost:', error);
      alert('Failed to update cost.');
    }
  };

  if (isLoading) {
    return <div className="text-center p-4">{t('common.loading')}</div>;
  }

  if (!event) {
    return <div className="text-center p-4">{t('event.notFound')}</div>;
  }

  if (event.invitee.invitation !== 'accepted') {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="mb-4 text-gray-600 dark:text-gray-400">
          {t('invite.title', { eventName: event.name })}
        </div>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{event.name}</h2>
        
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">{t('event.details')}</h3>
          <p className="text-gray-700 dark:text-gray-300">{t('event.date')}: {new Date(event.date).toLocaleString()}</p>
          <p className="text-gray-700 dark:text-gray-300">{t('event.location')}: {event.location}</p>
          {event.description && <p className="mt-2 text-gray-700 dark:text-gray-300">{event.description}</p>}
        </div>

        <button
          className="btn-primary w-full bg-primary-600 hover:bg-primary-700"
          onClick={handleAcceptInvitation}
          disabled={isAccepting}
        >
          {isAccepting ? t('common.saving') : t('guest.accept')}
        </button>
      </div>
    );
  }

  console.log('Event data:', event);
  console.log('Invitee data:', event.invitee);
  console.log('Has accepted:', event.invitee.invitation === 'accepted');

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <div className="mb-4 text-gray-600 dark:text-gray-400">
        {t('guest.view')}: {event.invitee.name}
      </div>
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{event.name}</h2>
      
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">{t('event.details')}</h3>
        <p className="text-gray-700 dark:text-gray-300">{t('event.date')}: {new Date(event.date).toLocaleString()}</p>
        <p className="text-gray-700 dark:text-gray-300">{t('event.location')}: {event.location}</p>
        {event.description && <p className="mt-2 text-gray-700 dark:text-gray-300">{event.description}</p>}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t('event.needs')}</h3>
        
        {selectedNeed && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">{t('event.claim')}</h4>
            <input
              className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-2"
              placeholder={t('invite.namePlaceholder')}
              value={event.invitee.name}
              readOnly
            />
            <div className="flex gap-2">
              <button
                className="btn bg-primary-600 hover:bg-primary-700"
                onClick={() => handleClaimItem(selectedNeed)}
              >
                {t('event.claim')}
              </button>
              <button
                className="btn bg-gray-600 hover:bg-gray-700"
                onClick={() => setSelectedNeed(null)}
              >
                {t('common.back')}
              </button>
            </div>
          </div>
        )}

        <ul className="space-y-2">
          {event.needs.map((need) => {
            console.log('Need item:', need.item, 'Cost:', need.cost);
            return (
              <li 
                key={need._id}
                className="p-4 border rounded-lg dark:border-gray-700"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">{need.item}</span>
                    <div className="text-sm mt-1">
                      {need.cost && (
                        <span className="text-gray-600 dark:text-gray-400">
                          {t('event.cost')}: ${Number(need.cost).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  {need.status === 'open' ? (
                    <button
                      className="btn bg-primary-600 hover:bg-primary-700"
                      onClick={() => setSelectedNeed(need._id)}
                    >
                      {t('event.claim')}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t('event.claimed', { by: need.claimedBy })}
                      </span>
                      {need.claimedBy === event.invitee.name && !need.cost && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            className="input w-24 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder={t('event.cost')}
                            value={actualCost[need._id] || ''}
                            onChange={(e) => setActualCost(prev => ({
                              ...prev,
                              [need._id]: parseFloat(e.target.value) || 0
                            }))}
                            min="0"
                            step="0.01"
                          />
                          <button
                            className="btn bg-green-600 hover:bg-green-700"
                            onClick={() => handleUpdateCost(need._id)}
                          >
                            {t('common.save')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default EventGuestView; 