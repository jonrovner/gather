import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

interface IInvitee {
  name: string;
  emailOrPhone: string;
  invitation: 'pending' | 'sent' | 'accepted' | 'rejected';
  reminderPreference?: 'email' | 'sms';
  token?: string;
  claimedItems?: string[];
}

interface IEvent {
  _id: string;
  name: string;
  date: string;
  location: string;
  invitees: IInvitee[];
}

const InviteGuests: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();

  const [event, setEvent] = useState<IEvent | null>(null);
  const [invitees, setInvitees] = useState<IInvitee[]>([]);
  const [newInvitee, setNewInvitee] = useState<IInvitee>({
    name: '',
    emailOrPhone: '',
    reminderPreference: 'email',
    invitation: 'pending'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        const token = await getAccessTokenSilently();
        const response = await axios.get(`${API_URL}/api/events/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setEvent(response.data);
        
        if (response.data.invitees) {
          setInvitees(response.data.invitees);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        alert('Failed to load event details.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id, isAuthenticated, getAccessTokenSilently]);

  const handleAddInvitee = () => {
    if (!newInvitee.emailOrPhone.trim()) {
      alert(t('invite.error.noContact'));
      return;
    }

    if (newInvitee.emailOrPhone.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newInvitee.emailOrPhone)) {
        alert(t('invite.error.invalidEmail'));
        return;
      }
    }

    // Check for duplicate invitees against all event invitees
    const isDuplicate = event?.invitees.some(
      invitee => invitee.emailOrPhone.toLowerCase() === newInvitee.emailOrPhone.toLowerCase()
    );
    if (isDuplicate) {
      alert(t('invite.error.duplicateContact'));
      return;
    }

    setInvitees([...invitees, newInvitee]);
    setNewInvitee({
      name: '',
      emailOrPhone: '',
      reminderPreference: 'email',
      invitation: 'pending'
    });
  };

  const handleRemoveInvitee = async (index: number) => {
    if (!isAuthenticated) {
      alert(t('common.error.notAuthenticated'));
      return;
    }

    const inviteeToRemove = invitees[index];
    if (!window.confirm(t('invite.confirmRemove', { name: inviteeToRemove.name || inviteeToRemove.emailOrPhone }))) {
      return;
    }

    try {
      const token = await getAccessTokenSilently();
      await axios.delete(`${API_URL}/api/events/invitee/${inviteeToRemove.token}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setInvitees(invitees.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Error removing invitee:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          alert(t('common.error.notAuthenticated'));
        } else if (error.response?.status === 403) {
          alert(t('common.error.notAuthorized'));
        } else {
          alert(t('invite.error.removeFailed'));
        }
      } else {
        alert(t('invite.error.removeFailed'));
      }
    }
  };

  const handleSendInvitations = async () => {
    if (!event || invitees.length === 0) return;

    setIsSending(true);
    try {
      const token = await getAccessTokenSilently();
      await axios.post(`${API_URL}/api/events/${id}/invite`, 
        { invitees },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      alert(t('invite.success.sent'));
      navigate('/');
    } catch (error) {
      console.error('Error sending invitations:', error);
      alert(t('invite.error.sendFailed'));
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <div className="text-center p-4">{t('common.loading')}</div>;
  }

  if (!event) {
    return <div className="text-center p-4">{t('event.notFound')}</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        {t('invite.title', { eventName: event.name })}
      </h2>
      
      <button
        onClick={() => navigate(`/events/${id}/manage`)}
        className="mb-4 text-primary-600 hover:text-primary-700 flex items-center"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {t('common.back')}
      </button>
      
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="font-semibold mb-2">{t('event.details')}</h3>
        <p>{t('event.date')}: {new Date(event.date).toLocaleString()}</p>
        <p>{t('event.location')}: {event.location}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">{t('invite.addGuests')}</label>
          <div className="space-y-2">
            <input 
              className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              placeholder={t('invite.namePlaceholder')} 
              value={newInvitee.name} 
              onChange={(e) => setNewInvitee({...newInvitee, name: e.target.value})} 
            />
            <input 
              className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              placeholder={t('invite.contactPlaceholder')} 
              value={newInvitee.emailOrPhone} 
              onChange={(e) => setNewInvitee({...newInvitee, emailOrPhone: e.target.value})} 
              required
            />
            <select
              className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={newInvitee.reminderPreference || 'email'}
              onChange={(e) => setNewInvitee({...newInvitee, reminderPreference: e.target.value as 'email' | 'sms'})}
            >
              <option value="email">{t('invite.emailReminders')}</option>
              <option value="sms">{t('invite.smsReminders')}</option>
            </select>
            <button 
              type="button" 
              className="btn bg-primary-600 hover:bg-primary-700" 
              onClick={handleAddInvitee}
            >
              {t('invite.addGuest')}
            </button>
          </div>
        </div>

        {invitees.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">{t('invite.guestList')}</h3>
            <ul className="space-y-2">
              {invitees.map((invitee, index) => (
                <li key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div>
                    <span className="font-medium">{invitee.name || t('invite.anonymous')}</span>
                    <span className="text-gray-600 dark:text-gray-400"> - {invitee.emailOrPhone}</span>
                    <span className="text-sm text-gray-500"> ({invitee.reminderPreference})</span>
                    <span className={`ml-2 text-sm ${
                      invitee.invitation === 'sent' ? 'text-blue-600' : 'text-yellow-600'
                    }`}>
                      {t(`invite.status.${invitee.invitation}`)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveInvitee(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    {t('invite.remove')}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button 
          type="button" 
          className="btn-primary w-full bg-primary-600 hover:bg-primary-700"
          onClick={handleSendInvitations}
          disabled={isSending || invitees.length === 0}
        >
          {isSending ? t('invite.sending') : t('invite.sendInvitations')}
        </button>
      </div>
    </div>
  );
};

export default InviteGuests; 