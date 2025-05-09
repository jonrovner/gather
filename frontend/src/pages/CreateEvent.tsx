import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
const API_URL = import.meta.env.VITE_API_URL;

interface INeed {
  _id: string;
  item: string;
  claimedBy?: string;
  cost?: number;
  status: 'open' | 'claimed';
}

const CreateEvent: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect();
    }
  }, [isLoading, isAuthenticated, navigate, loginWithRedirect]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">{t('common.loading')}</div>;
  }

  // Show message if not authenticated
  if (!isAuthenticated) {
    return <div className="flex justify-center items-center min-h-screen">{t('event.loginRequired')}</div>;
  }

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  
  // Needs state
  const [needs, setNeeds] = useState<INeed[]>([]);
  const [newNeed, setNewNeed] = useState('');
  const [newNeedCost, setNewNeedCost] = useState('');

  const handleAddNeed = () => {
    if (newNeed.trim() !== '') {
      setNeeds([...needs, {
        _id: crypto.randomUUID(),
        item: newNeed,
        cost: newNeedCost ? parseFloat(newNeedCost) : undefined,
        status: 'open'
      }]);
      setNewNeed('');
      setNewNeedCost('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) return;

    try {
      const payload = {
        name,
        description,
        date: new Date(date),
        location,
        creator: user.sub,
        hostName: user.name || user.email?.split('@')[0] || 'Anonymous',
        needs: needs.map(need => ({
          _id: need._id,
          item: need.item,
          cost: need.cost,
          status: need.status
        })),
        token: crypto.randomUUID()
      };
      console.log('Payload:', payload);
      const response = await axios.post(`${API_URL}/api/events`, payload);
      if (response.status === 201) {
        console.log('✅ Event created:', response.data);
        navigate(`/events/${response.data._id}/invite`);
      } else {
        alert(t('event.error.create'));
      }
    } catch (error) {
      console.error('❌ Error creating event:', error);
      alert(t('event.error.create'));
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('event.create')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
          placeholder={t('event.name')} 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
        />
        <textarea 
          className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
          placeholder={t('event.description')} 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
        />
        <input 
          className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
          type="datetime-local" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
          required 
        />
        <input 
          className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
          placeholder={t('event.location')} 
          value={location} 
          onChange={(e) => setLocation(e.target.value)} 
          required 
        />

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">{t('event.needs')}</label>
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
          <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300">
            {needs.map((need, index) => (
              <li key={index}>
                {need.item} {need.cost && `($${need.cost})`}
              </li>
            ))}
          </ul>
        </div>

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
