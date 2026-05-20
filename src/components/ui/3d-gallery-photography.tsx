"use client";

/* eslint-disable @next/next/no-img-element */

import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

type ImageItem = string | { src: string; alt?: string };

interface FadeSettings {
  fadeIn: {
    start: number;
    end: number;
  };
  fadeOut: {
    start: number;
    end: number;
  };
}

interface BlurSettings {
  blurIn: {
    start: number;
    end: number;
  };
  blurOut: {
    start: number;
    end: number;
  };
  maxBlur: number;
}

interface InfiniteGalleryProps {
  images: ImageItem[];
  speed?: number;
  zSpacing?: number;
  visibleCount?: number;
  falloff?: { near: number; far: number };
  fadeSettings?: FadeSettings;
  blurSettings?: BlurSettings;
  className?: string;
  style?: React.CSSProperties;
}

interface GallerySceneProps
  extends Omit<InfiniteGalleryProps, "className" | "style"> {
  wheelTargetRef: React.RefObject<HTMLDivElement | null>;
}

interface PlaneData {
  index: number;
  imageIndex: number;
  x: number;
  y: number;
  z: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  blur: number;
  scrollForce: number;
  time: number;
}

interface QueueEntry {
  imageIndex: number;
  laneIndex: number;
}

type TextureImageLike = {
  width: number;
  height: number;
};

const PLANE_COUNT = 3;
const ENTRY_LANE_COUNT = 7;

const createClothMaterial = () =>
  new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      map: { value: null },
      opacity: { value: 1.0 },
      blurAmount: { value: 0.0 },
      scrollForce: { value: 0.0 },
      time: { value: 0.0 },
      isHovered: { value: 0.0 },
    },
    vertexShader: `
      uniform float scrollForce;
      uniform float time;
      uniform float isHovered;
      varying vec2 vUv;

      void main() {
        vUv = uv;

        vec3 pos = position;
        float curveIntensity = scrollForce * 0.22;
        float distanceFromCenter = length(pos.xy);
        float curve = distanceFromCenter * distanceFromCenter * curveIntensity;

        float ripple1 = sin(pos.x * 2.0 + scrollForce * 3.0) * 0.02;
        float ripple2 = sin(pos.y * 2.5 + scrollForce * 2.0) * 0.015;
        float clothEffect = (ripple1 + ripple2) * abs(curveIntensity) * 2.0;

        float flagWave = 0.0;
        if (isHovered > 0.5) {
          float wavePhase = pos.x * 3.0 + time * 8.0;
          float waveAmplitude = sin(wavePhase) * 0.1;
          float dampening = smoothstep(-0.5, 0.5, pos.x);
          flagWave = waveAmplitude * dampening;

          float secondaryWave = sin(pos.x * 5.0 + time * 12.0) * 0.03 * dampening;
          flagWave += secondaryWave;
        }

        pos.z -= (curve + clothEffect + flagWave);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform float opacity;
      uniform float blurAmount;
      uniform float scrollForce;
      varying vec2 vUv;

      void main() {
        vec4 color = texture2D(map, vUv);

        if (blurAmount > 0.0) {
          vec2 texelSize = 1.0 / vec2(textureSize(map, 0));
          vec4 blurred = vec4(0.0);
          float total = 0.0;

          for (float x = -2.0; x <= 2.0; x += 1.0) {
            for (float y = -2.0; y <= 2.0; y += 1.0) {
              vec2 offset = vec2(x, y) * texelSize * blurAmount;
              float weight = 1.0 / (1.0 + length(vec2(x, y)));
              blurred += texture2D(map, vUv + offset) * weight;
              total += weight;
            }
          }

          color = blurred / total;
        }

        float curveHighlight = abs(scrollForce) * 0.05;
        color.rgb += vec3(curveHighlight * 0.1);
        gl_FragColor = vec4(color.rgb, color.a * opacity);
      }
    `,
  });

function getTextureAspect(texture: THREE.Texture) {
  const image = texture.image as TextureImageLike | undefined;
  if (!image?.width || !image.height) return 1;
  return image.width / image.height;
}

