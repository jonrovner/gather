import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EventType } from './EventTypeSelector';

interface INeed {
  _id: string;
  item: string;
  claimedBy?: string;
  cost?: number;
  status: 'open' | 'claimed';
}

interface IDestination {
  _id: string;
  name: string;
  arrivalDate: string;
  departureDate: string;
  accommodation: string;
}

interface EventFormProps {
  type: EventType;
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

const NeedsInput: React.FC<{ needs: INeed[], onNeedsChange: (needs: INeed[]) => void }> = ({ needs, onNeedsChange }) => {
  const { t } = useTranslation();
  const [newNeed, setNewNeed] = useState('');
  const [newNeedCost, setNewNeedCost] = useState('');

  const handleAddNeed = () => {
    if (newNeed.trim() !== '') {
      onNeedsChange([...needs, {
        _id: crypto.randomUUID(),
        item: newNeed,
        cost: newNeedCost ? parseFloat(newNeedCost) : undefined,
        status: 'open'
      }]);
      setNewNeed('');
      setNewNeedCost('');
    }
  };

  return (
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
  );
};

const EateryForm: React.FC<EventFormProps> = ({ formData, onFormChange }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <input
        className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        type="number"
        placeholder={t('event.guestCount')}
        value={formData.guestCount || ''}
        onChange={(e) => onFormChange('guestCount', e.target.value)}
      />
      <NeedsInput 
        needs={formData.needs || []} 
        onNeedsChange={(needs) => onFormChange('needs', needs)} 
      />
    </div>
  );
};

const TripForm: React.FC<EventFormProps> = ({ formData, onFormChange }) => {
  const { t } = useTranslation();
  const [newDestination, setNewDestination] = useState<Omit<IDestination, '_id'>>({
    name: '',
    arrivalDate: '',
    departureDate: '',
    accommodation: ''
  });

  const handleAddDestination = () => {
    if (newDestination.name.trim() !== '') {
      const destinations = [...(formData.destinations || []), {
        ...newDestination,
        _id: crypto.randomUUID()
      }];
      onFormChange('destinations', destinations);
      setNewDestination({
        name: '',
        arrivalDate: '',
        departureDate: '',
        accommodation: ''
      });
    }
  };

  const handleRemoveDestination = (id: string) => {
    const destinations = (formData.destinations || []).filter((dest: IDestination) => dest._id !== id);
    onFormChange('destinations', destinations);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-gray-700 dark:text-gray-300">{t('event.destinations')}</label>
        <div className="grid grid-cols-1 gap-2">
          <input
            className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder={t('event.destinationName')}
            value={newDestination.name}
            onChange={(e) => setNewDestination({ ...newDestination, name: e.target.value })}
          />
          <input
            className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            type="datetime-local"
            placeholder={t('event.arrivalDate')}
            value={newDestination.arrivalDate}
            onChange={(e) => setNewDestination({ ...newDestination, arrivalDate: e.target.value })}
          />
          <input
            className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            type="datetime-local"
            placeholder={t('event.departureDate')}
            value={newDestination.departureDate}
            onChange={(e) => setNewDestination({ ...newDestination, departureDate: e.target.value })}
          />
          <input
            className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder={t('event.accommodation')}
            value={newDestination.accommodation}
            onChange={(e) => setNewDestination({ ...newDestination, accommodation: e.target.value })}
          />
          <button
            type="button"
            className="btn bg-primary-600 hover:bg-primary-700"
            onClick={handleAddDestination}
          >
            {t('common.add')}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">{t('event.destinationsList')}</h3>
        <div className="space-y-2">
          {(formData.destinations || []).map((destination: IDestination) => (
            <div key={destination._id} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{destination.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('event.arrival')}: {new Date(destination.arrivalDate).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('event.departure')}: {new Date(destination.departureDate).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('event.accommodation')}: {destination.accommodation}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleRemoveDestination(destination._id)}
                >
                  {t('common.remove')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <NeedsInput 
        needs={formData.needs || []} 
        onNeedsChange={(needs) => onFormChange('needs', needs)} 
      />
    </div>
  );
};

const BizmeetForm: React.FC<EventFormProps> = ({ formData, onFormChange }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <input
        className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        placeholder={t('event.dresscode')}
        value={formData.dresscode || ''}
        onChange={(e) => onFormChange('dresscode', e.target.value)}
      />
      <input
        className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        placeholder={t('event.agenda')}
        value={formData.agenda || ''}
        onChange={(e) => onFormChange('agenda', e.target.value)}
      />
    </div>
  );
};

const ProtestForm: React.FC<EventFormProps> = ({ formData, onFormChange }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <textarea
        className="input dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        placeholder={t('event.manifesto')}
        value={formData.manifesto || ''}
        onChange={(e) => onFormChange('manifesto', e.target.value)}
      />
      <NeedsInput 
        needs={formData.needs || []} 
        onNeedsChange={(needs) => onFormChange('needs', needs)} 
      />
    </div>
  );
};

const EventForms: React.FC<EventFormProps> = ({ type, formData, onFormChange }) => {
  switch (type) {
    case 'eatery':
      return <EateryForm type={type} formData={formData} onFormChange={onFormChange} />;
    case 'trip':
      return <TripForm type={type} formData={formData} onFormChange={onFormChange} />;
    case 'bizmeet':
      return <BizmeetForm type={type} formData={formData} onFormChange={onFormChange} />;
    case 'protest':
      return <ProtestForm type={type} formData={formData} onFormChange={onFormChange} />;
    default:
      return null;
  }
};

export default EventForms; 