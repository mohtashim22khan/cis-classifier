#main page of models

import { useRef, useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Model registry ────────────────────────────────────────────────────────────
// Add future models here — the UI will pick them up automatically.
// `endpoint` is the POST route on your FastAPI backend for that model.
type ModelKey = "mobilenet" | "efficientnet" | "vit";

const MODELS: Record<
  ModelKey,
  {
    name: string;
    tag: string;
    icon: typeof Brain;
    accuracy: string;
    desc: string;
    endpoint: string; // FastAPI route for this model
  }
> = {
  mobilenet: {
    name: "MobileNetV2",
    tag: "Fine-Tuned",
    icon: Layers,
    accuracy: "93.2%",
    desc: "Fine-tuned MobileNetV2 with frozen backbone + custom head.",
    endpoint: "/predict/mobilenet",
  },
  efficientnet: {
    name: "EfficientNet-B3",
    tag: "Coming Soon",
    icon: Zap,
    accuracy: "–",
    desc: "Best accuracy/speed tradeoff. Integration in progress.",
    endpoint: "/predict/efficientnet",
  },
  vit: {
    name: "Vision Transformer",
    tag: "Coming Soon",
    icon: Brain,
    accuracy: "–",
    desc: "Transformer-based global attention model. Integration in progress.",
    endpoint: "/predict/vit",
  },
};

// Base URL — reads from Vite env variable, falls back to localhost for dev
//const API_BASE = "http://localhost:8000";
const API_BASE = import.meta.env.VITE_API_URL ?? "https://airy-strength-production-2155.up.railway.app";
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

  // Backend returns { label: "CIS" | "Non-CIS", confidence: 0.0–1.0 }
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
  const inputRef = useRef<HTMLInputElement>(null);

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

    // Block prediction for models not yet integrated
    if (model !== "mobilenet") {
      setError(`${MODELS[model].name} is not yet integrated. Please select MobileNetV2.`);
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const prediction = await callPredict(file, model);
      setResult(prediction);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Prediction failed. Make sure the backend is running.",
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
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
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
                : "border-border bg-muted/40",
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
              const comingSoon = m.tag === "Coming Soon";

              return (
                <button
                  key={key}
                  onClick={() => {
                    setModel(key);
                    setResult(null);
                    setError(null);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all",
                    active
                      ? "border-primary bg-[var(--gradient-soft)] shadow-[var(--shadow-soft)]"
                      : "border-border hover:border-primary/40 hover:bg-muted/60",
                    comingSoon && "opacity-60",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg p-2",
                      active
                        ? "bg-[var(--gradient-hero)] text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{m.name}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {m.tag}
                      </Badge>
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
          className="h-14 gap-2 rounded-2xl text-base font-semibold text-primary-foreground shadow-[var(--shadow-soft)] hover:opacity-95"
          style={{ background: "var(--gradient-hero)" }}
        >
          <Sparkles className={cn("h-5 w-5", loading && "animate-spin")} />
          {loading ? "Analyzing..." : "Classify image"}
        </Button>

        {/* Error state */}
        {error && (
          <Card className="border-2 border-destructive/40 bg-destructive/5 p-4 animate-in fade-in slide-in-from-bottom-3">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

        {/* Result card — same design as original */}
        {result && (
          <Card className="overflow-hidden border-2 p-6 shadow-[var(--shadow-soft)] animate-in fade-in slide-in-from-bottom-3">
            <div className="flex items-start gap-4">
              <div
                className="rounded-2xl p-3 text-white shadow-lg"
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
                <p className="mt-1 text-xs text-muted-foreground">via {MODELS[model].name}</p>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-mono font-semibold">
                  {(result.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={result.confidence * 100} className="h-3" />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
