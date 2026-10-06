import DisasterDashboard from '../components/DisasterDashboard';
import { disasterConfigs } from '../utils/disasterConfigs';

export default function DroughtDashboard() {
  return <DisasterDashboard config={disasterConfigs.drought} />;
}