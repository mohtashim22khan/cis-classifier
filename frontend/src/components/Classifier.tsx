import { useEffect, useRef, useState } from "react";
import {
  Upload,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Brain,
  Zap,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Model registry ────────────────────────────────────────────────────────────
type ModelKey = "mobilenet" | "efficientnet" | "CNN" | "resnetv2";

const MODELS: Record<
  ModelKey,
  {
    name: string;
    tag: string;
    icon: typeof Brain;
    accuracy: string;
    desc: string;
    endpoint: string;
  }
> = {
  mobilenet: {
    name: "MobileNetV2",
    tag: "Fine-Tuned",
    icon: Layers,
    accuracy: "",
    desc: "Fine-tuned MobileNetV2 with frozen backbone + custom head.",
    endpoint: "/predict/mobilenet",
  },
  efficientnet: {
    name: "EfficientNet-B0",
    tag: "Fine-Tuned",
    icon: Zap,
    accuracy: "",
    desc: "Fine-tuned EfficientNetB0 — best accuracy/speed tradeoff.",
    endpoint: "/predict/efficientnet",
  },
  CNN: {
    name: "Custom CNN",
    tag: "Fine-Tuned",
    icon: Brain,
    accuracy: "",
    desc: "Best-tuned custom CNN model optimised for F1 score.",
    endpoint: "/predict/CNN",
  },
  resnetv2: {
    name: "ResNet50V2",
    tag: "Fine-Tuned",
    icon: Zap,
    accuracy: "",
    desc: "Fine-tuned ResNet50V2 with skip connections for deeper feature extraction.",
    endpoint: "/predict/resnetv2",
  },
};

// Base URL — reads from Vite env variable
const API_BASE = import.meta.env.VITE_API_URL;

type Result = { label: "CIS" | "Non-CIS"; confidence: number };

// ── API call ──────────────────────────────────────────────────────────────────
async function callPredict(file: File, modelKey: ModelKey): Promise<Result> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}${MODELS[modelKey].endpoint}`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Server error ${res.status}`);
  }

  const data: Result = await res.json();
  return data;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function Classifier() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [model, setModel] = useState<ModelKey>("mobilenet");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [meter, setMeter] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Animate the confidence meter from 0 → target whenever a new result lands
  useEffect(() => {
    if (!result) { setMeter(0); return; }
    setMeter(0);
    const target = result.confidence * 100;
    const start = performance.now();
    const duration = 1100;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setMeter(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [result]);

  const handleFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const runPrediction = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const prediction = await callPredict(file, model);
      setResult(prediction);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Prediction failed. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      {/* ── Upload panel ── */}
      <Card className="overflow-hidden border-2 p-6 shadow-[var(--shadow-soft)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upload an image</h2>
          {file && (
            <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          )}
        </div>

        {!preview ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className={cn(
              "group flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 transition-all",
              "hover:border-primary hover:bg-[var(--gradient-soft)]",
              dragOver
                ? "border-primary bg-[var(--gradient-soft)] scale-[1.01]"
                : "border-border bg-muted/40"
            )}
          >
            <div className="rounded-2xl bg-[var(--gradient-hero)] p-4 text-primary-foreground shadow-[var(--shadow-glow)] transition-transform group-hover:scale-110">
              <Upload className="h-7 w-7" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Drop your image here</p>
              <p className="text-sm text-muted-foreground">or click to browse · PNG, JPG, WEBP</p>
            </div>
          </button>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-muted">
            <img src={preview} alt="upload preview" className="h-80 w-full object-contain" />
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />

        {file && (
          <p className="mt-3 truncate text-xs text-muted-foreground">
            {file.name} · {(file.size / 1024).toFixed(1)} KB
          </p>
        )}
      </Card>

      {/* ── Controls + Results panel ── */}
      <div className="flex flex-col gap-6">
        <Card className="border-2 p-6 shadow-[var(--shadow-soft)]">
          <h2 className="mb-4 text-lg font-semibold">Choose a model</h2>
          <div className="flex flex-col gap-2">
            {(Object.keys(MODELS) as ModelKey[]).map((key) => {
              const m = MODELS[key];
              const Icon = m.icon;
              const active = model === key;

              return (
                <button
                  key={key}
                  onClick={() => { setModel(key); setResult(null); setError(null); }}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-300",
                    active
                      ? "border-primary bg-[var(--gradient-soft)] shadow-[var(--shadow-glow)] scale-[1.02]"
                      : "border-border hover:border-primary/40 hover:bg-muted/60 hover:translate-x-1"
                  )}
                >
                  <div className={cn(
                    "rounded-lg p-2 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6",
                    active
                      ? "bg-[var(--gradient-hero)] text-primary-foreground animate-gradient-pan"
                      : "bg-muted text-foreground"
                  )}>
                    <Icon className={cn("h-5 w-5", active && "animate-pulse")} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{m.name}</span>
                      <Badge variant="secondary" className="text-[10px]">{m.tag}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{m.accuracy}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Classify button */}
        <Button
          onClick={runPrediction}
          disabled={!file || loading}
          className="h-14 gap-2 rounded-2xl text-base font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-transform animate-gradient-pan"
          style={{ background: "var(--gradient-hero)", backgroundSize: "200% 200%" }}
        >
          <Sparkles className={cn("h-5 w-5", loading ? "animate-spin" : "animate-pulse")} />
          {loading ? "Analyzing..." : "Classify image"}
        </Button>

        {/* Error state */}
        {error && (
          <Card className="border-2 border-destructive/40 bg-destructive/5 p-4 animate-in fade-in slide-in-from-bottom-3">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

        {/* Result card */}
        {result && (
          <Card
            key={`${result.label}-${result.confidence}`}
            className="overflow-hidden border-2 p-6 shadow-[var(--shadow-glow)] animate-pop-in"
          >
            <div className="flex items-start gap-4">
              <div
                className="rounded-2xl p-3 text-white shadow-lg animate-pop-in"
                style={{
                  background:
                    result.label === "CIS"
                      ? "linear-gradient(135deg, oklch(0.72 0.18 155), oklch(0.62 0.2 175))"
                      : "linear-gradient(135deg, oklch(0.7 0.2 30), oklch(0.65 0.24 25))",
                }}
              >
                {result.label === "CIS" ? (
                  <CheckCircle2 className="h-7 w-7" />
                ) : (
                  <XCircle className="h-7 w-7" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Prediction</p>
                <h3 className="text-3xl font-bold tracking-tight">
                  {result.label === "CIS" ? "CIS detected" : "Non-CIS"}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  via {MODELS[model].name}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-mono font-semibold tabular-nums">
                  {meter.toFixed(1)}%
                </span>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="shimmer-overlay h-full rounded-full transition-[width] duration-100 ease-out"
                  style={{
                    width: `${meter}%`,
                    background:
                      result.label === "CIS"
                        ? "linear-gradient(90deg, oklch(0.72 0.18 155), oklch(0.62 0.2 175))"
                        : "linear-gradient(90deg, oklch(0.7 0.2 30), oklch(0.65 0.24 25))",
                  }}
                />
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}