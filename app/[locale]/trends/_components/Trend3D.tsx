"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { TrendSeries } from "@/lib/trends";
import { languageColor } from "./colors";

const GAP = 1.4;
const MAX_HEIGHT = 6;

/**
 * 3D 막대 (Three.js) — x: 언어, z: 월, 높이: 비중. 드래그로 회전.
 * 보여주기용이라 수치는 위 2D 차트가 담당. WebGL이 없으면 아무것도 그리지 않는다.
 */
export default function Trend3D({ series }: { series: TrendSeries }) {
  const ref = useRef<HTMLDivElement>(null);
  // ssr: false로만 불러오니 여기선 document가 있다
  const [supported] = useState(() => !!document.createElement("canvas").getContext("webgl2"));

  useEffect(() => {
    const el = ref.current;
    if (!el || !supported) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.8);
    sun.position.set(5, 12, 8);
    scene.add(sun);

    const nL = series.languages.length;
    const nP = series.periods.length;
    const maxShare = Math.max(...series.languages.flatMap((l) => l.shares), 0.0001);
    const geo = new THREE.BoxGeometry(0.8, 1, 0.8);
    const materials = new Map<string, THREE.MeshStandardMaterial>();
    series.languages.forEach((l, i) => {
      const mat = new THREE.MeshStandardMaterial({ color: languageColor(l.language) });
      materials.set(l.language, mat);
      l.shares.forEach((s, j) => {
        const h = Math.max((s / maxShare) * MAX_HEIGHT, 0.05);
        const bar = new THREE.Mesh(geo, mat);
        bar.scale.y = h;
        bar.position.set((i - (nL - 1) / 2) * GAP, h / 2, (j - (nP - 1) / 2) * GAP);
        scene.add(bar);
      });
    });
    const floor = new THREE.GridHelper(Math.max(nL, nP) * GAP + 2, Math.max(nL, nP) + 1, 0xd1d5db, 0xe5e7eb);
    scene.add(floor);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
    camera.position.set(nL * 0.9, 9, nP * GAP + 12);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2, 0);
    controls.enableDamping = true;
    controls.enableZoom = false; // 휠은 페이지 스크롤에 양보
    controls.autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    controls.autoRotateSpeed = 0.8;

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let raf = 0;
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      geo.dispose();
      materials.forEach((m) => m.dispose());
      floor.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [series, supported]);

  if (!supported) return null;
  return (
    <div>
      <div ref={ref} className="h-80 w-full cursor-grab active:cursor-grabbing" aria-hidden />
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
        {series.languages.map((l) => (
          <li key={l.language} className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: languageColor(l.language) }} />
            {l.language}
          </li>
        ))}
      </ul>
    </div>
  );
}
