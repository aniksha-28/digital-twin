import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Maximize2, Minimize2, Eye, Layers, Compass, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { QualityFlag, SensorType } from '../../types';

interface SensorMarkerData {
  sensor_code: string;
  name: string;
  type: SensorType;
  unit: string;
  value: number | null;
  quality_flag: QualityFlag;
  is_simulated: boolean;
  position: [number, number, number];
}

interface BridgeTwinProps {
  markers?: SensorMarkerData[];
  selectedSensorCode?: string | null;
  onSelectSensor?: (sensorCode: string) => void;
  height?: string;
  allowFullscreen?: boolean;
}

export const BridgeTwin: React.FC<BridgeTwinProps> = ({
  markers = [],
  selectedSensorCode = null,
  onSelectSensor,
  height = '500px',
  allowFullscreen = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [stressHeatmap, setStressHeatmap] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState<SensorMarkerData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // References to keep across re-renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const markerMeshesRef = useRef<Map<string, { pin: THREE.Mesh; halo: THREE.Mesh }>>(new Map());
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const cableMeshesRef = useRef<THREE.Mesh[]>([]);
  const deckMeshRef = useRef<THREE.Mesh | null>(null);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const heightPx = containerRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Deep Navy Slate
    scene.fog = new THREE.FogExp2(0x0f172a, 0.015);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 1000);
    camera.position.set(0, 14, 28);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't go completely below water
    controls.minDistance = 5;
    controls.maxDistance = 75;
    controls.target.set(0, 3, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5ea, 1.6);
    dirLight.position.set(20, 35, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -25;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.top = 25;
    dirLight.shadow.camera.bottom = -25;
    scene.add(dirLight);

    const blueFillLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    blueFillLight.position.set(-20, 15, -15);
    scene.add(blueFillLight);

    // 6. Build Bridge Geometries
    buildBridgeStructure(scene);

    // 7. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle water ripple
      if (waterMeshRef.current) {
        waterMeshRef.current.position.y = -2.5 + Math.sin(elapsedTime * 1.2) * 0.06;
      }

      // Marker pulse animation
      markerMeshesRef.current.forEach(({ halo }, code) => {
        const scale = 1.0 + Math.sin(elapsedTime * 3.5 + code.charCodeAt(0)) * 0.35;
        halo.scale.set(scale, scale, scale);
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, []);

  // Construct 3D Bridge Components
  const buildBridgeStructure = (scene: THREE.Scene) => {
    // A. Roadway Deck
    const deckLength = 36.0;
    const deckWidth = 3.2;
    const deckThickness = 0.45;

    const deckGeo = new THREE.BoxGeometry(deckLength, deckThickness, deckWidth);
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Slate asphalt
      roughness: 0.7,
      metalness: 0.2
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(0, 1.0, 0);
    deck.castShadow = true;
    deck.receiveShadow = true;
    scene.add(deck);
    deckMeshRef.current = deck;

    // Road Markings (Dashed central line)
    for (let x = -deckLength / 2 + 1; x < deckLength / 2; x += 1.8) {
      const lineGeo = new THREE.PlaneGeometry(1.0, 0.08);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 1.23, 0);
      scene.add(line);
    }

    // Safety Guardrails
    const railGeo = new THREE.BoxGeometry(deckLength, 0.3, 0.08);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(0, 1.4, deckWidth / 2 - 0.05);
    scene.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, railMat);
    rightRail.position.set(0, 1.4, -deckWidth / 2 + 0.05);
    scene.add(rightRail);

    // Cross-girders beneath deck
    for (let x = -deckLength / 2 + 2; x <= deckLength / 2 - 2; x += 3.0) {
      const beamGeo = new THREE.BoxGeometry(0.35, 0.4, deckWidth + 0.2);
      const beamMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(x, 0.6, 0);
      scene.add(beam);
    }

    // B. Twin Pylons / Towers (X = -7 and X = +7)
    const pylonXs = [-7.0, 7.0];
    const pylonHeight = 10.5;

    pylonXs.forEach((pX, pIdx) => {
      const pylonGroup = new THREE.Group();

      // Two slanted tower legs
      const legGeo = new THREE.BoxGeometry(0.55, pylonHeight, 0.55);
      const legMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.3 });

      // Left leg
      const legLeft = new THREE.Mesh(legGeo, legMat);
      legLeft.position.set(0, pylonHeight / 2, deckWidth / 2 + 0.2);
      legLeft.rotation.x = -0.05;
      legLeft.castShadow = true;
      pylonGroup.add(legLeft);

      // Right leg
      const legRight = new THREE.Mesh(legGeo, legMat);
      legRight.position.set(0, pylonHeight / 2, -deckWidth / 2 - 0.2);
      legRight.rotation.x = 0.05;
      legRight.castShadow = true;
      pylonGroup.add(legRight);

      // Lower cross-strut (under deck)
      const lowerStrut = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, deckWidth + 0.8), legMat);
      lowerStrut.position.set(0, 0.7, 0);
      pylonGroup.add(lowerStrut);

      // Upper cross-strut (near tower head)
      const upperStrut = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, deckWidth * 0.6), legMat);
      upperStrut.position.set(0, pylonHeight * 0.85, 0);
      pylonGroup.add(upperStrut);

      pylonGroup.position.set(pX, 0.0, 0);
      scene.add(pylonGroup);

      // C. Foundation Piers extending into river
      const pierGeo = new THREE.CylinderGeometry(0.85, 0.95, 3.8, 16);
      const pierMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
      const pier = new THREE.Mesh(pierGeo, pierMat);
      pier.position.set(pX, -1.2, 0);
      pier.castShadow = true;
      pier.receiveShadow = true;
      scene.add(pier);
    });

    // D. Stay Cables (Harp/Fan Array connecting Pylons to Deck)
    cableMeshesRef.current = [];
    pylonXs.forEach((pX) => {
      // 6 cable pairs per tower (total 24 cables)
      const cableAnchorsZ = [deckWidth / 2, -deckWidth / 2];

      for (let i = 1; i <= 6; i++) {
        const deckOffsetX = i * 2.3;
        const towerAnchorY = 5.2 + i * 0.8;

        // Front span cable & Back span cable
        const deckPositions = [
          pX + deckOffsetX, // toward center or right
          pX - deckOffsetX  // toward ends
        ];

        deckPositions.forEach((deckX) => {
          if (Math.abs(deckX) > deckLength / 2) return;

          cableAnchorsZ.forEach((zSide) => {
            const start = new THREE.Vector3(pX, towerAnchorY, zSide * 0.4);
            const end = new THREE.Vector3(deckX, 1.2, zSide);

            const distance = start.distanceTo(end);
            const cableGeo = new THREE.CylinderGeometry(0.025, 0.025, distance, 8);
            const cableMat = new THREE.MeshStandardMaterial({
              color: 0x93c5fd, // Light steel cyan
              metalness: 0.8,
              roughness: 0.2
            });

            const cableMesh = new THREE.Mesh(cableGeo, cableMat);
            // Position midpoint and orient
            cableMesh.position.copy(start.clone().add(end).multiplyScalar(0.5));
            cableMesh.quaternion.setFromUnitVectors(
              new THREE.Vector3(0, 1, 0),
              end.clone().sub(start).normalize()
            );

            scene.add(cableMesh);
            cableMeshesRef.current.push(cableMesh);
          });
        });
      }
    });

    // E. River Water Surface
    const waterGeo = new THREE.PlaneGeometry(80, 50, 32, 32);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // River Blue
      roughness: 0.15,
      metalness: 0.7,
      transparent: true,
      opacity: 0.82
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -2.5, 0);
    water.receiveShadow = true;
    scene.add(water);
    waterMeshRef.current = water;

    // F. River Embankments / Abutments
    const abutGeo = new THREE.BoxGeometry(10, 4.0, 12);
    const abutMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });

    const westAbut = new THREE.Mesh(abutGeo, abutMat);
    westAbut.position.set(-22, -0.6, 0);
    westAbut.receiveShadow = true;
    scene.add(westAbut);

    const eastAbut = new THREE.Mesh(abutGeo, abutMat);
    eastAbut.position.set(22, -0.6, 0);
    eastAbut.receiveShadow = true;
    scene.add(eastAbut);
  };

  // Update / Synchronize 3D Sensor Markers based on live backend data
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    markers.forEach((marker) => {
      const existing = markerMeshesRef.current.get(marker.sensor_code);

      // Determine color
      let colorHex = 0x10b981; // Green
      if (marker.quality_flag === 'CRITICAL') colorHex = 0xef4444; // Red
      else if (marker.quality_flag === 'WARNING') colorHex = 0xf59e0b; // Amber

      if (marker.sensor_code === selectedSensorCode) {
        colorHex = 0x38bdf8; // Sky Blue highlight
      }

      if (!existing) {
        // Create 3D Pin & Pulsing Halo
        const pinGeo = new THREE.SphereGeometry(0.32, 16, 16);
        const pinMat = new THREE.MeshStandardMaterial({
          color: colorHex,
          emissive: colorHex,
          emissiveIntensity: 0.5,
          roughness: 0.2
        });
        const pin = new THREE.Mesh(pinGeo, pinMat);
        pin.position.set(...marker.position);
        pin.userData = { sensor_code: marker.sensor_code, markerData: marker };

        // Outer pulsing ring/halo
        const haloGeo = new THREE.RingGeometry(0.38, 0.58, 24);
        const haloMat = new THREE.MeshBasicMaterial({
          color: colorHex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.position.set(...marker.position);
        halo.rotation.x = -Math.PI / 2;

        scene.add(pin);
        scene.add(halo);

        markerMeshesRef.current.set(marker.sensor_code, { pin, halo });
      } else {
        // Update color and intensity
        (existing.pin.material as THREE.MeshStandardMaterial).color.setHex(colorHex);
        (existing.pin.material as THREE.MeshStandardMaterial).emissive.setHex(colorHex);
        (existing.halo.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
        existing.pin.userData.markerData = marker;
      }
    });
  }, [markers, selectedSensorCode]);

  // Wireframe Mode Effect
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => (m.wireframe = wireframeMode));
        } else {
          obj.material.wireframe = wireframeMode;
        }
      }
    });
  }, [wireframeMode]);

  // Stress Heatmap Mode Effect
  useEffect(() => {
    if (!deckMeshRef.current) return;
    const mat = deckMeshRef.current.material as THREE.MeshStandardMaterial;
    if (stressHeatmap) {
      mat.color.setHex(0xd97706); // Amber stress
      mat.roughness = 0.3;
      cableMeshesRef.current.forEach((c) => {
        (c.material as THREE.MeshStandardMaterial).color.setHex(0xf87171); // Reddish strain
      });
    } else {
      mat.color.setHex(0x334155); // Standard slate
      cableMeshesRef.current.forEach((c) => {
        (c.material as THREE.MeshStandardMaterial).color.setHex(0x93c5fd);
      });
    }
  }, [stressHeatmap]);

  // Raycasting for Marker Hover & Click
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const pinObjects = Array.from(markerMeshesRef.current.values()).map(m => m.pin);
    const intersects = raycaster.intersectObjects(pinObjects, false);

    if (intersects.length > 0) {
      const data = intersects[0].object.userData.markerData as SensorMarkerData;
      setHoveredMarker(data);
      document.body.style.cursor = 'pointer';
    } else {
      setHoveredMarker(null);
      document.body.style.cursor = 'default';
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
    const pinObjects = Array.from(markerMeshesRef.current.values()).map(m => m.pin);
    const intersects = raycaster.intersectObjects(pinObjects, false);

    if (intersects.length > 0) {
      const code = intersects[0].object.userData.sensor_code as string;
      if (onSelectSensor) onSelectSensor(code);
    }
  };

  // Camera Presets
  const setCameraPreset = (preset: 'overview' | 'deck' | 'pylonA' | 'pylonB' | 'cables') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    switch (preset) {
      case 'overview':
        cam.position.set(0, 14, 28);
        ctrl.target.set(0, 3, 0);
        break;
      case 'deck':
        cam.position.set(-14, 2.2, 0);
        ctrl.target.set(0, 1.5, 0);
        break;
      case 'pylonA':
        cam.position.set(-7, 8, 12);
        ctrl.target.set(-7, 6, 0);
        break;
      case 'pylonB':
        cam.position.set(7, 8, 12);
        ctrl.target.set(7, 6, 0);
        break;
      case 'cables':
        cam.position.set(0, 7, 10);
        ctrl.target.set(0, 3, 0);
        break;
    }
    ctrl.update();
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shadow-xl select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : ''
      }`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
      />

      {/* Floating Header Toolbar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium text-slate-200 pointer-events-auto shadow-md">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Digital Twin 3D Model</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Scale 1:1 (~188.6m)</span>
        </div>

        {/* Viewport Action Controls */}
        <div className="flex items-center space-x-1.5 bg-slate-900/85 backdrop-blur-md p-1 rounded-lg border border-slate-700 pointer-events-auto shadow-md">
          <button
            onClick={() => setWireframeMode(!wireframeMode)}
            title="Toggle Wireframe FEA Mesh"
            className={`p-1.5 rounded text-xs transition-colors ${
              wireframeMode ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={() => setStressHeatmap(!stressHeatmap)}
            title="Toggle Stress Heatmap Overlay"
            className={`p-1.5 rounded text-xs transition-colors ${
              stressHeatmap ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCameraPreset('overview')}
            title="Reset to Isometric Overview"
            className="p-1.5 rounded text-slate-300 hover:bg-slate-800 text-xs transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {allowFullscreen && (
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen 3D View'}
              className="p-1.5 rounded text-slate-300 hover:bg-slate-800 text-xs transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Camera Preset Quick Pills (Bottom Left) */}
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 pointer-events-auto">
        <button
          onClick={() => setCameraPreset('overview')}
          className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 backdrop-blur-sm transition-all"
        >
          Overview
        </button>
        <button
          onClick={() => setCameraPreset('deck')}
          className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 backdrop-blur-sm transition-all"
        >
          Deck Level
        </button>
        <button
          onClick={() => setCameraPreset('pylonA')}
          className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 backdrop-blur-sm transition-all"
        >
          Pylon A
        </button>
        <button
          onClick={() => setCameraPreset('pylonB')}
          className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 backdrop-blur-sm transition-all"
        >
          Pylon B
        </button>
        <button
          onClick={() => setCameraPreset('cables')}
          className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 backdrop-blur-sm transition-all"
        >
          Stays
        </button>
      </div>

      {/* 3D Sensor Hover Tooltip */}
      {hoveredMarker && (
        <div
          className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-slate-900/95 backdrop-blur-md border border-slate-600 rounded-lg p-2.5 shadow-2xl text-xs min-w-[180px]"
          style={{ left: mousePos.x, top: mousePos.y - 12 }}
        >
          <div className="flex items-center justify-between pb-1 border-b border-slate-700 mb-1.5">
            <span className="font-bold text-slate-100">{hoveredMarker.sensor_code}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                hoveredMarker.quality_flag === 'CRITICAL'
                  ? 'bg-rose-900/80 text-rose-300 border border-rose-600'
                  : hoveredMarker.quality_flag === 'WARNING'
                  ? 'bg-amber-900/80 text-amber-300 border border-amber-600'
                  : 'bg-emerald-900/80 text-emerald-300 border border-emerald-600'
              }`}
            >
              {hoveredMarker.quality_flag}
            </span>
          </div>
          <div className="text-slate-300 font-medium truncate mb-1">{hoveredMarker.name}</div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Current:</span>
            <span className="font-mono font-bold text-white text-sm">
              {hoveredMarker.value !== null ? hoveredMarker.value : '--'} {hoveredMarker.unit}
            </span>
          </div>
          {hoveredMarker.is_simulated && (
            <div className="mt-1 text-[10px] text-purple-400 font-medium">● Transparently Simulated Channel</div>
          )}
          <div className="mt-1 text-[10px] text-cyan-400 text-right">Click marker to inspect →</div>
        </div>
      )}

      {/* Legend Badge (Bottom Right) */}
      <div className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-[11px] text-slate-300 flex items-center space-x-3 shadow-md pointer-events-none">
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Nominal</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Warning</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Critical</span>
        </div>
      </div>
    </div>
  );
};
