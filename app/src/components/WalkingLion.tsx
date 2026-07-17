import { useEffect, useRef } from "react";

// Concept 2 — the lion leaves the hero and walks the site as you scroll.
// Packed video: left half = color on black, right half = luminance mask.
// A tiny WebGL shader keys it to true transparency, works in every browser.

const PACK_SRC = "/assets/lion_walk_pack_v1.mp4";
const PACK_END_T = 9.9;

const VERT = `attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*0.5+0.5,0.5-p.y*0.5);gl_Position=vec4(p,0.,1.);}`;
const FRAG = `precision mediump float;varying vec2 uv;uniform sampler2D t;
void main(){
  vec3 c = texture2D(t, vec2(uv.x*0.5, uv.y)).rgb;
  float a = texture2D(t, vec2(0.5+uv.x*0.5, uv.y)).r;
  gl_FragColor = vec4(c, a);
}`;

export function WalkingLion() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const video = document.createElement("video");
    video.src = PACK_SRC;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.load();

    const gl = canvas.getContext("webgl", { premultipliedAlpha: false, alpha: true });
    if (!gl) return;

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    let targetTime = 0;
    let raf = 0;
    let seekRaf = 0;

    const update = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      const heroEnd = window.innerHeight * 3.6; // past the hero turn track
      const p = Math.min(1, Math.max(0, (window.scrollY - heroEnd) / Math.max(1, total - heroEnd)));

      // visible only after the hero journey
      canvas.style.opacity = window.scrollY > heroEnd - window.innerHeight * 0.5 ? "1" : "0";

      // walk cycle loops as he travels; ping-pong horizontal passes down the page
      const passes = 3;
      const q = p * passes;
      const pass = Math.min(passes - 1, Math.floor(q));
      const f = q - pass;
      const dir = pass % 2 === 0 ? 1 : -1;
      const w = window.innerWidth;
      // he grows smaller as he walks deeper into the site
      const shrink = 1 - p * 0.62;
      const lionW = Math.min(380, w * 0.42) * shrink;
      const x = dir === 1 ? -lionW + f * (w + lionW) : w - f * (w + lionW);
      const y = 12 + p * 70; // drifts from 12vh to 82vh down the viewport
      canvas.style.transform = `translate3d(${x}px, ${y}vh, 0) scaleX(${dir})`;
      canvas.style.width = `${lionW}px`;
      canvas.style.height = `${(lionW * 720) / 1280}px`;

      targetTime = (f * 2 * PACK_END_T) % PACK_END_T; // two strides per pass

      raf = requestAnimationFrame(update);
    };

    const seekLoop = () => {
      if (video.readyState >= 2 && !video.seeking && Number.isFinite(video.duration)) {
        const cur = video.currentTime;
        let diff = targetTime - cur;
        if (Math.abs(diff) > 0.05) {
          if (Math.abs(diff) > PACK_END_T / 2) diff = Math.sign(diff) * 0.5; // wrap
          const step = Math.max(-0.5, Math.min(0.5, diff * 0.5));
          video.currentTime = Math.max(0, Math.min(PACK_END_T, cur + step));
        }
        if (video.videoWidth > 0) {
          canvas.width = 1280;
          canvas.height = 720;
          gl.viewport(0, 0, 1280, 720);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
      }
      seekRaf = requestAnimationFrame(seekLoop);
    };

    raf = requestAnimationFrame(update);
    seekRaf = requestAnimationFrame(seekLoop);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(seekRaf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-40 opacity-0 transition-opacity duration-700"
    />
  );
}
