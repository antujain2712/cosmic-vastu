"use client";
import { useEffect, useRef, useState } from "react";
import { useHeading, CompassRose } from "./Compass";
import { headingToDirection, directionInfo, elementInfo, ELEMENTS, Direction } from "@/lib/knowledge";

export type RoomShot = { label: string; direction: Direction; heading: number | null; photo: string };

const PICK: Direction[] = ["NW", "N", "NE", "W", "C", "E", "SW", "S", "SE"];
const zoneHex = (d: Direction) => {
  const e = ELEMENTS.find((x) => elementInfo[x].direction === d);
  return e ? elementInfo[e].hex : "#4a4f57";
};

/** Burns room, direction and a small compass into the photo, so it reads on its own (for Sanjay-ji and the AI). */
function stampPhoto(v: HTMLVideoElement, maxSide: number, quality: number, label: string | null, d: Direction | null, heading: number | null) {
  const c = document.createElement("canvas");
  const scale = Math.min(1, maxSide / Math.max(v.videoWidth, v.videoHeight));
  c.width = Math.round(v.videoWidth * scale);
  c.height = Math.round(v.videoHeight * scale);
  const g = c.getContext("2d")!;
  g.drawImage(v, 0, 0, c.width, c.height);
  if (label || d) {
    const bar = Math.round(c.height * 0.13);
    g.fillStyle = "rgba(31,35,40,0.78)";
    g.fillRect(0, c.height - bar, c.width, bar);
    if (d) {
      g.fillStyle = zoneHex(d);
      g.fillRect(0, c.height - bar, Math.max(6, c.width * 0.012), bar);
    }
    // compass: needle points to true north
    const r = bar * 0.36;
    const cx = c.width - bar * 0.62;
    const cy = c.height - bar / 2;
    if (heading !== null) {
      g.strokeStyle = "#f3f2ee";
      g.lineWidth = Math.max(1.5, r * 0.08);
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.stroke();
      // red half of the needle points to north
      g.save();
      g.translate(cx, cy);
      g.rotate((-heading * Math.PI) / 180);
      g.fillStyle = "#d9502a";
      g.beginPath();
      g.moveTo(0, -r * 0.85);
      g.lineTo(-r * 0.22, 0);
      g.lineTo(r * 0.22, 0);
      g.closePath();
      g.fill();
      g.fillStyle = "#f3f2ee";
      g.beginPath();
      g.moveTo(0, r * 0.85);
      g.lineTo(-r * 0.22, 0);
      g.lineTo(r * 0.22, 0);
      g.closePath();
      g.fill();
      g.restore();
    }
    const text = [label, d ? directionInfo[d].name : null, heading !== null ? `${Math.round(heading)}°` : null].filter(Boolean).join("  ·  ");
    g.fillStyle = "#f3f2ee";
    g.font = `600 ${Math.round(bar * 0.34)}px sans-serif`;
    g.textAlign = "left";
    g.textBaseline = "middle";
    g.fillText(text.toUpperCase(), bar * 0.35, cy, c.width - bar * 1.6);
  }
  return c.toDataURL("image/jpeg", quality);
}

type Props =
  | { mode?: "door"; onCapture: (heading: number | null, photo: string | null) => void; onClose: () => void }
  | {
      mode: "rooms";
      rooms: { key: string; name: string }[];
      shots: number;
      maxShots: number;
      onShot: (room: string, shot: RoomShot) => void;
      onClose: () => void;
    };

/**
 * Live camera with the compass over it.
 * door: stand in the main doorway, face out, capture.
 * rooms: stand at the centre of the space, pick a room, point at it, capture — repeat.
 */
