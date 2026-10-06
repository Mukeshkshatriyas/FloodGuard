import DisasterDashboard from '../components/DisasterDashboard';
import { disasterConfigs } from '../utils/disasterConfigs';

export default function LandslideDashboard() {
  return <DisasterDashboard config={disasterConfigs.landslide} />;
}