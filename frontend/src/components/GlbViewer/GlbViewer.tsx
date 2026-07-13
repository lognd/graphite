// The GLB viewer, ported INTO the app as a component (WO-G4 deliverable 3)
// -- this is the ONE 3D renderer graphite ships; the old standalone
// `graphite/viewer.html` (retired with WO-59's server) is not reachable
// from history in this repo (its offline-viewer approach predates the
// server split), so this is a fresh implementation against the same
// bundled-locally constraint (charter 3.1: no CDN, three.js vendored via
// npm and lazy-loaded per route, spec 02.7). Fit + orbit are the floor;
// a section-cut toggle is DEFERRED (companion audit) -- it is not "cheap"
// without a profiled mesh-clipping pass, which belongs behind the WASM
// doctrine's profile-first gate (02.7 sec. 1), not bolted on here.
//
// WASM doctrine note (02.7): this component's hot path is GPU-side
// (three.js's WebGLRenderer), not a JS-side geometry transform -- so it
// does NOT qualify for the wasm/ crate today. If a section-cut/measure
// feature lands later and its clipping math is profiled hot, THAT is the
// candidate for a wasm32 build of the existing lithos geometry crate
// (dedup seam, 02.7 sec. 3), never a local re-implementation first.

import { useEffect, useRef, useState } from 'react';
import { EmptyState } from '../EmptyState/EmptyState';
import { ErrorState } from '../ErrorState/ErrorState';
import { HashChip } from '../HashChip/HashChip';
import './GlbViewer.css';

export interface GlbViewerProps {
  /** The GLB's raw bytes (already fetched by content hash -- this
   * component never fetches on its own, spec 02.2's one api-layer rule). */
  glbBytes: ArrayBuffer | null;
  contentHash: string | null;
  stepDownloadHref: string | null;
  stepContentHash: string | null;
}

export function GlbViewer({
  glbBytes,
  contentHash,
  stepDownloadHref,
  stepContentHash,
}: GlbViewerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!glbBytes || !mountRef.current) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // Lazy import: three.js only enters the bundle for a route that
        // actually mounts a GLB viewer (WASM-doctrine-style lazy loading,
        // 02.7 sec. 2, applied to this heavy dependency generally).
        const THREE = await import('three');
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        if (disposed || !mountRef.current) return;

        const mount = mountRef.current;
        const width = mount.clientWidth || 640;
        const height = mount.clientHeight || 480;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 10000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        mount.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(1, 1, 1);
        scene.add(dir);

        const loader = new GLTFLoader();
        const gltf = await loader.parseAsync(glbBytes, '');
        if (disposed) return;
        scene.add(gltf.scene);

        const box = new THREE.Box3().setFromObject(gltf.scene);
        const size = box.getSize(new THREE.Vector3()).length() || 1;
        const center = box.getCenter(new THREE.Vector3());
        camera.position.copy(center).add(new THREE.Vector3(size, size, size));
        camera.near = size / 100;
        camera.far = size * 100;
        camera.updateProjectionMatrix();

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.copy(center);
        controls.update();

        let frame: number;
        function animate() {
          frame = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        }
        animate();

        function fit() {
          camera.position.copy(center).add(new THREE.Vector3(size, size, size));
          controls.target.copy(center);
          controls.update();
        }
        const fitButton = mount.parentElement?.querySelector('[data-action="fit"]');
        fitButton?.addEventListener('click', fit);

        cleanup = () => {
          cancelAnimationFrame(frame);
          fitButton?.removeEventListener('click', fit);
          controls.dispose();
          renderer.dispose();
          mount.removeChild(renderer.domElement);
        };
        setLoading(false);
      } catch (err) {
        // Fallback honesty (spec 02.7 sec. 4): a WASM/heavy-asset load
        // failure degrades to a labeled error state, never a silent hang.
        if (!disposed) {
          setError(String(err));
          setLoading(false);
        }
      }
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [glbBytes]);

  if (!glbBytes) {
    return (
      <EmptyState
        title="No GLB shipped for this project"
        detail="This is not a mech/electrical target, or the build did not produce a 3D export -- nothing to render."
      />
    );
  }
  if (error) {
    return <ErrorState title="Could not render the GLB" detail={error} />;
  }

  return (
    <div className="gr-glb-viewer">
      <div className="gr-glb-viewer__toolbar">
        <button type="button" data-action="fit">
          fit
        </button>
        <span className="gr-micro-label">drag to orbit, scroll to zoom</span>
        {loading ? <span role="status">loading model...</span> : null}
      </div>
      <div ref={mountRef} className="gr-glb-viewer__canvas" />
      <div className="gr-glb-viewer__caption">
        {contentHash ? (
          <span>
            GLB content hash <HashChip full={contentHash} />
          </span>
        ) : null}
        {stepDownloadHref && stepContentHash ? (
          <span>
            <a href={stepDownloadHref} download>
              download STEP
            </a>{' '}
            <HashChip full={stepContentHash} />
          </span>
        ) : (
          <span className="gr-reason-cell gr-reason-cell--empty">no STEP shipped</span>
        )}
      </div>
    </div>
  );
}
