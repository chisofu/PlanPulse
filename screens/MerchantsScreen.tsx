import React from 'react';
import { MOCK_MERCHANTS } from '../constants';

const MerchantsScreen: React.FC = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-800 mb-6">Merchants Directory</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_MERCHANTS.map((merchant) => (
          <div key={merchant.id} className="bg-white rounded-lg shadow-md p-6 flex items-center space-x-4">
            <img src={merchant.logoUrl} alt={merchant.name} className="w-12 h-12 rounded-full" />
            <div>
              <p className="font-semibold text-slate-800">{merchant.name}</p>
              <p className="text-sm text-slate-500">Preferred supplier</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MerchantsScreen;
