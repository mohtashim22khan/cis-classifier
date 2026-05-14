import { Classifier } from "@/components/Classifier";
import { Sparkles } from "lucide-react";
import hero from "@/assets/hero.png";

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      {/* Decorative background blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full opacity-40 blur-3xl"
             style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute -right-40 top-40 h-[28rem] w-[28rem] rounded-full opacity-30 blur-3xl"
             style={{ background: "var(--gradient-accent)" }} />
      </div>

      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="rounded-xl p-2 text-primary-foreground shadow-[var(--shadow-soft)]"
               style={{ background: "var(--gradient-hero)" }}>
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">CIS Vision</span>
        </div>
        <span className="rounded-full border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
        3 trained models
        </span>
      </header>

      <main className="container mx-auto px-6 pb-20">
        <section className="grid items-center gap-10 py-10 md:grid-cols-2 md:py-16">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Department-based recognition
            </span>
            <h1 className="mt-4 text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Is it{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-hero)" }}>
                CIS
              </span>
              <br />or not?
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Drop an image, pick a model, and let our trained classifiers do the rest.
              Friendly, fast, and built for experimentation.
            </p>
          </div>
          <div className="flex justify-center md:justify-end">
            <img
              src={hero}
              alt="AI classification illustration"
              width={1024}
              height={1024}
              className="h-72 w-72 object-contain drop-shadow-2xl md:h-96 md:w-96"
            />
          </div>
        </section>

        <section id="classify" className="scroll-mt-10">
          <Classifier />
        </section>

        <footer className="relative mt-24 overflow-hidden rounded-3xl p-[2px] shadow-[var(--shadow-soft)]"
                style={{ background: "var(--gradient-hero)" }}>
          <div className="rounded-[calc(1.5rem-2px)] bg-card/80 px-8 py-10 backdrop-blur">
            <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl p-2.5 text-primary-foreground shadow-[var(--shadow-glow)]"
                     style={{ background: "var(--gradient-hero)" }}>
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-base font-bold tracking-tight">CIS Vision</p>
                  <p className="text-xs text-muted-foreground">Built for experimentation</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-full px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm"
                      style={{ background: "var(--gradient-hero)" }}>
                  MobileNetV2
                </span>
                <span className="rounded-full px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm"
                      style={{ background: "var(--gradient-accent)" }}>
                  EfficientNet-B3
                </span>
                <span className="rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
                      style={{ background: "linear-gradient(135deg, oklch(0.72 0.18 155), oklch(0.62 0.2 175))", color: "white" }}>
                  Vision Transformer
                </span>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl p-4 text-white shadow-[var(--shadow-soft)]"
                   style={{ background: "linear-gradient(135deg, oklch(0.78 0.18 340), oklch(0.66 0.22 320))" }}>
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs opacity-90">Trained models</p>
              </div>
              <div className="rounded-2xl p-4 text-white shadow-[var(--shadow-soft)]"
                   style={{ background: "linear-gradient(135deg, oklch(0.82 0.17 80), oklch(0.7 0.2 30))" }}>
                <p className="text-2xl font-bold">93.2%</p>
                <p className="text-xs opacity-90">Best accuracy</p>
              </div>
              <div className="rounded-2xl p-4 text-white shadow-[var(--shadow-soft)]"
                   style={{ background: "linear-gradient(135deg, oklch(0.72 0.18 155), oklch(0.62 0.2 260))" }}>
                <p className="text-2xl font-bold">∞</p>
                <p className="text-xs opacity-90">Images to classify</p>
              </div>
            </div>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              Inference powered by custom models. Confidence scores indicate model certainty, not absolute accuracy.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
