import React from 'react';
import { useNavigate } from '../vendor/react-router-dom';
import { Mode, ShoppingList } from '../types';
import { DocumentDuplicateIcon, PlusIcon, CheckCircleIcon } from '../components/Icons';
import { themeTokens } from '../styles/tokens';

interface DashboardScreenProps {
  mode: Mode;
  lists: ShoppingList[];
  quotesCount: number;
  posCount: number;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ mode, lists, quotesCount, posCount }) => {
  const navigate = useNavigate();
  const isPricePulse = mode === Mode.PricePulse;
  const modeToken = themeTokens.modeStyles[isPricePulse ? 'pricepulse' : 'budgetpulse'];

  const goTo = (path: string) => navigate(path);

  const cards = [
    {
      title: 'Start from Template',
      subtitle: 'Browse pre-made lists',
      icon: <DocumentDuplicateIcon />,
      action: () => goTo('templates'),
      show: true,
    },
    {
      title: 'Create New List',
      subtitle: 'Start with a blank slate',
      icon: <PlusIcon />,
      action: () => goTo('lists'),
      show: true,
    },
    {
      title: 'My Shopping Lists',
      subtitle: `${lists.length} active list(s)`,
      icon: <CheckCircleIcon />,
      action: () => goTo('lists'),
      show: lists.length > 0,
    },
    {
      title: 'Manage Quotes',
      subtitle: `${quotesCount} requests`,
      icon: <DocumentDuplicateIcon />,
      action: () => goTo('quotes'),
      show: !isPricePulse,
    },
    {
      title: 'Track Purchase Orders',
      subtitle: `${posCount} active POs`,
      icon: <CheckCircleIcon />,
      action: () => goTo('purchase-orders'),
      show: !isPricePulse,
    },
  ].filter((card) => card.show);

  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-800 mb-6">
        Welcome to {isPricePulse ? 'PricePulse' : 'BudgetPulse'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <button
            key={card.title}
            onClick={card.action}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex items-center space-x-4 w-full text-left border-t-4"
            style={{ borderColor: modeToken.accentBg }}
          >
            <div className="p-3 rounded-full" style={{ backgroundColor: modeToken.accentSurface }}>
              <div className={isPricePulse ? 'text-pricepulse' : 'text-budgetpulse'}>{card.icon}</div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{card.title}</h3>
              <p className="text-slate-500">{card.subtitle}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardScreen;
