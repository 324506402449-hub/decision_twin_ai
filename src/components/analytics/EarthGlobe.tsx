import { useRef, useEffect, useCallback } from "react";
import ThreeGlobe from "three-globe";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
export interface UniversityPin {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

interface EarthGlobeProps {
  universities: UniversityPin[];
  onPinClick?: (university: UniversityPin) => void;
  selectedPin?: string | null;
}


function buildArcs(universities: UniversityPin[]) {
  const arcs: { startLat: number; startLng: number; endLat: number; endLng: number }[] = [];
  for (let i = 0; i < universities.length - 1 && i < 8; i++) {
    arcs.push({
      startLat: universities[i].lat,
      startLng: universities[i].lng,
      endLat: universities[i + 1].lat,
      endLng: universities[i + 1].lng,
    });
  }
  return arcs;
}
const EarthGlobe = ({ universities, onPinClick, selectedPin }: EarthGlobeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<ThreeGlobe | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameRef = useRef<number>(0);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const universitiesRef = useRef(universities);
  universitiesRef.current = universities;
  const onPinClickRef = useRef(onPinClick);
  onPinClickRef.current = onPinClick;

  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const handleClick = useCallback((e: MouseEvent) => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!container || !camera || !scene) return;

    const rect = container.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, camera);

    const intersects = raycaster.current.intersectObjects(scene.children, true);
    if (intersects.length > 0 && universitiesRef.current.length > 0) {
      const point = intersects[0].point;
      const globe = globeRef.current;
      if (!globe) return;
      const globePos = new THREE.Vector3();
      globe.getWorldPosition(globePos);
      const localPt = point.clone().sub(globePos);

      const r = localPt.length();
      const lat = 90 - Math.acos(localPt.y / r) * (180 / Math.PI);
      const lng = Math.atan2(localPt.z, -localPt.x) * (180 / Math.PI) - 180;
      const normLng = ((lng + 540) % 360) - 180;

      let closest: UniversityPin | null = null;
      let minDist = 10;
      for (const u of universitiesRef.current) {
        const dist = Math.sqrt((u.lat - lat) ** 2 + (u.lng - normLng) ** 2);
        if (dist < minDist) {
          minDist = dist;
          closest = u;
        }
      }
      if (closest && onPinClickRef.current) {
        console.log("[EarthGlobe] Pin clicked:", closest.name);
        onPinClickRef.current(closest);
      }
    }
  }, []);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(4000 * 3);
    for (let i = 0; i < starPositions.length; i++) {
      starPositions[i] = (Math.random() - 0.5) * 800;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.4, transparent: true, opacity: 0.7 });
    scene.add(new THREE.Points(starGeo, starMat));
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 50, 300);
    cameraRef.current = camera;
    scene.add(new THREE.AmbientLight(0xbbbbbb, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);
    const blueAccent = new THREE.PointLight(0x3b82f6, 0.4);
    blueAccent.position.set(-200, -100, -200);
    scene.add(blueAccent);
    const globe = new ThreeGlobe({ animateIn: true })
      .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
      .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
      .atmosphereColor("#3b82f6")
      .atmosphereAltitude(0.18)
      .showAtmosphere(true);

    const globeMat = globe.globeMaterial() as THREE.MeshPhongMaterial;
    globeMat.bumpScale = 10;
    globeMat.shininess = 8;
    globeMat.emissive = new THREE.Color(0x050520);
    globeMat.emissiveIntensity = 0.15;

    scene.add(globe);
    globeRef.current = globe;
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 150;
    controls.maxDistance = 500;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controlsRef.current = controls;
    renderer.domElement.addEventListener("click", handleClick);
    renderer.domElement.style.cursor = "grab";
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    const resizeObs = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObs.observe(container);

    return () => {
      cancelAnimationFrame(frameRef.current);
      renderer.domElement.removeEventListener("click", handleClick);
      resizeObs.disconnect();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [handleClick]);
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    console.log("[EarthGlobe] Universities received:", universities.length, universities);

    if (universities.length === 0) {
      globe.pointsData([]).arcsData([]).labelsData([]);
      return;
    }
    globe
      .pointsData(universities)
      .pointLat((d: object) => (d as UniversityPin).lat)
      .pointLng((d: object) => (d as UniversityPin).lng)
      .pointColor((d: object) =>
        (d as UniversityPin).name === selectedPin ? "#00ffff" : "#00aaff",
      )
      .pointAltitude(0.06)
      .pointRadius(0.03)
      .pointResolution(16)
      .pointsMerge(false);
    globe
      .labelsData(universities)
      .labelLat((d: object) => (d as UniversityPin).lat)
      .labelLng((d: object) => (d as UniversityPin).lng)
      .labelText((d: object) => (d as UniversityPin).name)
      .labelSize(1.0)
      .labelDotRadius(0)
      .labelColor((d: object) =>
        (d as UniversityPin).name === selectedPin ? "#00ffff" : "#93c5fd",
      )
      .labelAltitude(0.015)
      .labelResolution(3);
    const arcs = buildArcs(universities);
    globe
      .arcsData(arcs)
      .arcStartLat((d: object) => (d as (typeof arcs)[0]).startLat)
      .arcStartLng((d: object) => (d as (typeof arcs)[0]).startLng)
      .arcEndLat((d: object) => (d as (typeof arcs)[0]).endLat)
      .arcEndLng((d: object) => (d as (typeof arcs)[0]).endLng)
      .arcColor(() => ["rgba(59,130,246,0.6)", "rgba(6,182,212,0.6)"])
      .arcAltitudeAutoScale(0.35)
      .arcStroke(0.4)
      .arcDashLength(0.6)
      .arcDashGap(0.25)
      .arcDashAnimateTime(2500);
  }, [universities, selectedPin]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[500px] rounded-xl overflow-hidden"
    />
  );
};

export default EarthGlobe;
