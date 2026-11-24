import { io, Socket } from 'socket.io-client';
import { LiveStreamPayload, ScenarioType, QualityFlag } from '../types';
import { INITIAL_SENSORS, computeOverallHealth } from './mockData';

const SOCKET_URL = (import.meta as any).env?.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private listeners: Array<(data: LiveStreamPayload) => void> = [];
  private statusListeners: Array<(connected: boolean) => void> = [];
  private fallbackTimer: any = null;
  private step: number = 0;
  private activeScenario: ScenarioType = 'normal';

  connect() {
    // Only attempt native socket if on localhost or explicit websocket host
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocal) {
      try {
        this.socket = io(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
          timeout: 2000
        });

        this.socket.on('connect', () => {
          console.log('[Socket] Connected to backend WebSocket.');
          this.stopFallback();
          this.isConnected = true;
          this.statusListeners.forEach(cb => cb(true));
        });

        this.socket.on('disconnect', () => {
          console.log('[Socket] Disconnected from backend WebSocket. Engaging autonomous twin stream.');
          this.startFallback();
        });

        this.socket.on('connect_error', () => {
          this.startFallback();
        });

        this.socket.on('sensor_stream', (payload: LiveStreamPayload) => {
          this.listeners.forEach(cb => cb(payload));
        });
      } catch (err) {
        console.warn('[Socket] Could not initialize socket.io:', err);
        this.startFallback();
      }
    } else {
      // In cloud deployment (Vercel), immediately engage Autonomous Digital Twin stream
      this.startFallback();
    }
  }

  setScenario(scenario: ScenarioType) {
    this.activeScenario = scenario;
  }

  private startFallback() {
    if (this.fallbackTimer) return;
    this.isConnected = true;
    this.statusListeners.forEach(cb => cb(true));

    console.log('[SocketService] Autonomous Digital Twin engine online (Vercel Mode).');
    this.fallbackTimer = setInterval(() => {
      this.step++;
      const now = new Date();

      let mult = 1.0;
      let shift = 0.0;
      if (this.activeScenario === 'warning') {
        mult = 1.6;
        shift = 0.25;
      } else if (this.activeScenario === 'critical') {
        mult = 2.4;
        shift = 0.65;
      }

      // Generate dynamic sensor values
      const updatedSensors = INITIAL_SENSORS.map(s => {
        let val = 0.0;
        let flag: QualityFlag = 'GOOD';
        let alertLevel: 'warning' | 'critical' | null = null;

        if (s.sensor_code === 'VIB-DECK-01') {
          const osc = 0.005 * Math.sin(this.step * 0.45) + (Math.random() - 0.5) * 0.003;
          val = 0.022 * mult + (this.activeScenario === 'critical' ? 0.065 : this.activeScenario === 'warning' ? 0.025 : 0.0) + osc;
        } else if (s.sensor_code === 'VIB-PYL-01') {
          val = 420.0 * mult + (Math.random() - 0.5) * 25;
        } else if (s.sensor_code === 'STR-CBL-01') {
          val = 375.0 * (1.0 + shift * 0.42) + (Math.random() - 0.5) * 6;
        } else if (s.sensor_code === 'STR-CBL-02') {
          val = 1420.0 * (1.0 + shift * 0.38) + (Math.random() - 0.5) * 12;
        } else if (s.sensor_code === 'TLT-PIER-01') {
          val = 0.0075 * mult + (this.activeScenario === 'critical' ? 0.032 : this.activeScenario === 'warning' ? 0.015 : 0.0) + (Math.random() - 0.5) * 0.001;
        } else if (s.sensor_code === 'DSP-PIER-02') {
          val = 0.11 * mult + (Math.random() - 0.5) * 0.015;
        } else if (s.sensor_code === 'TMP-DECK-01') {
          val = 21.4 + (this.activeScenario === 'critical' ? 12 : this.activeScenario === 'warning' ? 6 : 0) + Math.sin(this.step * 0.05);
        } else if (s.sensor_code === 'TMP-AMB-01') {
          val = 17.5 + (this.activeScenario === 'critical' ? 8 : this.activeScenario === 'warning' ? 4 : 0);
        } else if (s.sensor_code === 'HUM-ENV-01') {
          val = Math.min(98.5, 62.5 + (this.activeScenario === 'critical' ? 26 : this.activeScenario === 'warning' ? 14 : 0) + (Math.random() - 0.5) * 2);
        }

        val = Math.round(val * 10000) / 10000;

        // Evaluate thresholds
        if (val >= s.thresholds.critical_max || val <= s.thresholds.critical_min) {
          flag = 'CRITICAL';
          alertLevel = 'critical';
        } else if (val >= s.thresholds.warning_max || val <= s.thresholds.warning_min) {
          flag = 'WARNING';
          alertLevel = 'warning';
        }

        return {
          id: s.id,
          sensor_code: s.sensor_code,
          name: s.name,
          type: s.type,
          unit: s.unit,
          value: val,
          quality_flag: flag,
          alert_level: alertLevel,
          is_simulated: s.is_simulated,
          coordinates: s.coordinates,
          timestamp: now.toISOString()
        };
      });

      // Calculate health score with current snapshot
      const sensorObjArray = INITIAL_SENSORS.map((s, idx) => ({
        ...s,
        current_value: updatedSensors[idx].value,
        current_quality: updatedSensors[idx].quality_flag
      }));

      const health = computeOverallHealth(sensorObjArray);

      const payload: LiveStreamPayload = {
        timestamp: now.toISOString(),
        scenario: this.activeScenario,
        health,
        sensors: updatedSensors,
        step: this.step
      };

      this.listeners.forEach(cb => cb(payload));
    }, 2000);
  }

  private stopFallback() {
    if (this.fallbackTimer) {
      clearInterval(this.fallbackTimer);
      this.fallbackTimer = null;
    }
  }

  disconnect() {
    this.stopFallback();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }

  subscribe(callback: (data: LiveStreamPayload) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  onConnectionStatus(callback: (connected: boolean) => void) {
    this.statusListeners.push(callback);
    callback(this.isConnected);
    return () => {
      this.statusListeners = this.statusListeners.filter(cb => cb !== callback);
    };
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const socketService = new SocketService();
