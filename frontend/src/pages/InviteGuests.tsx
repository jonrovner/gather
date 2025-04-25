import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

interface IInvitee {
  name: string;
  emailOrPhone: string;
  reminderPreference: 'email' | 'sms';
}

interface IEvent {
  _id: string;
  name: string;
  date: string;
  location: string;
  token: string;
}

const InviteGuests: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<IEvent | null>(null);
  const [invitees, setInvitees] = useState<IInvitee[]>([]);
  const [newInvitee, setNewInvitee] = useState<IInvitee>({
    name: '',
    emailOrPhone: '',
    reminderPreference: 'email'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/events/${id}`);
        setEvent(response.data);
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
  }, [id]);

  const handleAddInvitee = () => {
    if (newInvitee.emailOrPhone.trim() !== '') {
      setInvitees([...invitees, newInvitee]);
      setNewInvitee({
        name: '',
        emailOrPhone: '',
        reminderPreference: 'email'
      });
    }
  };

  const handleSendInvitations = async () => {
    if (!event || invitees.length === 0) return;

    setIsSending(true);
    try {
      await axios.post(`${API_URL}/api/events/${id}/invite`, { invitees });
      alert('Invitations sent successfully!');
      navigate('/events'); // Navigate back to events list
    } catch (error) {
      console.error('Error sending invitations:', error);
      alert('Failed to send invitations.');
    } finally {
      setIsSending(false);
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
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Invite Guests to {event.name}</h2>
      
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="font-semibold mb-2">Event Details</h3>
        <p>Date: {new Date(event.date).toLocaleString()}</p>
        <p>Location: {event.location}</p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Share this link with guests: {window.location.origin}/event/{event.token}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Add Guests</label>
          <div className="space-y-2">
            <input 
              className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              placeholder="Name (optional)" 
              value={newInvitee.name} 
              onChange={(e) => setNewInvitee({...newInvitee, name: e.target.value})} 
            />
            <input 
              className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              placeholder="Email or Phone" 
              value={newInvitee.emailOrPhone} 
              onChange={(e) => setNewInvitee({...newInvitee, emailOrPhone: e.target.value})} 
              required
            />
            <select
              className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={newInvitee.reminderPreference}
              onChange={(e) => setNewInvitee({...newInvitee, reminderPreference: e.target.value as 'email' | 'sms'})}
            >
              <option value="email">Email Reminders</option>
              <option value="sms">SMS Reminders</option>
            </select>
            <button 
              type="button" 
              className="btn bg-primary-600 hover:bg-primary-700" 
              onClick={handleAddInvitee}
            >
              Add Guest
            </button>
          </div>
        </div>

        {invitees.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Guest List</h3>
            <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300">
              {invitees.map((invitee, index) => (
                <li key={index}>
                  {invitee.name || 'Anonymous'} - {invitee.emailOrPhone} ({invitee.reminderPreference})
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
          {isSending ? 'Sending...' : 'Send Invitations'}
        </button>
      </div>
    </div>
  );
};

export default InviteGuests; 