function getEntryLane(isNarrow: boolean, laneIndex: number) {
  const lanes = isNarrow
    ? [
        { x: -0.92, y: 0.72, frontX: -2.64, frontY: -0.58, family: "left" },
        { x: -0.48, y: 0.96, frontX: 1.28, frontY: -0.68, family: "left" },
        { x: -0.16, y: 0.88, frontX: -0.06, frontY: 2.54, family: "center" },
        { x: 0.08, y: 0.74, frontX: 0.04, frontY: -0.72, family: "center" },
        { x: 0.32, y: -0.12, frontX: 0.08, frontY: -0.94, family: "center" },
        { x: 0.58, y: 0.94, frontX: 2.38, frontY: 1.7, family: "right" },
        { x: 0.94, y: 0.66, frontX: 0.7, frontY: -1.56, family: "right" },
      ]
    : [
        { x: -2.35, y: 0.92, frontX: -4.92, frontY: -0.74, family: "left" },
        { x: 2.0, y: 0.22, frontX: 2.38, frontY: 1.88, family: "left" },
        { x: 2.22, y: -3.06, frontX: 4.08, frontY: -4.12, family: "center" },
        { x: -1.1, y: 3.86, frontX: -3.02, frontY: 3.84, family: "center" },
        { x: 1.42, y: -0.18, frontX: 3.1, frontY: -1.08, family: "center" },
        { x: -0.78, y: 0.16, frontX: -2.48, frontY: 2.86, family: "right" },
        { x: 1.32, y: 0.78, frontX: 3.88, frontY: -1.68, family: "right" },
      ];

  return lanes[((laneIndex % lanes.length) + lanes.length) % lanes.length];
}

function getNextLaneIndex(previousLaneIndex: number) {
  return (previousLaneIndex + 1 + ENTRY_LANE_COUNT) % ENTRY_LANE_COUNT;
}

function getPreviousLaneIndex(nextLaneIndex: number) {
  return (nextLaneIndex - 1 + ENTRY_LANE_COUNT) % ENTRY_LANE_COUNT;
}

function getPlaneSnapshot(
  phase: number,
  aspect: number,
  isNarrow: boolean,
  blurSettings: BlurSettings,
  role: number,
  laneIndex: number,
) {
  const back = getEntryLane(isNarrow, laneIndex);
  const front = {
    x: back.frontX,
    y: back.frontY,
    z: isNarrow ? -6.1 : -5.5,
    h: isNarrow ? 2.28 : 3.0,
  };
  const mid = {
    x: THREE.MathUtils.lerp(back.x, front.x, 0.45),
    y: THREE.MathUtils.lerp(back.y, front.y, 0.45),
    z: THREE.MathUtils.lerp(isNarrow ? -12.2 : -12.8, front.z, 0.42),
    h: THREE.MathUtils.lerp(isNarrow ? 0.66 : 0.92, front.h, 0.38),
  };
  const directionX = front.x - back.x;
  const directionY = front.y - back.y;
  const directionLength = Math.max(Math.hypot(directionX, directionY), 0.001);
  const normalizedX = directionX / directionLength;
  const normalizedY = directionY / directionLength;
  const exitDistance = isNarrow ? 0.9 : 1.15;
  const out = {
    x: front.x + normalizedX * exitDistance,
    y: front.y + normalizedY * exitDistance,
    z: isNarrow ? -4.3 : -3.7,
    h: isNarrow ? 3.1 : 4.15,
  };
  const backDepth = isNarrow ? -12.2 : -12.8;
  const backHeight = isNarrow ? 0.66 : 0.92;

  let x = 0;
  let y = 0;
  let z = 0;
  let height = 1;
  let opacity = 0;
  let blur = blurSettings.maxBlur;

  if (role === 0) {
    const move = THREE.MathUtils.smoothstep(phase, 0.0, 1.0);
    x = THREE.MathUtils.lerp(front.x, out.x, move);
    y = THREE.MathUtils.lerp(front.y, out.y, move);
    z = THREE.MathUtils.lerp(front.z, out.z, move);
    height = THREE.MathUtils.lerp(front.h, out.h, move);
    opacity = 1 - THREE.MathUtils.smoothstep(phase, 0.78, 1.0);
    blur = THREE.MathUtils.lerp(0.08, blurSettings.maxBlur * 0.22, move);
  } else if (role === 1) {
    const move = THREE.MathUtils.smoothstep(phase, 0.0, 1.0);
    x = THREE.MathUtils.lerp(mid.x, front.x, move);
    y = THREE.MathUtils.lerp(mid.y, front.y, move);
    z = THREE.MathUtils.lerp(mid.z, front.z, move);
    height = THREE.MathUtils.lerp(mid.h, front.h, move);
    opacity = THREE.MathUtils.lerp(0.68, 0.98, move);
    blur = THREE.MathUtils.lerp(blurSettings.maxBlur * 0.3, 0.08, move);
  } else {
    const move = THREE.MathUtils.smoothstep(phase, 0.0, 1.0);
    x = THREE.MathUtils.lerp(back.x, mid.x, move);
    y = THREE.MathUtils.lerp(back.y, mid.y, move);
    z = THREE.MathUtils.lerp(backDepth, mid.z, move);
    height = THREE.MathUtils.lerp(backHeight, mid.h, move);
    opacity = THREE.MathUtils.smoothstep(phase, 0.06, 0.46) * 0.72;
    blur = THREE.MathUtils.lerp(blurSettings.maxBlur, blurSettings.maxBlur * 0.32, move);
  }

  return {
    x,
    y,
    z,
    scaleX: height * aspect,
    scaleY: height,
    opacity,
    blur,
  };
}

