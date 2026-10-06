"use client";
import { useEffect, useRef, useState } from "react";
import { useHeading, CompassRose } from "./Compass";
import { headingToDirection, directionInfo } from "@/lib/knowledge";

/** Live camera with the compass over it. Stand in the main doorway, face out, capture. */
export function CameraCompass({ onCapture, onClose }: { onCapture: (heading: number | null, photo: string | null) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const { heading, status, start } = useHeading();

  useEffect(() => {
    let stream: MediaStream | null = null;
    start();
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then((s) => {
        stream = s;
        if (video.current) {
          video.current.srcObject = s;
          video.current.play().catch(() => {});
        }
      })
      .catch(() => setErr("Camera access was blocked. You can still capture the direction from the compass."));
    if (!navigator.mediaDevices) setErr("This browser can't open the camera.");
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [start]);

  function capture() {
    let photo: string | null = null;
    const v = video.current;
    if (v && v.videoWidth) {
      const c = document.createElement("canvas");
      const scale = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
      c.width = v.videoWidth * scale;
      c.height = v.videoHeight * scale;
      c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
      photo = c.toDataURL("image/jpeg", 0.82);
    }
    onCapture(heading, photo);
  }

  const d = heading !== null ? headingToDirection(heading) : null;

  return (
    <div className="fixed inset-0 z-50 bg-ink text-paper-2 flex flex-col" role="dialog" aria-modal="true" aria-label="Read your door's direction">
      <div className="relative flex-1 overflow-hidden">
        <video ref={video} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-transparent to-ink/80" />
        <div className="absolute top-4 inset-x-4 flex justify-between items-start">
          <p className="max-w-[18rem] text-sm">Stand in your main doorway, looking out. Hold the phone upright, pointing the way you face.</p>
          <button onClick={onClose} className="btn btn-line !py-1.5 !px-3 text-sm">Close</button>
        </div>
        <div className="absolute inset-x-0 bottom-6 flex flex-col items-center">
          <CompassRose heading={heading ?? 0} size={200} highlight={d} />
          <p className="script text-4xl mt-1">{d ? directionInfo[d].script : status === "unsupported" ? "No compass" : "…"}</p>
          {heading !== null && <p className="text-sm text-paper-2/80">{Math.round(heading)}°</p>}
          {err && <p className="text-sm text-paper-2/80 mt-2 max-w-xs text-center">{err}</p>}
          {status === "unsupported" && <p className="text-sm text-paper-2/80 mt-2 max-w-xs text-center">This device has no compass. Capture a photo and pick the direction by hand.</p>}
          {status === "denied" && <button onClick={start} className="mt-2 underline text-sm">Allow compass access</button>}
        </div>
      </div>
      <div className="p-4 bg-ink">
        <button onClick={capture} className="btn btn-light w-full">{d ? `Capture: door faces ${directionInfo[d].name}` : "Capture photo"}</button>
      </div>
    </div>
  );
}
