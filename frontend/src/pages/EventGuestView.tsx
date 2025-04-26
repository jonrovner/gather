import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

interface INeed {
  _id: string;
  item: string;
  estimatedCost?: number;
  claimedBy?: string;
  status: 'open' | 'claimed';
}

interface IEvent {
  _id: string;
  id: string;
  name: string;
  description?: string;
  date: string;
  location: string;
  needs: INeed[];
  token: string;
}

const EventGuestView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [event, setEvent] = useState<IEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingName, setClaimingName] = useState('');
  const [selectedNeed, setSelectedNeed] = useState<string | null>(null);
  console.log("rendering");
  

  useEffect(() => {
    const fetchEvent = async () => {
      try {

        console.log("fetching event");
        const response = await axios.get(`${API_URL}/api/events/token/?token=${token}`);
        console.log("event", response.data);
        setEvent(response.data);
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


  useEffect(() => {
    console.log('event', event);
  }, [event]);

  const handleClaimItem = async (needId: string) => {
    if (!claimingName.trim()) {
      alert('Please enter your name to claim an item');
      return;
    }

    if (!event?._id) {
      alert('Event ID is missing');
      return;
    }

    try {
      await axios.put(`${API_URL}/api/events/${event._id}/needs/${needId}/claim`, {
        claimedBy: claimingName
      });
      
      // Update local state
      setEvent(prev => prev ? {
        ...prev,
        needs: prev.needs.map(need => 
          need._id === needId 
            ? { ...need, claimedBy: claimingName, status: 'claimed' }
            : need
        )
      } : null);
      
      setClaimingName('');
      setSelectedNeed(null);
    } catch (error) {
      console.error('Error claiming item:', error);
      alert('Failed to claim item.');
    }
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (!event) {
    return <div className="text-center p-4">Event not found</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{event.name}</h2>
      
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="font-semibold mb-2">Event Details</h3>
        <p>Date: {new Date(event.date).toLocaleString()}</p>
        <p>Location: {event.location}</p>
        {event.description && <p className="mt-2">{event.description}</p>}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Items Needed</h3>
        
        {selectedNeed && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="font-semibold mb-2">Claim Item</h4>
            <input
              className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-2"
              placeholder="Your Name"
              value={claimingName}
              onChange={(e) => setClaimingName(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                className="btn bg-primary-600 hover:bg-primary-700"
                onClick={() => handleClaimItem(selectedNeed)}
              >
                Confirm Claim
              </button>
              <button
                className="btn bg-gray-600 hover:bg-gray-700"
                onClick={() => setSelectedNeed(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <ul className="space-y-2">
          {event.needs.map((need) => (
            <li 
              key={need._id}
              className="p-4 border rounded-lg dark:border-gray-700"
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{need.item}</span>
                  {need.estimatedCost && (
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      (${need.estimatedCost})
                    </span>
                  )}
                </div>
                {need.status === 'open' ? (
                  <button
                    className="btn bg-primary-600 hover:bg-primary-700"
                    onClick={() => setSelectedNeed(need._id)}
                  >
                    Claim
                  </button>
                ) : (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Claimed by {need.claimedBy}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default EventGuestView; 