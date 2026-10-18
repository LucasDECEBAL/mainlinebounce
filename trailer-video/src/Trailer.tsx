import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Series,
  getStaticFiles,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Poppins";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700", "800", "900"],
  subsets: ["latin"],
});

/* ============================================
   COULEURS & TIMING
   ============================================ */
const COLORS = {
  pink: "#f56a9b",
  pinkDark: "#e8528a",
  orange: "#f5944a",
  yellow: "#ffd93d",
  dark: "#2d2b3a",
  pale: "#fff0f5",
};

const DURATIONS = {
  logo: 90,
  hero: 108,
  magic: 87,
  superHero: 87,
  water: 96,
  slip: 84,
  family: 108,
  packages: 90,
  cta: 150,
};

export const TOTAL_FRAMES = Object.values(DURATIONS).reduce((a, b) => a + b, 0);

type SceneProps = { vertical: boolean };

const useUnit = () => {
  const { width } = useVideoConfig();
  return width / 100;
};

/* ============================================
   SCÈNE FOND PHOTO (Ken Burns)
   ============================================ */
const PhotoScene: React.FC<{
  src: string;
  children: React.ReactNode;
  veil?: "dark" | "light" | "none";
}> = ({ src, children, veil = "dark" }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [1.05, 1.18]);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
        }}
      />
      {veil !== "none" && (
        <AbsoluteFill
          style={{
            background:
              veil === "dark"
                ? "linear-gradient(180deg, rgba(20,18,28,.25) 0%, rgba(20,18,28,.6) 100%)"
                : "linear-gradient(180deg, rgba(20,18,28,.1) 0%, rgba(20,18,28,.4) 100%)",
          }}
        />
      )}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 18,
          padding: 60,
          textAlign: "center",
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ============================================
   ÉMOJI FLOTTANT
   ============================================ */
const Floaty: React.FC<{
  emoji: string;
  x: string;
  y: string;
  size: number;
  delay?: number;
  rotate?: number;
}> = ({ emoji, x, y, size, delay = 0, rotate = 8 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = useUnit();
  const appear = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const t = frame / fps;

  return (
    <span
      style={{
        position: "absolute",
        left: x,
        top: y,
        fontSize: size * u,
        transform: `translateY(${Math.sin(t * 1.6 + delay) * 16}px) rotate(${
          Math.sin(t * 1.2 + delay) * rotate
        }deg) scale(${appear})`,
        opacity: appear,
        pointerEvents: "none",
      }}
    >
      {emoji}
    </span>
  );
};

/* ============================================
   SCÈNE 1 — LOGO
   ============================================ */
const LogoScene: React.FC<SceneProps> = ({ vertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = useUnit();
  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 11, stiffness: 120, mass: 0.8 },
  });
  const taglineIn = interpolate(frame, [50, 66], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const letters = "MAIN LINE BOUNCE".split("");

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 20% 18%, rgba(255,255,255,.18) 0 2%, transparent 2.4%), radial-gradient(circle at 80% 70%, rgba(255,255,255,.15) 0 2.4%, transparent 2.9%), radial-gradient(circle at 62% 14%, rgba(255,255,255,.12) 0 1.5%, transparent 2%), linear-gradient(135deg, #f56a9b 0%, #f5944a 100%)",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 2 * u,
        textAlign: "center",
      }}
    >
      <Img
        src={staticFile("images/logo.png")}
        style={{
          width: vertical ? 34 * u : 19 * u,
          transform: `scale(${0.2 + 0.8 * logoSpring})`,
          filter: `drop-shadow(0 ${1 * u}px ${2 * u}px rgba(0,0,0,.3))`,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          maxWidth: 90 * u,
        }}
      >
        {letters.map((ch, i) => {
          const s = spring({
            frame: Math.max(0, frame - 12 - i * 1.8),
            fps,
            config: { damping: 10, stiffness: 160 },
          });
          return (
            <span
              key={i}
              style={{
                fontFamily,
                fontWeight: 900,
                fontSize: vertical ? 8.5 * u : 7.5 * u,
                color: "#fff",
                textShadow: `0 ${0.5 * u}px ${1.5 * u}px rgba(0,0,0,.35)`,
                display: "inline-block",
                lineHeight: 1.15,
                transform: `translateY(${(1 - s) * -120}px) scale(${
                  0.4 + 0.6 * s
                }) rotate(${(1 - s) * -10}deg)`,
                opacity: Math.min(1, s * 2),
              }}
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          );
        })}
      </div>

      <p
        style={{
          fontFamily,
          fontWeight: 700,
          fontSize: 3.6 * u,
          color: "rgba(255,255,255,.95)",
          margin: 0,
          opacity: taglineIn,
          transform: `translateY(${interpolate(taglineIn, [0, 1], [24, 0])}px)`,
        }}
      >
        Your one-stop party rental 🎉
      </p>

      <Floaty emoji="🎈" x="9%" y="10%" size={7 * u} delay={18} />
      <Floaty emoji="🎈" x="86%" y="14%" size={6 * u} delay={26} />
      <Floaty emoji="⭐" x="14%" y="78%" size={5 * u} delay={34} />
      <Floaty emoji="🎉" x="84%" y="76%" size={6 * u} delay={40} />
    </AbsoluteFill>
  );
};

