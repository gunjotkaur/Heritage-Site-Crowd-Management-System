
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ScanLine,
  Users,
  MapPin,
} from "lucide-react";
import Link from "next/link";

type AssignedSite = {
  id: string;
  name: string;
  city: string;
  maxCapacity: number;
};

type ScanResult = {
  message?: string;
  error?: string;
  visitor?: string;
  site?: string;
  occupancy?: number;
  capacity?: number;
  occupancyPercent?: number;
  crowdLevel?: string;
};

export default function StaffScannerPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);

  const [site, setSite] = useState<AssignedSite | null>(null);
  const [scanType, setScanType] = useState<"ENTRY" | "EXIT">("ENTRY");
  const [cameraRunning, setCameraRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);

  const fetchSite = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/staff/crowd/updates", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load assigned site.");
      }

      setSite(data.site);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load assigned site."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSite();

    return () => {
      const scanner = scannerRef.current;

      if (scanner?.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, [fetchSite]);

  const stopCamera = async () => {
    const scanner = scannerRef.current;

    if (scanner?.isScanning) {
      try {
        await scanner.stop();
      } catch {
        // Camera may already have stopped.
      }
    }

    setCameraRunning(false);
  };

  const processQRCode = async (qrCode: string) => {
    if (processingRef.current) return;

    processingRef.current = true;
    setProcessing(true);
    setError("");
    setSuccess("");
    setResult(null);

    await stopCamera();

    try {
      const response = await fetch("/api/staff/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qrCode: qrCode.trim(),
          type: scanType,
        }),
      });

      const data: ScanResult = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "QR scan could not be processed.");
      }

      setResult(data);
      setSuccess(data.message || `${scanType} recorded successfully.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setProcessing(false);
      processingRef.current = false;
    }
  };

  const startCamera = async () => {
    setError("");
    setSuccess("");
    setResult(null);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("heritageflow-qr-reader", {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          void processQRCode(decodedText);
        },
        () => {}
      );

      setCameraRunning(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to access the camera. Check camera permissions."
      );
      setCameraRunning(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-600">
            <ScanLine size={20} />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Staff Portal
            </span>
          </div>

          <h1 className="mt-2 text-3xl font-bold">QR Ticket Scanner</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Scan visitor tickets to record site entry and exit.
          </p>
        </div>

        <Link
          href="/staff"
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <ArrowLeft size={16} />
          Dashboard
        </Link>
      </section>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-600">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          Loading assigned site...
        </div>
      ) : !site ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-8 text-center">
          <MapPin className="mx-auto text-amber-600" size={32} />
          <h2 className="mt-3 text-lg font-bold">No Site Assigned</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Contact your Admin to get a heritage site assigned.
          </p>
          <button
            onClick={fetchSite}
            className="mt-4 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            <RefreshCw size={15} className="mr-2 inline" />
            Refresh
          </button>
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-amber-600">
              <MapPin size={19} />
              <h2 className="font-bold">Assigned Heritage Site</h2>
            </div>

            <h3 className="mt-3 text-2xl font-bold">{site.name}</h3>
            <p className="text-sm text-muted-foreground">{site.city}</p>

            <div className="mt-4 flex items-center gap-3 rounded-lg bg-muted p-4">
              <Users size={22} className="text-amber-600" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Maximum Capacity
                </p>
                <p className="text-xl font-bold">
                  {site.maxCapacity.toLocaleString()}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold">Select Scan Type</h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Choose whether this visitor is entering or leaving the site.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => setScanType("ENTRY")}
                disabled={cameraRunning || processing}
                className={`rounded-xl border p-4 font-semibold transition ${
                  scanType === "ENTRY"
                    ? "border-green-500 bg-green-500/10 text-green-600"
                    : "border-border hover:bg-muted"
                } disabled:opacity-50`}
              >
                <CheckCircle className="mx-auto mb-2" size={24} />
                ENTRY
              </button>

              <button
                onClick={() => setScanType("EXIT")}
                disabled={cameraRunning || processing}
                className={`rounded-xl border p-4 font-semibold transition ${
                  scanType === "EXIT"
                    ? "border-blue-500 bg-blue-500/10 text-blue-600"
                    : "border-border hover:bg-muted"
                } disabled:opacity-50`}
              >
                <ArrowLeft className="mx-auto mb-2" size={24} />
                EXIT
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Camera Scanner</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Position the visitor's QR ticket inside the scanning box.
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  cameraRunning
                    ? "bg-green-500/10 text-green-600"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {cameraRunning ? "Camera Active" : "Camera Stopped"}
              </span>
            </div>

            <div className="mx-auto mt-5 max-w-md overflow-hidden rounded-xl border border-border bg-black">
              <div
                id="heritageflow-qr-reader"
                className="min-h-[300px] w-full"
              />
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {!cameraRunning ? (
                <button
                  onClick={startCamera}
                  disabled={processing}
                  className="flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
                >
                  <Camera size={18} />
                  Start Camera
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-semibold hover:bg-muted"
                >
                  <CameraOff size={18} />
                  Stop Camera
                </button>
              )}
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Camera permission is required. Use localhost or HTTPS.
            </p>
          </section>

          {processing && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-center">
              <RefreshCw className="mx-auto animate-spin text-amber-600" />
              <p className="mt-2 font-semibold">Processing QR ticket...</p>
            </div>
          )}

          {result && (
            <section className="rounded-xl border border-green-500/30 bg-green-500/5 p-6">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={22} />
                <h2 className="text-lg font-bold">Scan Successful</h2>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Visitor</p>
                  <p className="font-semibold">{result.visitor || "Visitor"}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Site</p>
                  <p className="font-semibold">{result.site || site.name}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Current Occupancy</p>
                  <p className="text-2xl font-bold">
                    {result.occupancy ?? "Unavailable"}
                    {result.capacity ? ` / ${result.capacity}` : ""}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Crowd Level</p>
                  <p className="font-semibold">
                    {result.crowdLevel || "Unavailable"}
                  </p>
                </div>
              </div>
            </section>
          )}

          <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <strong className="text-foreground">Important:</strong> Each
            visitor must have an individual QR ticket. After a successful
            scan, the camera stops. Start it again to scan the next visitor.
          </div>
        </>
      )}
    </div>
  );
}
