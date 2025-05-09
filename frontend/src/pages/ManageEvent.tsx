import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
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
  hasAccepted?: boolean;
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
        item: newNeed,
        cost: newNeedCost ? parseFloat(newNeedCost) : undefined,
        status: 'open'
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
        navigate('/');
      } else {
        alert('Failed to update event.');
      }
    } catch (error) {
      console.error('❌ Error updating event:', error);
      alert('Failed to update event.');
    }
  };

  const onDeleteEvent = async (eventId: string) => {
    try {
      await axios.delete(`${API_URL}/api/events/${eventId}`);
      alert('Event deleted successfully!');
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };  


  if (isLoading || isLoadingEvent) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to manage events.</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-600">{error}</div>;
  }

  if (!event) {
    return <div className="flex justify-center items-center min-h-screen">Event not found.</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Manage Event</h2>
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
          <ul className="space-y-2">
            {needs.map((need, index) => (
              <li key={index} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 dark:text-gray-300">
                    {need.item}
                  </span>
                  <input
                    type="number"
                    className="input w-24 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Cost"
                    value={need.cost || ''}
                    onChange={(e) => handleUpdateNeedCost(index, e.target.value)}
                  />
                  <span className={`ml-2 text-sm ${need.status === 'claimed' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {need.status === 'claimed' ? `Claimed by ${need.claimedBy}` : need.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  {need.status !== 'claimed' && (
                    <button
                      type="button"
                      className="text-green-600 hover:text-green-800"
                      onClick={() => handleClaimNeed(index)}
                    >
                      Claim
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-red-600 hover:text-red-800"
                    onClick={() => handleRemoveNeed(index)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Invitees</h3>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            {event.invitees.length > 0 ? (
              <ul className="space-y-2">
                {event.invitees.map((invitee, index) => (
                  <li key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                    <div>
                      <span className="font-medium">{invitee.name || 'Guest'}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                        ({invitee.emailOrPhone})
                      </span>
                      {invitee.hasAccepted !== undefined && (
                        <span className={`ml-2 text-sm ${invitee.hasAccepted ? 'text-green-600' : 'text-yellow-600'}`}>
                          {invitee.hasAccepted ? 'Accepted' : 'Pending'}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No invitees yet</p>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            type="submit" 
            className="btn-primary flex-1 bg-primary-600 hover:bg-primary-700"
          >
            Save Changes
          </button>
          <button
            type="button"
            className="btn flex-1 bg-gray-600 hover:bg-gray-700"
            onClick={() => navigate(`/events/${id}/invite`)}
          >
            Manage Invites
          </button>
          <button
            type="button"
            className="btn flex-1 bg-red-600 hover:bg-gray-700"
            onClick={() => onDeleteEvent(id || '')}
          >
            Delete Event
          </button> 
        </div>
      </form>
    </div>
  );
};

export default ManageEvent; 