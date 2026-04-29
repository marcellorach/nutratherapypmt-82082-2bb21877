import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

interface Options {
  min?: number;
  max?: number;
  fitMin?: number;
  enabled?: boolean;
}

/**
 * Pan + zoom estilo Figma sobre um SVG embutido em um container.
 *  - wheel = zoom focado no cursor
 *  - mousedown + drag = pan via translate
 *  - fit() centraliza e ajusta a escala automaticamente
 */
export function useScrollPanZoom<T extends HTMLElement>(opts: Options = {}) {
  const { min = 0.1, max = 4, fitMin = 0.05, enabled = true } = opts;

  const containerRef = useRef<T | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(
    null,
  );
  const supressClickRef = useRef(false);

  const clamp = useCallback(
    (v: number, lo = min, hi = max) => Math.max(lo, Math.min(hi, v)),
    [min, max],
  );

  const measureNatural = useCallback(() => {
    const inner = innerRef.current;
    if (!inner) return null;
    const svg = inner.querySelector("svg");
    if (svg) {
      const vb = (svg as SVGSVGElement).viewBox?.baseVal;
      if (vb && vb.width > 0 && vb.height > 0) {
        return { w: vb.width, h: vb.height };
      }
      const rect = svg.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return { w: rect.width, h: rect.height };
    }
    const r = inner.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? { w: r.width, h: r.height } : null;
  }, []);

  const fit = useCallback(() => {
    const container = containerRef.current;
    const natural = measureNatural();
    if (!container || !natural) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    if (!cw || !ch) return;
    const raw = Math.min(cw / natural.w, ch / natural.h) * 0.95;
    const next = Math.max(fitMin, Math.min(max, raw));
    setScale(next);
    setTx((cw - natural.w * next) / 2);
    setTy((ch - natural.h * next) / 2);
  }, [measureNatural, fitMin, max]);

  const reset = fit;

  // Wheel zoom focado no cursor
  useEffect(() => {
    if (!enabled) return;
    const node = containerRef.current;
    if (!node) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = node.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setScale((prev) => {
        const delta = -e.deltaY * 0.0015;
        const next = clamp(prev * (1 + delta));
        const factor = next / prev;
        setTx((t) => mx - (mx - t) * factor);
        setTy((t) => my - (my - t) * factor);
        return next;
      });
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [enabled, clamp]);

  // Pan
  useEffect(() => {
    if (!enabled) return;
    const node = containerRef.current;
    if (!node) return;
    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      dragRef.current = { x: e.clientX, y: e.clientY, tx, ty, moved: false };
      node.style.cursor = "grabbing";
    };
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
      setTx(d.tx + dx);
      setTy(d.ty + dy);
    };
    const onUp = () => {
      const d = dragRef.current;
      if (d?.moved) supressClickRef.current = true;
      dragRef.current = null;
      if (node) node.style.cursor = "grab";
    };
    const onClickCapture = (e: MouseEvent) => {
      if (supressClickRef.current) {
        e.stopPropagation();
        e.preventDefault();
        supressClickRef.current = false;
      }
    };
    node.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    node.addEventListener("click", onClickCapture, true);
    node.style.cursor = "grab";
    return () => {
      node.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      node.removeEventListener("click", onClickCapture, true);
    };
  }, [enabled, tx, ty]);

  // Re-fit quando o container redimensiona (incl. troca de tab)
  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(node);
    return () => ro.disconnect();
  }, [fit]);

  return { containerRef, innerRef, scale, tx, ty, fit, reset, setScale };
}
