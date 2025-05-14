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

  const { user, isAuthenticated, isLoading } = useAuth0();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [event, setEvent] = useState<IEvent | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [needs, setNeeds] = useState<INeed[]>([]);
  const [newNeed, setNewNeed] = useState('');
  const [newNeedCost, setNewNeedCost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      console.log('fetchEvent called', { isAuthenticated, userSub: user?.sub, id });
      if (!isAuthenticated || !user?.sub) {
        console.log('Early return:', { isAuthenticated, userSub: user?.sub, id });
        return;
      }

      try {
        console.log('Making API request to:', `${API_URL}/api/events/${id}`);
        const response = await axios.get(`${API_URL}/api/events/${id}`);
        const eventData = response.data;
        console.log('API Response:', eventData);
        // Check if user is the creator
        if (eventData.creator !== user.sub) {
          setError('You are not authorized to manage this event');
          return;
        }

        setEvent(eventData);
        setName(eventData.name);
        setDescription(eventData.description || '');
        setDate(new Date(eventData.date).toISOString().slice(0, 16));
        setLocation(eventData.location);
        setNeeds(eventData.needs);
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
    if (newNeed.trim() !== '') {
      setNeeds([...needs, {
        _id: crypto.randomUUID(),
        item: newNeed,
        cost: newNeedCost ? parseFloat(newNeedCost) : undefined,
        status: 'claimed',
        claimedBy: user?.name || user?.email || user?.sub || 'Unknown'
      }]);
      setNewNeed('');
      setNewNeedCost('');
    }
  };

  const handleRemoveNeed = (index: number) => {
    setNeeds(needs.filter((_, i) => i !== index));
  };

  const handleClaimNeed = (index: number) => {
    if (!user?.sub) return;
    const updatedNeeds = [...needs];
    updatedNeeds[index] = {
      ...updatedNeeds[index],
      status: 'claimed',
      claimedBy: user.name || user.email || user.sub
    };
    setNeeds(updatedNeeds);
  };

  const handleUpdateNeedCost = (index: number, cost: string) => {
    const updatedNeeds = [...needs];
    updatedNeeds[index] = {
      ...updatedNeeds[index],
      cost: cost ? parseFloat(cost) : undefined
    };
    setNeeds(updatedNeeds);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!isAuthenticated || !user || !id) return;

    try {
      const payload = {
        name,
        description,
        date: new Date(date),
        location,
        needs: needs.map(need => ({
          _id: need._id,
          item: need.item,
          cost: need.cost,
          status: need.status,
          claimedBy: need.claimedBy
        }))
      };

      const response = await axios.put(`${API_URL}/api/events/${id}`, payload);
      console.log('response', response);
      if (response.status === 200) {
        console.log('✅ Event updated:', response.data);
        alert(t('event.success.updated'));
        navigate('/');
      } else {
        alert(t('event.error.updateFailed'));
      }
    } catch (error) {
      console.error('❌ Error updating event:', error);
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

        <div className="flex justify-between">
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