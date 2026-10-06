import DisasterDashboard from '../components/DisasterDashboard';
import { disasterConfigs } from '../utils/disasterConfigs';

export default function EarthquakeDashboard() {
  return <DisasterDashboard config={disasterConfigs.earthquake} />;
}