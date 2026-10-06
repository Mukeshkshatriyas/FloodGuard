import DisasterDashboard from '../components/DisasterDashboard';
import { disasterConfigs } from '../utils/disasterConfigs';

export default function CycloneDashboard() {
  return <DisasterDashboard config={disasterConfigs.cyclone} />;
}