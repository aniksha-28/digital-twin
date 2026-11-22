import { io, Socket } from 'socket.io-client';
import { LiveStreamPayload } from '../types';

const SOCKET_URL = 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private listeners: Array<(data: LiveStreamPayload) => void> = [];
  private statusListeners: Array<(connected: boolean) => void> = [];

  connect() {
    if (this.socket) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected to telemetry WebSocket.');
      this.isConnected = true;
      this.statusListeners.forEach(cb => cb(true));
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from telemetry WebSocket.');
      this.isConnected = false;
      this.statusListeners.forEach(cb => cb(false));
    });

    this.socket.on('sensor_stream', (payload: LiveStreamPayload) => {
      this.listeners.forEach(cb => cb(payload));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
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
