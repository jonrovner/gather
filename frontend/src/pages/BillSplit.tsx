import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
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

interface IBillSplit {
  person: string;
  paid: number;
  owes: number;
  balance: number;
  isIncluded: boolean;
  emailOrPhone?: string;
}

const BillSplit: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth0();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<IEvent | null>(null);
  const [billSplit, setBillSplit] = useState<IBillSplit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!isAuthenticated || !user?.sub || !id) return;

      try {
        const response = await axios.get(`${API_URL}/api/events/${id}`);
        const eventData = response.data;
        
        if (eventData.creator !== user.sub) {
          setError('You are not authorized to manage this event');
          return;
        }

        setEvent(eventData);
        calculateBillSplit(eventData);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [isAuthenticated, user?.sub, id]);

  const calculateBillSplit = (eventData: IEvent) => {
    const totalCost = eventData.needs.reduce((sum, need) => sum + (need.cost || 0), 0);
    console.log('totalCost', totalCost);
    const includedPeople = billSplit.filter(split => split.isIncluded).length;
    console.log('includedPeople', includedPeople);
    const perPersonShare = includedPeople > 0 ? totalCost / includedPeople : 0;
    console.log('perPersonShare', perPersonShare);
    const split: IBillSplit[] = [];

    // Add host
    const hostPaid = eventData.needs
      .filter(need => need.claimedBy === user?.name || need.claimedBy === user?.email)
      .reduce((sum, need) => sum + (need.cost || 0), 0);
    
    split.push({
      person: user?.name || 'Host',
      paid: hostPaid,
      owes: perPersonShare,
      balance: hostPaid - perPersonShare,
      isIncluded: true,
      emailOrPhone: user?.email
    });

    // Add invitees
    eventData.invitees.forEach(invitee => {
      if (invitee.hasAccepted) {
        const inviteePaid = eventData.needs
          .filter(need => need.claimedBy === invitee.name)
          .reduce((sum, need) => sum + (need.cost || 0), 0);

        split.push({
          person: invitee.name,
          paid: inviteePaid,
          owes: perPersonShare,
          balance: inviteePaid - perPersonShare,
          isIncluded: true,
          emailOrPhone: invitee.emailOrPhone
        });
      }
    });

    setBillSplit(split);
  };

  const togglePersonIncluded = (index: number) => {
    const updatedSplit = [...billSplit];
    updatedSplit[index] = {
      ...updatedSplit[index],
      isIncluded: !updatedSplit[index].isIncluded
    };
    setBillSplit(updatedSplit);
    if (event) {
      calculateBillSplit(event);
    }
  };

  const handleSendPaymentRequest = async (person: string, amount: number, emailOrPhone?: string) => {
    if (!event || !user || !emailOrPhone) {
      alert(t('billSplit.error.missingContact'));
      return;
    }
    
    setIsSendingEmail(true);
    try {
      await axios.post(`${API_URL}/api/events/${event._id}/payment-request`, {
        amount,
        recipient: person,
        recipientEmail: emailOrPhone,
        eventName: event.name,
        hostName: user.name || 'Host',
        hostEmail: user.email
      });
      
      alert(t('billSplit.success.paymentRequestSent'));
    } catch (error) {
      console.error('Error sending payment request:', error);
      alert(t('billSplit.error.paymentRequestFailed'));
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">{t('common.loading')}</div>;
  }

  if (!isAuthenticated) {
    return <div className="flex justify-center items-center min-h-screen">{t('event.loginRequired')}</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-600">{error}</div>;
  }

  if (!event) {
    return <div className="flex justify-center items-center min-h-screen">{t('event.notFound')}</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('billSplit.title', { eventName: event.name })}</h2>
        <button
          onClick={() => navigate(`/events/${id}/manage`)}
          className="btn bg-gray-600 hover:bg-gray-700"
        >
          {t('common.back')}
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-6 gap-2 font-semibold text-sm">
          <div>{t('billSplit.person')}</div>
          <div className="text-right">{t('billSplit.paid')}</div>
          <div className="text-right">{t('billSplit.owes')}</div>
          <div className="text-right">{t('billSplit.balance')}</div>
          <div className="text-center">{t('billSplit.include')}</div>
          <div className="text-center">{t('billSplit.actions')}</div>
        </div>

        {billSplit.map((split, index) => (
          <div key={index} className="grid grid-cols-6 gap-2 text-sm items-center">
            <div>{split.person}</div>
            <div className="text-right">${split.paid.toFixed(2)}</div>
            <div className="text-right">${split.owes.toFixed(2)}</div>
            <div className={`text-right ${split.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${split.balance.toFixed(2)}
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => togglePersonIncluded(index)}
                className={`px-3 py-1 rounded ${
                  split.isIncluded 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } text-white`}
              >
                {split.isIncluded ? t('billSplit.included') : t('billSplit.excluded')}
              </button>
            </div>
            <div className="flex justify-center">
              {split.balance < 0 && split.isIncluded && (
                <button
                  onClick={() => handleSendPaymentRequest(
                    split.person,
                    Math.abs(split.balance),
                    split.emailOrPhone
                  )}
                  disabled={isSendingEmail || !split.emailOrPhone}
                  className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  title={!split.emailOrPhone ? t('billSplit.error.noEmail') : t('billSplit.requestPayment')}
                >
                  {isSendingEmail ? t('billSplit.sending') : t('billSplit.requestPayment')}
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="border-t pt-2 mt-2">
          <div className="grid grid-cols-6 gap-2 font-semibold">
            <div>{t('billSplit.total')}</div>
            <div className="text-right">
              ${billSplit.reduce((sum, split) => sum + split.paid, 0).toFixed(2)}
            </div>
            <div className="text-right">
              ${billSplit.reduce((sum, split) => sum + (split.isIncluded ? split.owes : 0), 0).toFixed(2)}
            </div>
            <div className="text-right">
              ${billSplit.reduce((sum, split) => sum + (split.isIncluded ? split.balance : 0), 0).toFixed(2)}
            </div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillSplit; 