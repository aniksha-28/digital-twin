import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';

import { Dashboard } from './pages/Dashboard';
import { DigitalTwinPage } from './pages/DigitalTwinPage';
import { SensorsPage } from './pages/SensorsPage';
import { HistoricalAnalyticsPage } from './pages/HistoricalAnalyticsPage';
import { AlertsPage } from './pages/AlertsPage';
import { ThresholdConfigPage } from './pages/ThresholdConfigPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';

import { api } from './services/api';
import { socketService } from './services/socket';
import { Sensor, HealthResult, Alert, User, ScenarioType, LiveStreamPayload } from './types';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [scenario, setScenario] = useState<ScenarioType>('normal');

  const [activeChartSensor, setActiveChartSensor] = useState<Sensor | null>(null);
  const [liveChartData, setLiveChartData] = useState<Array<{ time: string; value: number }>>([]);
  const [preselectedSensorForThresholds, setPreselectedSensorForThresholds] = useState<number | null>(null);

  // 1. Check Authentication on Mount
  useEffect(() => {
    const token = localStorage.getItem('mobiletwin_token');
    if (token) {
      api.getCurrentUser()
        .then((res) => {
          setCurrentUser(res.user);
        })
        .catch(() => {
          // If token expired or server reset, set default demo admin
          setCurrentUser({
            id: 1,
            username: 'admin',
            email: 'admin@infrastructure.gov',
            full_name: 'Dr. Elena Rossi (Chief Bridge Engineer)',
            role: 'admin',
            created_at: new Date().toISOString()
          });
        });
    } else {
      // Default to demo admin session for seamless immediate presentation
      setCurrentUser({
        id: 1,
        username: 'admin',
        email: 'admin@infrastructure.gov',
        full_name: 'Dr. Elena Rossi (Chief Bridge Engineer)',
        role: 'admin',
        created_at: new Date().toISOString()
      });
      localStorage.setItem('mobiletwin_token', 'mt-token-1-admin');
    }
  }, []);

  // 2. Load Initial Data
  const loadInitialData = async () => {
    try {
      const [sensorsRes, healthRes, alertsRes, simRes] = await Promise.all([
        api.getSensors(),
        api.getHealthScore(),
        api.getAlerts({ status: 'active' }),
        api.getSimulatorStatus().catch(() => ({ scenario: 'normal' }))
      ]);

      setSensors(sensorsRes.sensors || []);
      setHealth(healthRes.health || null);
      setActiveAlerts(alertsRes.alerts || []);
      setScenario((simRes.scenario as ScenarioType) || 'normal');

      if (sensorsRes.sensors && sensorsRes.sensors.length > 0 && !activeChartSensor) {
        setActiveChartSensor(sensorsRes.sensors[0]);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // 3. Connect to WebSocket Live Stream
  useEffect(() => {
    socketService.connect();
    const unsubStatus = socketService.onConnectionStatus((status) => {
      setIsConnected(status);
    });

    const unsubStream = socketService.subscribe((payload: LiveStreamPayload) => {
      // Update health score
      if (payload.health) {
        setHealth(payload.health);
      }
      if (payload.scenario) {
        setScenario(payload.scenario);
      }

      // Update sensor live values
      if (payload.sensors) {
        setSensors((prevSensors) =>
          prevSensors.map((sensor) => {
            const update = payload.sensors.find((s) => s.sensor_code === sensor.sensor_code);
            if (update) {
              return {
                ...sensor,
                current_value: update.value,
                current_quality: update.quality_flag,
                last_reading_time: update.timestamp
              };
            }
            return sensor;
          })
        );

        // Update live chart buffer for the currently active sensor
        if (activeChartSensor) {
          const matching = payload.sensors.find((s) => s.sensor_code === activeChartSensor.sensor_code);
          if (matching) {
            const timeStr = new Date(payload.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });
            setLiveChartData((prev) => {
              const updated = [...prev, { time: timeStr, value: matching.value }];
              return updated.length > 35 ? updated.slice(updated.length - 35) : updated;
            });
          }
        }
      }
    });

    // Refresh active alerts periodically
    const alertInterval = setInterval(() => {
      api.getAlerts({ status: 'active' })
        .then((res) => setActiveAlerts(res.alerts || []))
        .catch(() => {});
    }, 6000);

    return () => {
      unsubStatus();
      unsubStream();
      clearInterval(alertInterval);
      socketService.disconnect();
    };
  }, [activeChartSensor]);

  // Handle Scenario Change
  const handleScenarioChange = async (newScenario: ScenarioType) => {
    try {
      await api.setScenario(newScenario);
      setScenario(newScenario);
      // Refresh alerts after scenario injection
      setTimeout(() => {
        api.getAlerts({ status: 'active' }).then((res) => setActiveAlerts(res.alerts || []));
      }, 1000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mobiletwin_token');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user, token) => {
          setCurrentUser(user);
          loadInitialData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased text-slate-800">
      {/* Top Fixed Navbar */}
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        isConnected={isConnected}
        activeScenario={scenario}
        onScenarioChange={handleScenarioChange}
        activeAlerts={activeAlerts}
        onNavigateToAlerts={() => setCurrentTab('alerts')}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          activeAlertCount={activeAlerts.length}
          healthScore={health?.overall_score || 95.0}
          healthStatus={health?.status || 'healthy'}
          userRole={currentUser?.role}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {currentTab === 'dashboard' && (
            <Dashboard
              sensors={sensors}
              health={health}
              activeAlerts={activeAlerts}
              liveChartData={liveChartData}
              activeChartSensor={activeChartSensor}
              onSelectChartSensor={(s) => {
                setActiveChartSensor(s);
                setLiveChartData([]); // Reset chart buffer for clean new series
              }}
              onNavigateTab={setCurrentTab}
              scenario={scenario}
              onScenarioChange={handleScenarioChange}
            />
          )}

          {currentTab === 'digital-twin' && (
            <DigitalTwinPage
              sensors={sensors}
              onNavigateTab={setCurrentTab}
              onSelectSensorForThresholds={(id) => {
                setPreselectedSensorForThresholds(id);
                setCurrentTab('thresholds');
              }}
            />
          )}

          {currentTab === 'sensors' && (
            <SensorsPage
              sensors={sensors}
              onNavigateTab={setCurrentTab}
              onSelectSensorForThresholds={(id) => {
                setPreselectedSensorForThresholds(id);
                setCurrentTab('thresholds');
              }}
            />
          )}

          {currentTab === 'historical' && (
            <HistoricalAnalyticsPage sensors={sensors} />
          )}

          {currentTab === 'alerts' && (
            <AlertsPage currentUser={currentUser} />
          )}

          {currentTab === 'thresholds' && (
            <ThresholdConfigPage
              sensors={sensors}
              onRefreshSensors={loadInitialData}
              userRole={currentUser?.role}
              preselectedSensorId={preselectedSensorForThresholds}
            />
          )}

          {currentTab === 'profile' && (
            <ProfilePage currentUser={currentUser} />
          )}
        </main>
      </div>

      {/* Bottom Mobile Navigation */}
      <MobileNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        activeAlertCount={activeAlerts.length}
      />
    </div>
  );
};

export default App;