export function CameraCompass(props: Props) {
  const rooms = props.mode === "rooms";
  const video = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [room, setRoom] = useState<string | null>(null);
  const [manual, setManual] = useState<Direction | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [hasVideo, setHasVideo] = useState(false);
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
      .catch(() =>
        setErr(rooms ? "Camera access was blocked. Allow the camera in your browser, or close this and use the grid." : "Camera access was blocked. You can still capture the direction from the compass.")
      );
    if (!navigator.mediaDevices) setErr(rooms ? "This browser can't open the camera. Close this and use the grid." : "This browser can't open the camera.");
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [start, rooms]);

  const live = heading !== null ? headingToDirection(heading) : null;
  const d = manual ?? live;

  function capture() {
    const v = video.current;
    const ok = !!(v && v.videoWidth);
    if (props.mode !== "rooms") {
      const photo = ok ? stampPhoto(v!, 1280, 0.82, "Main door", live, heading) : null;
      props.onCapture(heading, photo);
      return;
    }
    if (!room || !d || !ok) return;
    const name = props.rooms.find((r) => r.key === room)?.name ?? room;
    // small: up to ten images travel in one request
    const photo = stampPhoto(v!, 800, 0.72, name, d, manual ? null : heading);
    props.onShot(room, { label: name, direction: d, heading: manual ? null : heading, photo });
    setFlash(`${name} · ${directionInfo[d].name}`);
    setTimeout(() => setFlash(null), 1600);
    setRoom(null);
    setManual(null);
  }

  const full = rooms && props.shots >= props.maxShots;
  const noCompass = status === "unsupported" || status === "denied";

  return (
    <div className="fixed inset-0 z-50 bg-ink text-paper-2 flex flex-col" role="dialog" aria-modal="true" aria-label={rooms ? "Photograph your rooms with the compass" : "Read your door's direction"}>
      <div className="relative flex-1 overflow-hidden">
        <video ref={video} playsInline muted onLoadedData={() => setHasVideo(true)} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-transparent to-ink/85" />
        <div className="absolute top-4 inset-x-4 flex justify-between items-start gap-3">
          <p className="max-w-[20rem] text-sm">
            {rooms
              ? "Stand at the centre of your space. Pick a room, point the phone at it, and capture. Repeat for each room."
              : "Stand in your main doorway, looking out. Hold the phone upright, pointing the way you face."}
          </p>
          <button onClick={props.onClose} className="btn btn-line !py-1.5 !px-3 text-sm shrink-0">{rooms ? "Done" : "Close"}</button>
        </div>

        {rooms && (
          <div className="absolute top-20 inset-x-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {props.rooms.map((r) => (
                <button key={r.key} onClick={() => setRoom(room === r.key ? null : r.key)} aria-pressed={room === r.key} className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm backdrop-blur ${room === r.key ? "bg-paper-2 text-ink border-paper-2" : "border-paper-2/60 bg-ink/30"}`}>
                  {r.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-paper-2/75 mt-1">{props.shots} of {props.maxShots} photos</p>
          </div>
        )}

        {flash && (
          <p className="absolute top-1/3 inset-x-0 mx-auto w-fit rounded-full bg-wood px-4 py-2 text-sm font-medium" role="status">Placed: {flash}</p>
        )}

        <div className="absolute inset-x-0 bottom-6 flex flex-col items-center px-4">
          <CompassRose heading={heading ?? 0} size={rooms ? 160 : 200} highlight={d} />
          <p className="script text-4xl mt-1">{d ? directionInfo[d].script : noCompass ? "No compass" : "…"}</p>
          {heading !== null && !manual && <p className="text-sm text-paper-2/80">{Math.round(heading)}°</p>}
          {err && <p className="text-sm text-paper-2/80 mt-2 max-w-xs text-center">{err}</p>}
          {status === "denied" && <button onClick={start} className="mt-2 underline text-sm">Allow compass access</button>}
          {rooms && noCompass && (
            <div className="mt-3 text-center">
              <p className="text-sm text-paper-2/80 mb-2">No compass on this device. Pick the room&apos;s direction:</p>
              <div className="grid grid-cols-3 gap-1.5 w-40 mx-auto">
                {PICK.map((x) => (
                  <button key={x} onClick={() => setManual(x)} aria-pressed={manual === x} className={`rounded-md border py-1 text-sm display ${manual === x ? "bg-paper-2 text-ink border-paper-2" : "border-paper-2/50"}`}>{x}</button>
                ))}
              </div>
            </div>
          )}
          {!rooms && status === "unsupported" && <p className="text-sm text-paper-2/80 mt-2 max-w-xs text-center">This device has no compass. Capture a photo and pick the direction by hand.</p>}
        </div>
      </div>
      <div className="p-4 bg-ink">
        {rooms ? (
          <button onClick={capture} disabled={full || !room || !d || !hasVideo} className="btn btn-light w-full">
            {full ? "Photo limit reached" : err && !hasVideo ? "Camera unavailable" : !room ? "Pick a room above" : !d ? "Waiting for the compass…" : `Capture: ${props.rooms.find((r) => r.key === room)?.name} in the ${directionInfo[d].name.toLowerCase()}`}
          </button>
        ) : (
          <button onClick={capture} className="btn btn-light w-full">{live ? `Capture: door faces ${directionInfo[live].name}` : "Capture photo"}</button>
        )}
      </div>
    </div>
  );
}