/* ============================================
   SCÈNE 2 — HERO "BOUNCE!"
   ============================================ */
const HeroScene: React.FC<SceneProps> = ({ vertical }) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const kickerIn = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bounceY = -Math.abs(Math.sin(frame / 9)) * 1.8 * u;

  return (
    <PhotoScene src="images/hero-kids.jpg">
      <p
        style={{
          fontFamily,
          fontWeight: 700,
          fontSize: 4.5 * u,
          color: "#fff",
          margin: 0,
          textShadow: `0 ${0.4 * u}px ${1.2 * u}px rgba(0,0,0,.5)`,
          opacity: kickerIn,
          transform: `translateY(${(1 - kickerIn) * 30}px)`,
        }}
      >
        Get ready to…
      </p>
      <h2
        style={{
          fontFamily,
          fontWeight: 900,
          fontSize: (vertical ? 13 : 14) * u,
          color: COLORS.yellow,
          margin: 0,
          lineHeight: 1,
          textTransform: "uppercase",
          textShadow: `0 ${0.7 * u}px ${2.2 * u}px rgba(0,0,0,.55)`,
          transform: `translateY(${bounceY}px)`,
        }}
      >
        BOUNCE!
      </h2>
    </PhotoScene>
  );
};

/* ============================================
   SCÈNE PRODUIT (split image + texte)
   ============================================ */
const ProductScene: React.FC<
  SceneProps & {
    img: string;
    title: string;
    titleColor: string;
    price?: string;
    sub?: string;
    subColor?: string;
    reverse?: boolean;
    bg: string;
    tilt?: number;
    floaties?: { emoji: string; x: string; y: string; size: number; delay: number }[];
  }
