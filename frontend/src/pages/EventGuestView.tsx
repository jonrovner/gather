import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

interface INeed {
  _id: string;
  item: string;
  estimatedCost?: number;
  actualCost?: number;
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
    hasAccepted: boolean;
    claimedItems: string[];
  };
}

const EventGuestView: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [event, setEvent] = useState<IEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNeed, setSelectedNeed] = useState<string | null>(null);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [actualCost, setActualCost] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const fetchEvent = async () => {
      if (!token) return;

      try {
        const response = await axios.get(`${API_URL}/api/events/guest/${token}`);
        const eventData = response.data;  
        console.log('Fetched event data:', eventData); // Debug log
        
        setEvent(eventData);
        setHasAccepted(eventData.invitee?.hasAccepted || false);
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
        hasAccepted: true 
      });
      
      setHasAccepted(true);
      // Update local state
      setEvent(prev => prev ? {
        ...prev,
        invitee: {
          ...prev.invitee,
          hasAccepted: true
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
            ? { ...need, actualCost: cost }
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
    return <div className="text-center p-4">Loading...</div>;
  }

  if (!event) {
    return <div className="text-center p-4">Event not found</div>;
  }

  if (!hasAccepted) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="mb-4 text-gray-600 dark:text-gray-400">
          Invited name: {event.invitee.name}
        </div>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{event.name}</h2>
        
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-semibold mb-2">Event Details</h3>
          <p>Date: {new Date(event.date).toLocaleString()}</p>
          <p>Location: {event.location}</p>
          {event.description && <p className="mt-2">{event.description}</p>}
        </div>

        <button
          className="btn-primary w-full bg-primary-600 hover:bg-primary-700"
          onClick={handleAcceptInvitation}
          disabled={isAccepting}
        >
          {isAccepting ? 'Accepting...' : 'Accept Invitation'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <div className="mb-4 text-gray-600 dark:text-gray-400">
        Logged in as: {event.invitee.name}
      </div>
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
              value={event.invitee.name}
              readOnly
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
                  <div className="text-sm mt-1">
                    {typeof need.estimatedCost === 'number' && (
                      <span className="text-gray-600 dark:text-gray-400 mr-3">
                        Estimated: ${need.estimatedCost.toFixed(2)}
                      </span>
                    )}
                    {typeof need.actualCost === 'number' && (
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        Actual: ${need.actualCost.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                {need.status === 'open' ? (
                  <button
                    className="btn bg-primary-600 hover:bg-primary-700"
                    onClick={() => setSelectedNeed(need._id)}
                  >
                    Claim
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Claimed 
                    </span>
                    {need.claimedBy === event.invitee.name && !need.actualCost && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className="input w-24 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="Cost"
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
                          Post Cost
                        </button>
                      </div>
                    )}
                  </div>
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