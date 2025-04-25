import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const API_URL = import.meta.env.VITE_API_URL;

interface INeed {
  item: string;
  estimatedCost?: number;
}

const CreateEvent: React.FC = () => {
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
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  // Show message if not authenticated
  if (!isAuthenticated) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to create an event.</div>;
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
        item: newNeed,
        estimatedCost: newNeedCost ? parseFloat(newNeedCost) : undefined
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
        needs: needs.map(need => ({
          item: need.item,
          estimatedCost: need.estimatedCost,
          status: 'open'
        })),
        token: crypto.randomUUID()
      };

      const response = await axios.post(`${API_URL}/api/events`, payload);
      console.log('✅ Event created:', response.data);
      
      // Navigate to the invitation page with the event ID
      navigate(`/events/${response.data._id}/invite`);
    } catch (error) {
      console.error('❌ Error creating event:', error);
      alert('Failed to create event.');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Create New Event</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
          placeholder="Event Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
        />
        <textarea 
          className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
          placeholder="Description" 
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
          placeholder="Location" 
          value={location} 
          onChange={(e) => setLocation(e.target.value)} 
          required 
        />

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Things You Need</label>
          <div className="flex gap-2 mb-2">
            <input 
              className="input flex-grow dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              placeholder="e.g. Burgers" 
              value={newNeed} 
              onChange={(e) => setNewNeed(e.target.value)} 
            />
            <input 
              className="input w-24 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              type="number" 
              placeholder="Cost" 
              value={newNeedCost} 
              onChange={(e) => setNewNeedCost(e.target.value)} 
            />
            <button 
              type="button" 
              className="btn bg-primary-600 hover:bg-primary-700" 
              onClick={handleAddNeed}
            >
              Add
            </button>
          </div>
          <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300">
            {needs.map((need, index) => (
              <li key={index}>
                {need.item} {need.estimatedCost && `($${need.estimatedCost})`}
              </li>
            ))}
          </ul>
        </div>

        <button 
          type="submit" 
          className="btn-primary w-full bg-primary-600 hover:bg-primary-700"
        >
          Create Event
        </button>
      </form>
    </div>
  );
};

export default CreateEvent;
