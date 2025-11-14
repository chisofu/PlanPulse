import React, { useEffect, useMemo } from 'react';
import {
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from './vendor/react-router-dom';
import AppShell from './components/layout/AppShell';
import { Mode, Template, ShoppingList } from './types';
import DashboardScreen from './screens/DashboardScreen';
import TemplatesScreen from './screens/TemplatesScreen';
import ListBuilderScreen from './screens/ListBuilderScreen';
import QuotesScreen from './screens/QuotesScreen';
import PurchaseOrdersScreen, { POCreationScreen } from './screens/PurchaseOrdersScreen';
import MerchantsScreen from './screens/MerchantsScreen';
import AdminScreen from './screens/AdminScreen';
import {
  usePlanPulseStore,
  selectMode,
  selectLists,
  selectQuotes,
  selectPurchaseOrders,
} from './store/planPulseStore';
import { routeConfigs } from './routes/config';
import { NavigationItem } from './components/layout/NavigationRail';
import { v4 as uuidv4 } from 'uuid';
import {
  CheckCircleIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon,
  PaperAirplaneIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from './components/Icons';
import { getModeTheme } from './components/layout/ModeTheme';

const createListFromTemplateVariant = (template: Template, variant: TemplateVariant): ShoppingList => ({
  id: uuidv4(),
  name: `${template.name} — ${variant.name}`,
  createdAt: new Date().toISOString(),
  items: variant.items.map((item) => ({
    id: uuidv4(),
    description: item.description,
    category: item.category,
    unit: item.unit,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    priceSource: item.priceSource,
    flags: [],
  })),
});

const SurfaceLayout: React.FC<{ surface: Mode }> = ({ surface }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const storeMode = usePlanPulseStore(selectMode);
  const setMode = usePlanPulseStore((state) => state.setMode);

  useEffect(() => {
    if (storeMode !== surface) {
      setMode(surface);
    }
  }, [storeMode, surface, setMode]);

  const config = useMemo(() => routeConfigs.find((entry) => entry.surface === surface)!, [surface]);

  const navigationItems: NavigationItem[] = useMemo(
    () =>
      config.routes
        .filter((route) => route.modeVisibility.includes(surface))
        .map((route) => ({
          to: `${config.basePath}/${route.path}`,
          label: route.label,
        })),
    [config, surface],
  );

  const activeRoute = useMemo(() => {
    const matched = config.routes.find((route) =>
      location.pathname.startsWith(`${config.basePath}/${route.path}`),
    );
    return matched?.label ?? 'Dashboard';
  }, [config, location.pathname]);

  const handleModeChange = (mode: Mode) => {
    if (mode === surface) return;
    setMode(mode);
    const targetConfig = routeConfigs.find((entry) => entry.surface === mode);
    if (targetConfig) {
      navigate(`${targetConfig.basePath}/dashboard`, { replace: true });
    }
  };

  return (
    <AppShell
      mode={surface}
      onModeChange={handleModeChange}
      navigation={navigationItems}
      title="PlanPulse"
      subtitle={`${surface === Mode.PricePulse ? 'PricePulse' : 'BudgetPulse'} • ${activeRoute}`}
    >
      <Outlet />
    </AppShell>
  );
};

const DashboardRoute: React.FC<{ mode: Mode }> = ({ mode }) => {
  const lists = usePlanPulseStore(selectLists);
  const quotes = usePlanPulseStore(selectQuotes);
  const pos = usePlanPulseStore(selectPurchaseOrders);
  return <DashboardScreen mode={mode} lists={lists} quotesCount={quotes.length} posCount={pos.length} />;
};

const TemplatesRoute: React.FC<{ mode: Mode }> = ({ mode }) => {
  const navigate = useNavigate();
  const upsertList = usePlanPulseStore((state) => state.upsertList);
  const setActiveList = usePlanPulseStore((state) => state.setActiveList);

  const handleSelectTemplate = (template: Template) => {
    const newList: ShoppingList = {
      id: uuidv4(),
      name: template.name,
      createdAt: new Date().toISOString(),
      items: template.variants.items.map((item) => ({
        ...item,
        id: uuidv4(),
        flags: [],
      })),
    };
    upsertList(newList);
    setActiveList(newList.id);
    navigate('../lists');
  };

  return <TemplatesScreen mode={mode} onTemplateSelected={handleSelectTemplate} />;
};

const QuotesRoute: React.FC = () => {
  const navigate = useNavigate();
  return (
    <QuotesScreen
      onCreatePurchaseOrder={(quote) => {
        navigate(`../purchase-orders/new/${quote.id}`);
      }}
    />
  );
};

const PurchaseOrdersRoute: React.FC = () => <PurchaseOrdersScreen />;

const POCreationRoute: React.FC = () => <POCreationScreen />;

const MerchantsRoute: React.FC = () => <MerchantsScreen />;

const AdminRoute: React.FC = () => <AdminScreen />;

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/pricepulse/dashboard" replace />} />
      <Route path="/pricepulse" element={<SurfaceLayout surface={Mode.PricePulse} />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardRoute mode={Mode.PricePulse} />} />
        <Route path="templates" element={<TemplatesRoute mode={Mode.PricePulse} />} />
        <Route path="lists" element={<ListBuilderScreen mode={Mode.PricePulse} />} />
        <Route path="quotes" element={<QuotesRoute />} />
        <Route path="purchase-orders" element={<PurchaseOrdersRoute />} />
        <Route path="purchase-orders/new/:quoteId" element={<POCreationRoute />} />
        <Route path="merchants" element={<MerchantsRoute />} />
        <Route path="admin" element={<AdminRoute />} />
      </Route>
      <Route path="/budgetpulse" element={<SurfaceLayout surface={Mode.BudgetPulse} />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardRoute mode={Mode.BudgetPulse} />} />
        <Route path="templates" element={<TemplatesRoute mode={Mode.BudgetPulse} />} />
        <Route path="lists" element={<ListBuilderScreen mode={Mode.BudgetPulse} />} />
        <Route path="quotes" element={<QuotesRoute />} />
        <Route path="purchase-orders" element={<PurchaseOrdersRoute />} />
        <Route path="purchase-orders/new/:quoteId" element={<POCreationRoute />} />
        <Route path="merchants" element={<MerchantsRoute />} />
        <Route path="admin" element={<AdminRoute />} />
      </Route>
      <Route path="*" element={<Navigate to="/pricepulse/dashboard" replace />} />
    </Routes>
  );
};

export default App;
