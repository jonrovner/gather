import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import EventForms from '../components/EventForms';
import { EventType } from '../components/EventTypeSelector';
const API_URL = import.meta.env.VITE_API_URL;



interface IInvitee {
  name: string;
  emailOrPhone: string;
  invitation: 'pending' | 'sent' | 'accepted' | 'rejected';
  reminderPreference?: 'email' | 'sms';
  token?: string | null;
  claimedItems?: string[];
}

interface IBaseEvent {
  name: string;
  description?: string;
  date: Date;
  location: string;
  creator: string;
  hostName: string;
  invitees: IInvitee[];
  reminderMethod?: 'email' | 'sms';
  languagePreference?: 'en' | 'es';
  eventType: EventType;
}

const CreateEvent: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const navigate = useNavigate();
  const { type } = useParams<{ type: EventType }>();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => {
    const now = new Date();
    // Format date to YYYY-MM-DDThh:mm for datetime-local input
    return now.toISOString().slice(0, 16);
  });
  const [location, setLocation] = useState('');
  const [eventTypeData, setEventTypeData] = useState<any>(() => {
    // Initialize with empty needs array for event types that support needs
    if (type && ['eatery', 'trip', 'protest'].includes(type)) {
      return { needs: [] };
    }
    return {};
  });
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Validate event type
  useEffect(() => {
    if (type && !['eatery', 'trip', 'bizmeet', 'protest'].includes(type)) {
      navigate('/create-event');
    }
  }, [type, navigate]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect();
    }
  }, [isLoading, isAuthenticated, navigate, loginWithRedirect]);

  const handleEventTypeDataChange = (field: string, value: any) => {
    setEventTypeData((prev: any) => ({ ...prev, [field]: value }));
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">{t('common.loading')}</div>;
  }

  // Show message if not authenticated
  if (!isAuthenticated) {
    return <div className="flex justify-center items-center min-h-screen">{t('event.loginRequired')}</div>;
  }

  // Redirect to type selector if no type is selected
  if (!type || !['eatery', 'trip', 'bizmeet', 'protest'].includes(type)) {
    navigate('/create-event');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    if (!isAuthenticated || !user || !type || !user.sub) return;

    try {
      // Base event data that's common to all event types
      const baseEventData: IBaseEvent = {
        name,
        description,
        date: new Date(date),
        location,
        creator: user.sub,
        hostName: user.name || (user.email ? user.email.split('@')[0] : 'Anonymous User'),
        eventType: type as EventType,
        languagePreference: i18n.language === 'es' ? 'es' : 'en',
        invitees: [], // Initialize with empty array since invitees will be added later
      };

      // Add type-specific data
      const payload = {
        ...baseEventData,
        ...eventTypeData,
      };

      const response = await axios.post(`${API_URL}/api/events`, payload);
      if (response.status === 201) {
        navigate(`/events/${response.data._id}/invite`);
      }
    } catch (error: any) {
      console.error('❌ Error creating event:', error);
      if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
        // Show the first error message in an alert
        const firstError = Object.values(error.response.data.errors)[0];
        alert(firstError);
      } else {
        alert(t('event.error.create'));
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        {t(`event.create.${type}`)}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input 
            className={`input dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              validationErrors.name ? 'border-red-500' : ''
            }`}
            placeholder={t('event.name')} 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
          {validationErrors.name && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
          )}
        </div>
        <div>
          <textarea 
            className={`input dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              validationErrors.description ? 'border-red-500' : ''
            }`}
            placeholder={t('event.description')} 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
          />
          {validationErrors.description && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>
          )}
        </div>
        <div>
          <input 
            className={`input dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              validationErrors.date ? 'border-red-500' : ''
            }`}
            type="datetime-local" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            min={new Date().toISOString().slice(0, 16)}
            required 
          />
          {validationErrors.date && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.date}</p>
          )}
        </div>
        <div>
          <input 
            className={`input dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              validationErrors.location ? 'border-red-500' : ''
            }`}
            placeholder={t('event.location')} 
            value={location} 
            onChange={(e) => setLocation(e.target.value)} 
            required 
          />
          {validationErrors.location && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.location}</p>
          )}
        </div>

        <EventForms
          type={type}
          formData={eventTypeData}
          onFormChange={handleEventTypeDataChange}
        />

        <button 
          type="submit" 
          className="btn-primary w-full bg-primary-600 hover:bg-primary-700"
        >
          {t('event.create')}
        </button>
      </form>
    </div>
  );
};

export default CreateEvent;
