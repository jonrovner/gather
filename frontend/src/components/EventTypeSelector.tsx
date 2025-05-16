import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export type EventType = 'eatery' | 'trip' | 'bizmeet' | 'protest';

const EventTypeSelector: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleTypeSelect = (type: EventType) => {
    navigate(`/create-event/${type}`);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <h2 className="text-2xl text-center font-bold mb-6 text-gray-900 dark:text-white">{t('event.selectType')}</h2>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          className="p-6 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors"
          onClick={() => handleTypeSelect('eatery')}
        >
          <h3 className="text-lg font-semibold mb-2">{t('event.types.eatParty')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{t('event.types.eatPartyDescription')}</p>
        </button>
        <button
          type="button"
          className="p-6 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors"
          onClick={() => handleTypeSelect('trip')}
        >
          <h3 className="text-lg font-semibold mb-2">{t('event.types.trip')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{t('event.types.tripDescription')}</p>
        </button>
        <button
          type="button"
          className="p-6 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors"
          onClick={() => handleTypeSelect('bizmeet')}
        >
          <h3 className="text-lg font-semibold mb-2">{t('event.types.professionalMeetup')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{t('event.types.professionalMeetupDescription')}</p>
        </button>
        <button
          type="button"
          className="p-6 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-primary-50 dark:hover:bg-primary-900 transition-colors"
          onClick={() => handleTypeSelect('protest')}
        >
          <h3 className="text-lg font-semibold mb-2">{t('event.types.civicProtest')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{t('event.types.civicProtestDescription')}</p>
        </button>
      </div>
    </div>
  );
};

export default EventTypeSelector; 