import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
const API_URL = import.meta.env.VITE_API_URL;

interface INeed {
  _id?: string;
  item: string;
  cost?: number;
  status: 'open' | 'claimed';
  claimedBy?: string;
}

interface IInvitee {
  name: string;
  emailOrPhone: string;
  invitation: 'pending' | 'sent' | 'accepted' | 'rejected';
  reminderPreference?: 'email' | 'sms';
}

interface IEvent {
  _id: string;
  name: string;
  description?: string;
  date: string;
  location: string;
  needs: INeed[];
  creator: string;
  invitees: IInvitee[];
}

const ManageEvent: React.FC = () => {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [event, setEvent] = useState<IEvent | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newNeed, setNewNeed] = useState('');
  const [newNeedCost, setNewNeedCost] = useState('');

  const getUserDisplayName = (name: string) => {
    // If this is the current user (host), return "Host"
    if (name === user?.name || name === user?.sub || name === t('event.host')) {
      return t('event.host');
    }
    // If we have the name in the invitees list, use that
    const invitee = event?.invitees.find(inv => inv.name === name);
    if (invitee?.name) {
      return invitee.name;
    }
    // Otherwise return the name as is
    return name || t('event.someone');
  };

  useEffect(() => {
    const fetchEvent = async () => {
      if (!isAuthenticated || !user?.sub) {
        return;
      }
      
      try {
        const token = await getAccessTokenSilently();
        const response = await axios.get(`${API_URL}/api/events/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const eventData = response.data;
        
        if (eventData.creator !== user.sub) {
          setError('You are not authorized to manage this event');
          return;
        }

        setEvent(eventData);

        
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event');
      } finally {
        setIsLoadingEvent(false);
      }
    };

    fetchEvent();
  }, [isAuthenticated, user?.sub, id]);

  const handleAddNeed = () => {
    if (!event || !newNeed.trim()) return;

    const updatedNeeds = [...event.needs, {
      _id: crypto.randomUUID(),
      item: newNeed,
      cost: newNeedCost ? parseFloat(newNeedCost) : undefined,
      status: 'open' as const
    }];

    setEvent({ ...event, needs: updatedNeeds });
    setNewNeed('');
    setNewNeedCost('');
  };

  const handleRemoveNeed = (index: number) => {
    if (!event) return;
    const updatedNeeds = event.needs.filter((_, i) => i !== index);
    setEvent({ ...event, needs: updatedNeeds });
  };

  const handleUpdateNeedCost = (index: number, cost: string) => {
    if (!event) return;
    const updatedNeeds = [...event.needs];
    updatedNeeds[index] = {
      ...updatedNeeds[index],
      cost: cost ? parseFloat(cost) : undefined
    };
    setEvent({ ...event, needs: updatedNeeds });
  };

  const handleClaimNeed = (index: number) => {
    if (!event || !user?.sub) return;
    const updatedNeeds = [...event.needs];
    updatedNeeds[index] = {
      ...updatedNeeds[index],
      status: 'claimed' as const,
      claimedBy: user.name || t('event.host')
    };
    setEvent({ ...event, needs: updatedNeeds });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!isAuthenticated || !user || !id || !event) return;

    try {
      const payload = {
        name: event.name,
        description: event.description,
        date: event.date,
        location: event.location,
        needs: event.needs
      };

      const response = await axios.put(`${API_URL}/api/events/${id}`, payload);
      if (response.status === 200) {
        alert(t('event.success.updated'));
        navigate('/');
      } else {
        alert(t('event.error.updateFailed'));
      }
    } catch (error) {
      console.error('Error updating event:', error);
      alert(t('event.error.updateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('event.confirm.delete'))) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/events/${id}`);
      alert(t('event.success.deleted'));
      navigate('/');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(t('event.error.deleteFailed'));
    }
  };

  if (isLoading || isLoadingEvent) {
    return <div className="text-center p-4">{t('common.loading')}</div>;
  }

  if (!isAuthenticated) {
    return <div className="text-center p-4">{t('common.loginRequired')}</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-600">{error}</div>;
  }

  if (!event) {
    return <div className="text-center p-4">{t('event.notFound')}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        {t('event.manage.title', { eventName: event.name })}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">
            {t('event.name')}
          </label>
          <input
            type="text"
            className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={event.name}
            onChange={(e) => setEvent({ ...event, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">
            {t('event.description')}
          </label>
          <textarea
            className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={event.description}
            onChange={(e) => setEvent({ ...event, description: e.target.value })}
            rows={3}
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">
            {t('event.date')}
          </label>
          <input
            type="datetime-local"
            className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={new Date(event.date).toISOString().slice(0, 16)}
            onChange={(e) => setEvent({ ...event, date: new Date(e.target.value).toISOString() })}
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">
            {t('event.location')}
          </label>
          <input
            type="text"
            className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={event.location}
            onChange={(e) => setEvent({ ...event, location: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">
            {t('event.needs')}
          </label>
          <div className="flex gap-2 mb-2">
            <input 
              className="input flex-grow dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              placeholder={t('event.needPlaceholder')} 
              value={newNeed} 
              onChange={(e) => setNewNeed(e.target.value)} 
            />
            <input 
              className="input w-24 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              type="number" 
              placeholder={t('event.cost')} 
              value={newNeedCost} 
              onChange={(e) => setNewNeedCost(e.target.value)} 
            />
            <button 
              type="button" 
              className="btn bg-primary-600 hover:bg-primary-700" 
              onClick={handleAddNeed}
            >
              {t('common.add')}
            </button>
          </div>
          <ul className="space-y-2">
            {event.needs.map((need, index) => (
              <li key={index} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 dark:text-gray-300">
                    {need.item}
                  </span>
                  <input
                    type="number"
                    className="input w-24 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder={t('event.cost')}
                    value={need.cost || ''}
                    onChange={(e) => handleUpdateNeedCost(index, e.target.value)}
                  />
                  <span className={`ml-2 text-sm ${need.status === 'claimed' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {need.status === 'claimed' ? t('event.claimed', { by: getUserDisplayName(need.claimedBy || '') }) : t('event.open')}
                  </span>
                </div>
                <div className="flex gap-2">
                  {need.status === 'open' && (
                    <button
                      type="button"
                      className="text-green-600 hover:text-green-800"
                      onClick={() => handleClaimNeed(index)}
                    >
                      {t('event.claim')}
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-red-600 hover:text-red-800"
                    onClick={() => handleRemoveNeed(index)}
                  >
                    {t('common.remove')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-evenly">
          <button
            type="submit"
            className="btn-primary bg-primary-600 hover:bg-primary-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('common.saving') : t('common.save')}
          </button>

          <div className="space-x-2">
            <button
              type="button"
              className="btn bg-gray-600 hover:bg-gray-700"
              onClick={() => navigate(`/events/${id}/invite`)}
            >
              {t('event.manage.invitations')}
            </button>

            <button
              type="button"
              className="btn bg-green-600 hover:bg-green-700 text-white"
              onClick={() => navigate(`/events/${id}/bill-split`)}
            >
              {t('event.splitBill')}
            </button>

            <button
              type="button"
              className="btn bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
            >
              {t('event.delete')}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">{t('event.invitees')}</h3>
        {event.invitees.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">{t('event.noInvitees')}</p>
        ) : (
          <ul className="space-y-2">
            {event.invitees.map((invitee, index) => (
              <li key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div>
                  <span className="font-medium">{invitee.name || t('invite.anonymous')}</span>
                  <span className="text-gray-600 dark:text-gray-400"> - {invitee.emailOrPhone}</span>
                  <span className={`ml-2 text-sm ${
                    invitee.invitation === 'sent' ? 'text-blue-600' : 'text-yellow-600'
                  }`}>
                    {t(`invite.status.${invitee.invitation}`)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ManageEvent; 