import Topnav from './Topnav';
import '../styles/DashboardLayout.css';

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      <Topnav />
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}
