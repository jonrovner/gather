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
  emailOrPhone?: string;
}

interface IPayment {
  from: string;
  to: string;
  amount: number;
}

const BillSplit: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<IEvent | null>(null);
  const [billSplit, setBillSplit] = useState<IBillSplit[]>([]);
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!isAuthenticated || !user?.sub || !id) return;
      const token = await getAccessTokenSilently();
      try {
        const response = await axios.get(`${API_URL}/api/events/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        const eventData = response.data;
        
        if (eventData.creator !== user.sub) {
          setError(t('event.unauthorized'));
          return;
        }

        setEvent(eventData);
       
      } catch (err) {
        console.error('Error fetching event:', err);
        setError(t('event.loadFailed'));
      } finally {
        setIsLoading(false);
        
      }
    };

    fetchEvent();
  }, [isAuthenticated, user?.sub, id, t]);


  useEffect(() => {
    
    if (event && event?.needs?.length > 0) {
      calculateBillSplit(event);
    }
  }, [event]);  

  const calculatePayments = (billSplit: IBillSplit[]): IPayment[] => {
    const payments: IPayment[] = [];
    const debtors = billSplit.filter(person => person.balance < 0)
      .sort((a, b) => a.balance - b.balance); // Sort by smallest debt first
    const creditors = billSplit.filter(person => person.balance > 0)
      .sort((a, b) => b.balance - a.balance); // Sort by largest credit first

    for (const debtor of debtors) {
      let remainingDebt = Math.abs(debtor.balance);
      
      for (const creditor of creditors) {
        if (remainingDebt <= 0 || creditor.balance <= 0) continue;
        
        const paymentAmount = Math.min(remainingDebt, creditor.balance);
        if (paymentAmount > 0) {
          payments.push({
            from: debtor.person,
            to: creditor.person,
            amount: paymentAmount
          });
          
          remainingDebt -= paymentAmount;
          creditor.balance -= paymentAmount;
        }
      }
    }
    
    return payments;
  };

  const calculateBillSplit = (eventData: IEvent) => {
    const totalCost = eventData.needs.reduce((sum, need) => sum + (need.cost || 0), 0);
    
    // Create initial split array
    const split: IBillSplit[] = [];

    // Add host
    const hostPaid = eventData.needs
      .filter(need => need.claimedBy === user?.sub)
      .reduce((sum, need) => sum + (need.cost || 0), 0);
    
    split.push({
      person: user?.name || t('event.host'),
      paid: hostPaid,
      owes: 0,
      balance: 0,
      emailOrPhone: user?.email
    });

    // Add invitees
    eventData.invitees.forEach(invitee => {
      const inviteePaid = eventData.needs
        .filter(need => need.claimedBy === invitee.name)
        .reduce((sum, need) => sum + (need.cost || 0), 0);

      split.push({
        person: invitee.name,
        paid: inviteePaid,
        owes: 0,
        balance: 0,
        emailOrPhone: invitee.emailOrPhone
      });
    });

    // Calculate per person share
    const perPersonShare = split.length > 0 ? totalCost / split.length : 0;

    // Update owes and balance for each person
    split.forEach(person => {
      person.owes = perPersonShare;
      person.balance = person.paid - perPersonShare;
    });

    setBillSplit(split);
    setPayments(calculatePayments(split));
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

  const handleHostPayment = async (amount: number, to: string) => {
    if (!event || !user) {
      alert(t('billSplit.error.missingContact'));
      return;
    }
    
    setIsSendingEmail(true);
    try {
      await axios.post(`${API_URL}/api/events/${event._id}/host-payment`, {
        amount,
        recipient: to,
        eventName: event.name,
        hostName: user.name || 'Host',
        hostEmail: user.email
      });
      
      alert(t('billSplit.success.paymentSent'));
    } catch (error) {
      console.error('Error processing host payment:', error);
      alert(t('billSplit.error.paymentFailed'));
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
        <div className="grid grid-cols-4 gap-2 font-semibold text-sm">
          <div>{t('billSplit.person')}</div>
          <div className="text-right">{t('billSplit.paid')}</div>
          <div className="text-right">{t('billSplit.owes')}</div>
          <div className="text-right">{t('billSplit.balance')}</div>
        </div>

        {billSplit.map((split, index) => (
          <div key={index} className="grid grid-cols-4 gap-2 text-sm items-center">
            <div>{split.person}</div>
            <div className="text-right">${split.paid.toFixed(2)}</div>
            <div className="text-right">${split.owes.toFixed(2)}</div>
            <div className={`text-right ${split.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${split.balance.toFixed(2)}
            </div>
          </div>
        ))}

        <div className="border-t pt-2 mt-2">
          <div className="grid grid-cols-4 gap-2 font-semibold">
            <div>{t('billSplit.total')}</div>
            <div className="text-right">
              ${billSplit.reduce((sum, split) => sum + split.paid, 0).toFixed(2)}
            </div>
            <div className="text-right">
              ${billSplit.reduce((sum, split) => sum + split.owes, 0).toFixed(2)}
            </div>
            <div className="text-right">
              ${billSplit.reduce((sum, split) => sum + split.balance, 0).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            {t('billSplit.paymentInstructions', 'Payment Instructions')}
          </h3>
          {payments.length > 0 ? (
            <div className="space-y-2">
              {payments.map((payment, index) => (
                <div key={index} className="text-sm p-2 bg-white dark:bg-gray-600 rounded shadow-sm flex justify-between items-center">
                  <span>
                    {t('billSplit.paymentInstruction', {
                      defaultValue: `${payment.from} should pay ${payment.to} $${payment.amount.toFixed(2)}`,
                      from: payment.from,
                      to: payment.to,
                      amount: payment.amount.toFixed(2)
                    })}
                  </span>
                  {payment.from === (user?.name || t('event.host')) && (
                    <button
                      onClick={() => handleHostPayment(payment.amount, payment.to)}
                      disabled={isSendingEmail}
                      className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 ml-4"
                      title={t('billSplit.markAsPaid', 'Mark as Paid')}
                    >
                      {isSendingEmail ? t('billSplit.processing') : t('billSplit.markAsPaid')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {t('billSplit.noPaymentsNeeded', 'No payments needed - everyone is settled!')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillSplit; 