> = ({
  vertical,
  img,
  title,
  titleColor,
  price,
  sub,
  subColor = COLORS.dark,
  reverse = false,
  bg,
  tilt = -3,
  floaties = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = useUnit();

  const pop = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 110, mass: 0.8 },
  });
  const slide = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: { damping: 13, stiffness: 95 },
  });
  const dir = reverse ? -1 : 1;

  return (
    <AbsoluteFill
      style={{
        background: bg,
        display: "flex",
        flexDirection: vertical ? "column" : reverse ? "row-reverse" : "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4 * u,
        padding: vertical ? "7% 7%" : "5% 6%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: vertical ? undefined : 1.1,
          height: vertical ? "52%" : "100%",
          width: vertical ? "100%" : undefined,
          maxHeight: vertical ? undefined : "100%",
          background: "rgba(255,255,255,.7)",
          borderRadius: 4 * u,
          boxShadow: `0 ${2 * u}px ${5 * u}px rgba(0,0,0,.15)`,
          padding: 3 * u,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${0.3 + 0.7 * pop}) rotate(${(1 - pop) * 8}deg)`,
          opacity: Math.min(1, pop * 2),
        }}
      >
        <Img
          src={staticFile(img)}
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
        />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: vertical ? "center" : reverse ? "flex-end" : "flex-start",
          justifyContent: "flex-start",
          textAlign: vertical ? "center" : reverse ? "right" : "left",
          gap: 2.5 * u,
          opacity: Math.min(1, slide * 1.2),
          transform: `translateX(${(1 - slide) * dir * 380}px)`,
        }}
      >
        <h2
          style={{
            fontFamily,
            fontWeight: 900,
            fontSize: (vertical ? 8.5 : 7.5) * u,
            color: titleColor,
            margin: 0,
            lineHeight: 1.05,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </h2>

        {price && (
          <span
            style={{
              display: "inline-block",
              background: COLORS.pink,
              color: "#fff",
              fontFamily,
              fontWeight: 900,
              fontSize: 6.5 * u,
              padding: `${1 * u}px ${3.5 * u}px`,
              borderRadius: 3 * u,
              transform: `rotate(${tilt}deg)`,
              boxShadow: `0 ${0.8 * u}px 0 ${COLORS.pinkDark}, 0 ${
                1.5 * u
              }px ${3 * u}px rgba(0,0,0,.25)`,
            }}
          >
            {price}
          </span>
        )}

        {sub && (
          <p
            style={{
              fontFamily,
              fontWeight: 700,
              fontSize: 3.4 * u,
              color: subColor,
              margin: 0,
              lineHeight: 1.35,
              whiteSpace: "pre-line",
            }}
          >
            {sub}
          </p>
        )}
      </div>

      {floaties.map((f, i) => (
        <Floaty key={i} {...f} />
      ))}
    </AbsoluteFill>
  );
};

/* ============================================
   SCÈNE 7 — FAMILLE
   ============================================ */
const FamilyScene: React.FC<SceneProps> = ({ vertical }) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const in1 = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <PhotoScene src="images/family.jpg">
      <h2
        style={{
          fontFamily,
          fontWeight: 900,
          fontSize: (vertical ? 9 : 8) * u,
          color: "#fff",
          margin: 0,
          textTransform: "uppercase",
          lineHeight: 1.1,
          textShadow: `0 ${0.6 * u}px ${2 * u}px rgba(0,0,0,.5)`,
          opacity: in1,
          transform: `scale(${0.85 + 0.15 * in1})`,
        }}
      >
        Made for memories
      </h2>
      <p
        style={{
          fontFamily,
          fontWeight: 600,
          fontSize: 3.4 * u,
          color: "rgba(255,255,255,.95)",
          margin: 0,
          textShadow: `0 ${0.4 * u}px ${1.2 * u}px rgba(0,0,0,.5)`,
          opacity: interpolate(frame, [18, 34], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Birthdays • Schools • Family parties
      </p>
      <Floaty emoji="💛" x="82%" y="16%" size={6 * u} delay={20} />
    </PhotoScene>
  );
};

/* ============================================
   SCÈNE 9 — CTA + CONFETTIS
   ============================================ */
const CONFETTI_COLORS = [
  COLORS.pink,
  COLORS.yellow,
  COLORS.orange,
  "#4ec3f7",
  "#ffffff",
  "#a0e57c",
];

type Particle = {
  x0: number;
  y0: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
};

const CtaScene: React.FC<SceneProps> = ({ vertical }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const u = width / 100;

  const logo = spring({ frame, fps, config: { damping: 11, stiffness: 110 } });
  const title = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 12, stiffness: 120 },
  });
  const phone = spring({
    frame: Math.max(0, frame - 16),
    fps,
    config: { damping: 12, stiffness: 140 },
  });
  const weatherIn = interpolate(frame, [44, 64], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 140 }, (_, i) => ({
      x0: 0.5 + (random(`x${i}`) - 0.5) * 0.75,
      y0: 0.35 + (random(`y${i}`) - 0.5) * 0.2,
      vx: (random(`vx${i}`) - 0.5) * 900,
      vy: -(400 + random(`vy${i}`) * 700),
      size: 10 + random(`s${i}`) * 16,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rot: random(`r${i}`) * 360,
      vr: (random(`vr${i}`) - 0.5) * 720,
    }));
  }, []);

  const spawnFrame = 20;
  const t = Math.max(0, frame - spawnFrame) / fps;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #f56a9b 0%, #f5944a 100%)",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 3 * u,
        textAlign: "center",
        padding: 40,
        overflow: "hidden",
      }}
    >
      {particles.map((p, i) => {
        const x = p.x0 * width + p.vx * t;
        const y = p.y0 * height + p.vy * t + 0.5 * 900 * t * t;
        const opacity = interpolate(
          frame,
          [spawnFrame, spawnFrame + 6, durationInFrames - 24, durationInFrames - 6],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        if (frame < spawnFrame) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: p.size,
              height: p.size * 0.45,
              background: p.color,
              borderRadius: 2,
              transform: `rotate(${p.rot + p.vr * t}deg)`,
              opacity,
            }}
          />
        );
      })}

      <Img
        src={staticFile("images/logo.png")}
        style={{
          width: (vertical ? 26 : 14) * u,
          transform: `scale(${0.2 + 0.8 * logo})`,
          filter: `drop-shadow(0 ${1 * u}px ${2 * u}px rgba(0,0,0,.3))`,
        }}
      />

      <h2
        style={{
          fontFamily,
          fontWeight: 900,
          fontSize: (vertical ? 10.5 : 8.5) * u,
          color: "#fff",
          margin: 0,
          lineHeight: 1.05,
          textTransform: "uppercase",
          textShadow: `0 ${0.7 * u}px ${2.4 * u}px rgba(0,0,0,.35)`,
          transform: `scale(${0.5 + 0.5 * title})`,
          opacity: title,
        }}
      >
        Book your party now!
      </h2>

      <div
        style={{
          background: COLORS.yellow,
          color: COLORS.dark,
          fontFamily,
          fontWeight: 900,
          fontSize: (vertical ? 6.5 : 5) * u,
          padding: `${1.4 * u}px ${4.5 * u}px`,
          borderRadius: 5 * u,
          boxShadow: `0 ${0.9 * u}px 0 #e6b800, 0 ${1.6 * u}px ${
            3 * u
          }px rgba(0,0,0,.25)`,
          transform: `scale(${0.5 + 0.5 * phone}) rotate(-1.5deg)`,
          opacity: phone,
        }}
      >
        📞 (267) 405-3125
      </div>

      <p
        style={{
          fontFamily,
          fontWeight: 700,
          fontSize: 3.2 * u,
          color: "#fff",
          margin: 0,
          textShadow: `0 ${0.4 * u}px ${1.2 * u}px rgba(0,0,0,.3)`,
          opacity: weatherIn,
          transform: `translateY(${(1 - weatherIn) * 24}px)`,
        }}
      >
        Bad weather? We reschedule or refund ✅
      </p>
    </AbsoluteFill>
  );
};

/* ============================================
   ASSEMBLAGE
   ============================================ */
export const Trailer: React.FC<{ vertical: boolean }> = ({ vertical }) => {
  const files = getStaticFiles();
  const hasMusic = files.some((f) => f.name === "music.mp3");

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily }}>
      {hasMusic && <Audio src={staticFile("music.mp3")} volume={0.6} />}

      <Series>
        <Series.Sequence durationInFrames={DURATIONS.logo}>
          <LogoScene vertical={vertical} />
        </Series.Sequence>

        <Series.Sequence durationInFrames={DURATIONS.hero}>
          <HeroScene vertical={vertical} />
        </Series.Sequence>

        <Series.Sequence durationInFrames={DURATIONS.magic}>
          <ProductScene
            vertical={vertical}
            img="images/magic-castle.png"
            title="Magic Castle"
            titleColor={COLORS.pink}
            price="$299"
            bg="linear-gradient(120deg, #fff5f8 0%, #ffe8d4 100%)"
            tilt={-3}
            floaties={[
              { emoji: "✨", x: "7%", y: "12%", size: 5, delay: 14 },
              { emoji: "🏰", x: "84%", y: "74%", size: 7, delay: 22 },
            ]}
          />
        </Series.Sequence>

        <Series.Sequence durationInFrames={DURATIONS.superHero}>
          <ProductScene
            vertical={vertical}
            img="images/superhero-combo.png"
            title="Super Hero Duo Combo"
            titleColor={COLORS.orange}
            price="$349"
            reverse
            bg="linear-gradient(120deg, #fff9e6 0%, #ffe9f2 100%)"
            tilt={3}
            floaties={[
              { emoji: "💥", x: "84%", y: "12%", size: 6, delay: 14 },
              { emoji: "🦸", x: "7%", y: "72%", size: 7, delay: 22 },
            ]}
          />
        </Series.Sequence>

        <Series.Sequence durationInFrames={DURATIONS.water}>
          <ProductScene
            vertical={vertical}
            img="images/dolphin-slide.png"
            title="Water Slide"
            titleColor={COLORS.pink}
            price="$399"
            sub="💦 SPLASH INTO SUMMER 💦"
            subColor={COLORS.orange}
            bg="linear-gradient(120deg, #eaf7ff 0%, #fff0f5 100%)"
            tilt={-3}
            floaties={[
              { emoji: "💧", x: "8%", y: "16%", size: 6, delay: 12 },
              { emoji: "🌊", x: "83%", y: "72%", size: 7, delay: 20 },
            ]}
          />
        </Series.Sequence>

        <Series.Sequence durationInFrames={DURATIONS.slip}>
          <ProductScene
            vertical={vertical}
            img="images/slip-and-slide.png"
            title="Slip 'n Slide!"
            titleColor={COLORS.pink}
            reverse
            sub="The wetter, the better 😎"
            bg="linear-gradient(120deg, #fffbe6 0%, #eaf7ff 100%)"
            floaties={[
              { emoji: "💦", x: "84%", y: "14%", size: 6, delay: 10 },
            ]}
          />
        </Series.Sequence>

        <Series.Sequence durationInFrames={DURATIONS.family}>
          <FamilyScene vertical={vertical} />
        </Series.Sequence>

        <Series.Sequence durationInFrames={DURATIONS.packages}>
          <ProductScene
            vertical={vertical}
            img="images/magic-castle-superhero-combo.png"
            title="Party Packages"
            titleColor={COLORS.pink}
            sub={"Inflatables + tents + tables + chairs…\neverything for the perfect party!"}
            bg="linear-gradient(120deg, #fff5f8 0%, #ffe8d4 100%)"
            floaties={[
              { emoji: "🎁", x: "85%", y: "14%", size: 6, delay: 14 },
            ]}
          />
        </Series.Sequence>

        <Series.Sequence durationInFrames={DURATIONS.cta}>
          <CtaScene vertical={vertical} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