function ImagePlane({
  texture,
  planeIndex,
  planesDataRef,
}: {
  texture: THREE.Texture;
  planeIndex: number;
  planesDataRef: React.MutableRefObject<PlaneData[]>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const material = useMemo(() => createClothMaterial(), []);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    material.uniforms.map.value = texture;
  }, [material, texture]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    material.uniforms.isHovered.value = isHovered ? 1.0 : 0.0;
  }, [isHovered, material]);

  useFrame(() => {
    const mesh = meshRef.current;
    const plane = planesDataRef.current[planeIndex];
    if (!mesh || !plane) return;

    mesh.position.set(plane.x, plane.y, plane.z);
    mesh.scale.set(plane.scaleX, plane.scaleY, 1);
    // eslint-disable-next-line react-hooks/immutability
    material.uniforms.time.value = plane.time;
    material.uniforms.scrollForce.value = plane.scrollForce;
    material.uniforms.opacity.value = plane.opacity;
    material.uniforms.blurAmount.value = plane.blur;
  });

  return (
    <mesh
      ref={meshRef}
      material={material}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      <planeGeometry args={[1, 1, 32, 32]} />
    </mesh>
  );
}

function GalleryScene({
  images,
  speed = 1,
  visibleCount = PLANE_COUNT,
  wheelTargetRef,
  blurSettings = {
    blurIn: { start: 0.0, end: 0.1 },
    blurOut: { start: 0.9, end: 1.0 },
    maxBlur: 3.0,
  },
}: GallerySceneProps) {
  const size = useThree((state) => state.size);
  const [autoPlay, setAutoPlay] = useState(true);
  const lastInteraction = useRef(0);
  const velocityRef = useRef(0.58 * speed);
  const progressRef = useRef(0.36);
  const touchYRef = useRef<number | null>(null);

  const planeCount = Math.max(1, Math.min(PLANE_COUNT, visibleCount, images.length || PLANE_COUNT));
  const isNarrow = size.width < 900;

  const normalizedImages = useMemo(
    () => images.map((img) => (typeof img === "string" ? { src: img, alt: "" } : img)),
    [images],
  );
  const [renderQueue, setRenderQueue] = useState<QueueEntry[]>(() =>
    Array.from({ length: planeCount }, (_, index) => ({
      imageIndex: index % Math.max(normalizedImages.length, 1),
      laneIndex: index % ENTRY_LANE_COUNT,
    })),
  );
  const queueRef = useRef(renderQueue);

  const textures = useTexture(normalizedImages.map((img) => img.src));

  const planesData = useRef<PlaneData[]>(
    Array.from({ length: planeCount }, (_, index) => ({
      index,
      imageIndex: index,
      x: 0,
      y: 0,
      z: -10,
      scaleX: 1,
      scaleY: 1,
      opacity: 0,
      blur: blurSettings.maxBlur,
      scrollForce: 0,
      time: 0,
    })),
  );

  useEffect(() => {
    lastInteraction.current = Date.now();
    queueRef.current = Array.from({ length: planeCount }, (_, index) => ({
      imageIndex: index % Math.max(normalizedImages.length, 1),
      laneIndex: index % ENTRY_LANE_COUNT,
    }));
    planesData.current = Array.from({ length: planeCount }, (_, index) => ({
      index,
      imageIndex: index,
      x: 0,
      y: 0,
      z: -10,
      scaleX: 1,
      scaleY: 1,
      opacity: 0,
      blur: blurSettings.maxBlur,
      scrollForce: 0,
      time: 0,
    }));
    setRenderQueue([...queueRef.current]);
  }, [blurSettings.maxBlur, normalizedImages.length, planeCount]);

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();
      progressRef.current += event.deltaY * 0.00092 * speed;
      velocityRef.current += event.deltaY * 0.0078 * speed;
      velocityRef.current = THREE.MathUtils.clamp(velocityRef.current, -1.65, 1.65);
      setAutoPlay(false);
      lastInteraction.current = Date.now();
    },
    [speed],
  );

  const handleTouchStart = useCallback((event: TouchEvent) => {
    touchYRef.current = event.touches[0]?.clientY ?? null;
  }, []);

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      const nextTouchY = event.touches[0]?.clientY;
      if (typeof nextTouchY !== "number") return;

      const previousTouchY = touchYRef.current;
      touchYRef.current = nextTouchY;
      if (previousTouchY === null) return;

      const deltaY = previousTouchY - nextTouchY;
      event.preventDefault();
      progressRef.current += deltaY * 0.0016 * speed;
      velocityRef.current += deltaY * 0.0115 * speed;
      velocityRef.current = THREE.MathUtils.clamp(velocityRef.current, -2.1, 2.1);
      setAutoPlay(false);
      lastInteraction.current = Date.now();
    },
    [speed],
  );

  const handleTouchEnd = useCallback(() => {
    touchYRef.current = null;
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        velocityRef.current = THREE.MathUtils.clamp(velocityRef.current - 0.3 * speed, -1.65, 1.65);
        setAutoPlay(false);
        lastInteraction.current = Date.now();
      } else if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        velocityRef.current = THREE.MathUtils.clamp(velocityRef.current + 0.3 * speed, -1.65, 1.65);
        setAutoPlay(false);
        lastInteraction.current = Date.now();
      }
    },
    [speed],
  );

  useEffect(() => {
    const wheelTarget = wheelTargetRef.current;
    if (wheelTarget) {
      wheelTarget.addEventListener("wheel", handleWheel, { passive: false });
      wheelTarget.addEventListener("touchstart", handleTouchStart, { passive: true });
      wheelTarget.addEventListener("touchmove", handleTouchMove, { passive: false });
      wheelTarget.addEventListener("touchend", handleTouchEnd);
      wheelTarget.addEventListener("touchcancel", handleTouchEnd);
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (wheelTarget) {
        wheelTarget.removeEventListener("wheel", handleWheel);
        wheelTarget.removeEventListener("touchstart", handleTouchStart);
        wheelTarget.removeEventListener("touchmove", handleTouchMove);
        wheelTarget.removeEventListener("touchend", handleTouchEnd);
        wheelTarget.removeEventListener("touchcancel", handleTouchEnd);
      }
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, handleTouchEnd, handleTouchMove, handleTouchStart, handleWheel, wheelTargetRef]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (Date.now() - lastInteraction.current > 1000) {
        setAutoPlay(true);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useFrame((state, delta) => {
    if (!normalizedImages.length) return;

    if (autoPlay) {
      velocityRef.current += 0.1 * delta * speed;
    }

    velocityRef.current *= 0.972;
    velocityRef.current = THREE.MathUtils.clamp(velocityRef.current, -2.1, 2.1);
    progressRef.current += velocityRef.current * delta * 0.86;

    let rotated = false;
    while (progressRef.current >= 1) {
      progressRef.current -= 1;
      rotated = true;
      const current = queueRef.current;
      const nextImage = normalizedImages.length
        ? (current[current.length - 1]?.imageIndex + 1) % normalizedImages.length
        : 0;
      const previousLane = current[current.length - 1]?.laneIndex ?? 0;
      const nextLane = getNextLaneIndex(previousLane);
      queueRef.current = [
        current[1] ?? current[0] ?? { imageIndex: 0, laneIndex: 0 },
        current[2] ?? { imageIndex: nextImage, laneIndex: nextLane },
        { imageIndex: nextImage, laneIndex: nextLane },
      ];
    }
    while (progressRef.current < 0) {
      progressRef.current += 1;
      rotated = true;
      const current = queueRef.current;
      const prevImage = normalizedImages.length
        ? (current[0]?.imageIndex - 1 + normalizedImages.length) % normalizedImages.length
        : 0;
      const previousLane = current[0]?.laneIndex ?? 0;
      queueRef.current = [
        { imageIndex: prevImage, laneIndex: getPreviousLaneIndex(previousLane) },
        current[0] ?? { imageIndex: prevImage, laneIndex: previousLane },
        current[1] ?? { imageIndex: prevImage, laneIndex: previousLane },
      ];
    }

    if (rotated) {
      setRenderQueue([...queueRef.current]);
    }

    const time = state.clock.getElapsedTime();
    const phase = THREE.MathUtils.clamp(progressRef.current, 0, 0.9999);

    for (let index = 0; index < planeCount; index += 1) {
      const entry = queueRef.current[index] ?? { imageIndex: 0, laneIndex: 0 };
      const imageIndex = entry.imageIndex;
      const texture = textures[imageIndex];
      if (!texture) continue;

      const aspect = getTextureAspect(texture);
      const snapshot = getPlaneSnapshot(phase, aspect, isNarrow, blurSettings, index, entry.laneIndex);

      planesData.current[index] = {
        index,
        imageIndex,
        x: snapshot.x,
        y: snapshot.y,
        z: snapshot.z,
        scaleX: snapshot.scaleX,
        scaleY: snapshot.scaleY,
        opacity: THREE.MathUtils.clamp(snapshot.opacity, 0, 1),
        blur: THREE.MathUtils.clamp(snapshot.blur, 0, blurSettings.maxBlur),
        scrollForce: velocityRef.current,
        time,
      };
    }
  });

  if (!normalizedImages.length) return null;

  return (
    <>
      {Array.from({ length: planeCount }, (_, index) => {
        const imageIndex = renderQueue[index]?.imageIndex ?? index % normalizedImages.length;
        const texture = textures[imageIndex];

        if (!texture) return null;

        return (
          <ImagePlane
            key={index}
            texture={texture}
            planeIndex={index}
            planesDataRef={planesData}
          />
        );
      })}
    </>
  );
}

function FallbackGallery({ images }: { images: ImageItem[] }) {
  const normalizedImages = useMemo(
    () => images.map((img) => (typeof img === "string" ? { src: img, alt: "" } : img)),
    [images],
  );

  return (
    <div className="threeGalleryFallback">
      <div className="threeGalleryFallbackGrid">
        {normalizedImages.slice(0, 3).map((img, index) => (
          <img
            key={`${img.src}-${index}`}
            src={img.src}
            alt={img.alt}
            className="threeGalleryFallbackImage"
          />
        ))}
      </div>
    </div>
  );
}

export default function InfiniteGallery({
  images,
  className = "h-96 w-full",
  style,
  speed = 1.2,
  visibleCount = PLANE_COUNT,
  blurSettings = {
    blurIn: { start: 0.0, end: 0.1 },
    blurOut: { start: 0.9, end: 1.0 },
    maxBlur: 6.8,
  },
}: InfiniteGalleryProps) {
  const wheelTargetRef = useRef<HTMLDivElement>(null);
  const [webglSupported] = useState(() => {
    try {
      if (typeof document === "undefined") {
        return true;
      }
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      return Boolean(gl);
    } catch {
      return false;
    }
  });

  if (!webglSupported) {
    return (
      <div className={className} style={style}>
        <FallbackGallery images={images} />
      </div>
    );
  }

  return (
    <div ref={wheelTargetRef} className={className} style={style}>
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <GalleryScene
          images={images}
          speed={speed}
          visibleCount={visibleCount}
          wheelTargetRef={wheelTargetRef}
          blurSettings={blurSettings}
        />
      </Canvas>
    </div>
  );
}
