import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const CAT_CENTER = {
  x: 0.5,
  y: 0.67,
};

// Weekly Avg DAU — 10 most recent months (Aug 2025 → Jun 2026). Edit freely.
// `note` adds an annotation label above a bar.
const MATTLE_DAU = [
  { week: "2025-08-04", dau: 1028 },
  { week: "2025-08-11", dau: 938 },
  { week: "2025-08-18", dau: 1129 },
  { week: "2025-08-25", dau: 1177 },
  { week: "2025-09-01", dau: 1342, note: "growth start" },
  { week: "2025-09-08", dau: 1874 },
  { week: "2025-09-15", dau: 2029 },
  { week: "2025-09-22", dau: 2149 },
  { week: "2025-09-29", dau: 2349 },
  { week: "2025-10-06", dau: 3010 },
  { week: "2025-10-13", dau: 3201, note: "PEAK" },
  { week: "2025-10-20", dau: 2462 },
  { week: "2025-10-27", dau: 2594 },
  { week: "2025-11-03", dau: 2675 },
  { week: "2025-11-10", dau: 2441 },
  { week: "2025-11-17", dau: 1917, note: "decline" },
  { week: "2025-11-24", dau: 1812 },
  { week: "2025-12-01", dau: 1856 },
  { week: "2025-12-08", dau: 1825 },
  { week: "2025-12-15", dau: 1699 },
  { week: "2025-12-22", dau: 1711 },
  { week: "2025-12-29", dau: 1601 },
  { week: "2026-01-05", dau: 1723 },
  { week: "2026-01-12", dau: 3422, note: "SPIKE (event)" },
  { week: "2026-01-19", dau: 2998 },
  { week: "2026-01-26", dau: 2966 },
  { week: "2026-02-02", dau: 2719 },
  { week: "2026-02-09", dau: 2789 },
  { week: "2026-02-16", dau: 2492 },
  { week: "2026-02-23", dau: 2311 },
  { week: "2026-03-02", dau: 2105 },
  { week: "2026-03-09", dau: 2052 },
  { week: "2026-03-16", dau: 1867, note: "steady decline" },
  { week: "2026-03-23", dau: 1811 },
  { week: "2026-03-30", dau: 1691 },
  { week: "2026-04-06", dau: 1635 },
  { week: "2026-04-13", dau: 1486 },
  { week: "2026-04-20", dau: 1401 },
  { week: "2026-04-27", dau: 1331 },
  { week: "2026-05-04", dau: 1246 },
  { week: "2026-05-11", dau: 1178 },
  { week: "2026-05-18", dau: 1096 },
  { week: "2026-05-25", dau: 1000 },
  { week: "2026-06-01", dau: 927, partial: true },
];

// Daily Impressions series — one value per day from 2025-06-08 to ~now (365
// days). Representative shape recreated from the X analytics screenshot; replace
// the numbers with real daily values anytime. Generated deterministically
// (seeded) so it's stable across renders. Index 0 = MATTLE_IMPRESSIONS_START.
const MATTLE_IMPRESSIONS_START = "2025-06-08";
const MATTLE_IMPRESSIONS = (() => {
  let seed = 20260607;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const N = 365;
  const v = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const env = Math.exp(-Math.pow((t - 0.5) / 0.22, 2)); // active Aug→Feb window
    let x = 800 + rnd() * (2500 + env * 9000);
    if (rnd() < 0.04 + env * 0.1) x += rnd() * (22000 + env * 45000);
    v.push(Math.round(x));
  }
  const set = (i, val) => {
    if (i >= 0 && i < N) v[i] = val;
  };
  set(120, 182000); // ~Oct 2025 ~180K spike
  set(121, 58000);
  set(204, 98000);
  set(205, 190000);
  set(206, 380000); // ~Dec 2025 peak
  set(207, 95000);
  set(300, 85000); // post-Feb tapering spikes
  set(330, 80000);
  set(350, 64000);
  return v;
})();

// Portfolio stacking cards. Edit/extend freely — the effect adapts to the
// number of cards. Each card is a single tall panel you scroll through.
const PORTFOLIO_CARDS = [
  {
    title: "Boltrade.ai - Marketing Co-founder",
    accent: "bg-zinc-800",
    banner: "/Boltrade-banner.png",
    // 4 sequences for the branding story clause.
    brandingSequences: [
      // Sequence 1 — ideas & references
      [
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/First-sequence/image%20109%20(1).png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/First-sequence/image%20110.png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/First-sequence/image%20111%20(2).png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/First-sequence/image%20112%20(1).png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/First-sequence/image%20117%20(2).png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/First-sequence/image%205%20(2).png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/First-sequence/image%2073%20(1).png",
      ],
      // Sequence 2 — memes & cosmic
      [
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Second-sequence/web/Cover%20(2)%202.png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Second-sequence/web/Cover%20(2)%204.png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Second-sequence/image%2022%20(1).png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Second-sequence/image%205%20(1).png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Second-sequence/image%206%20(1).png",
      ],
      // Sequence 3 — mascot
      [
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Third-sequence/panel_1_top_left_web.jpg",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Third-sequence/panel_2_top_right_web.jpg",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Third-sequence/panel_3_bottom_left_web.jpg",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Third-sequence/panel_4_bottom_right_web.jpg",
      ],
      // Sequence 4 — hope
      [
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Forth-sequence/chalker99_httpss.mj.runDW_U8DvCyPw_A_vibrant_and_dynamic_bann_40eda56b-3bbb-406c-9c09-1052b11d92d4_3%20(1).png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Forth-sequence/chalker99_httpss.mj.runDW_U8DvCyPw_A_vibrant_and_dynamic_bann_f199e54b-67d2-429d-8bcc-ca193fdd1e45_0%20(3).png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Forth-sequence/chalker99_httpss.mj.runDW_U8DvCyPw_A_vibrant_and_dynamic_bann_f199e54b-67d2-429d-8bcc-ca193fdd1e45_2%20(1).png",
        "/Boltrade-ai/Branding/Visual-branding/BrandingImages/Forth-sequence/chalker99_httpss.mj.runaUGjk6c_tBU_A_colorful_and_energetic_b_1990bedb-c23a-4513-b1e8-fd21eb91da4e_2%20(2).png",
      ],
    ],
    // ── VISUAL BRANDING story text (edit these words freely) ──
    brandingWords: {
      a: "From ideas", // before sequence 1 & 2
      b: "to", // end of line 1
      c: "a mascot", // start of line 2
      d: "of hope", // between sequence 3 & 4
    },
    // Paragraph ABOVE the marquee (news bar).
    brandingText1:
      "Identified that our target users are meme-ors, degens, high-tech driven, ape, we did competitor audit and meme audit to find the same patterns representing them. We chose to make a clock mascot, and ended up with a Cat Clock. The key visual is crafted with AI but well-driven based on moodboard, style, archetype, color, and domain.  ",

    // Performance Campaigns — checkpoint timeline.
    campaigns: [
      {
        title: "Reputation building",
        points: [
          'SEO optimization using "meme tickers" — everyday, every trend we post.',
          "Real usecases to solve pain points and greed activation.",
        ],
        images: [
          "/Boltrade-ai/Performance-campaign/Checkpoint-1/AD_4nXc6ahTjvbGgoBBET4W5ptXJaVsSSQwL0lU53yyEYzKtwpDMjQZD3kHGtfBCpqy3kD7y9UyqRyo91aNqylv4w6Jt-8Jzn32dLclHrIvxeiX_Nf5ezvmMQaQhEkM5F3Uzc8pHxwMkbw.png",
          "/Boltrade-ai/Performance-campaign/Checkpoint-1/AD_4nXdi7mJwj9qLJktH6-e62s0ggg-CQdT6StnhATHWhu06_ORK40SWjr5NnjIRd4fS61YgQgx2Jhw75j28gk_Gzo0mWd3k2vfjBgHblXRud_GV6Ls6pwjICk7yg4G0rSaeG3I7F5Dfag%20(1).png",
          "/Boltrade-ai/Performance-campaign/Checkpoint-1/AD_4nXfQBnXRqsrisTkB0mGZX6oxNo3HrXuAeEd1YzXg26QMiAHuvfqghQAe6bhBJaN_Yihc_74S3PXZgrvbMOXWjwDanW60PdSQbwPFckAzHDVh_fd8980VYU1wmrJQ83IEZwGCMS7vNw.png",
        ],
        paragraph:
          "In this phase, building trust and getting out of hell elo is everything. We focus on selling a wealth-making dream for people using signals and proofs of constant wins. In result, we got out of <1000 views hell elo.",
      },
      {
        title: "Hackathon",
        points: [
          "Introduction of C.A.T as the engine behind the magic.",
          "Convert the previous reputation and traffic into fans with branding visuals and contents.",
        ],
        images: [
          {
            src: "/Boltrade-ai/Performance-campaign/Checkpoint-2/20260409-223226.jpeg",
            width: "5vw",
          },
          "/Boltrade-ai/Performance-campaign/Checkpoint-2/Screenshot-2025-05-31-at-15.49.44.png",
          "/Boltrade-ai/Performance-campaign/Checkpoint-2/Solana-AI-Hackathon.jpg",
        ],
        paragraph:
          "This phase, it takes trials to farm traffic and leverage as much as possible. This phase also loops people in a content format and an emotional attachment. This phase, our traffic rose to 10k plus per post. Hackathon is a REALLY GREAT way to gain external traction, prepare for amplification.",
      },
      {
        title: "Token launch",
        points: [
          "Mostly timing.",
          "Measurement of traction to launch.",
        ],
        images: [
          "/Boltrade-ai/Performance-campaign/Checkpoint-3/Phase-1_-80-1.png",
          "/Boltrade-ai/Performance-campaign/Checkpoint-3/Phase-2_-90%20(1).png",
          "/Boltrade-ai/Performance-campaign/Checkpoint-3/Screenshot-2025-05-31-at-15.27.05.png",
        ],
        paragraph:
          "In this phase, when everyone is familiar to the content format, loop them in an emotional oppression, like a spring, optimize distribution channels with several obtainable partners as well!",
      },
    ],

    // ── VOICE BRANDING story (its OWN text + images) ──
    // Edit the words below, and drop images into the matching folders under
    // public/Boltrade-ai/Branding/Voice-branding/Sequence-1 … Sequence-4,
    // then add their paths to each array (encode spaces as %20).
    voiceWords: {
      a: "From posting proofs",
      b: "to",
      c: "a hope culture",
      d: "",
    },
    voiceSequences: [
      [
        "/Boltrade-ai/Branding/Voice-branding/Sequence-1/20260409-221658.png",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-1/20260409-223340.png",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-1/20260409-230501.png",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-1/20260409-230620.png",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-1/20260606-032020.png",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-1/Frame%201597880590.png",
      ],
      [
        "/Boltrade-ai/Branding/Voice-branding/Sequence-2/20260409-222330.png",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-2/20260409-222507.png",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-2/20260409-230501.png",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-2/20260606-023737.jpeg",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-2/AD_4nXdi7mJwj9qLJktH6-e62s0ggg-CQdT6StnhATHWhu06_ORK40SWjr5NnjIRd4fS61YgQgx2Jhw75j28gk_Gzo0mWd3k2vfjBgHblXRud_GV6Ls6pwjICk7yg4G0rSaeG3I7F5Dfag.png",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-2/AD_4nXfQBnXRqsrisTkB0mGZX6oxNo3HrXuAeEd1YzXg26QMiAHuvfqghQAe6bhBJaN_Yihc_74S3PXZgrvbMOXWjwDanW60PdSQbwPFckAzHDVh_fd8980VYU1wmrJQ83IEZwGCMS7vNw%20(1).png",
      ],
      [
        "/Boltrade-ai/Branding/Voice-branding/Sequence-3/20260409-222834.png",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-3/20260409-223419.jpeg",
        "/Boltrade-ai/Branding/Voice-branding/Sequence-3/Phase-2_-90.png",
      ],
    ],
    // Paragraph under the Voice Branding story.
    voiceText1:
      "For voice branding, the story is the same. We identified the correct audience, take reference from more than 10 projects doing in memes, trading bot, terminal. Initially, we dug into X algorithm code to find the optimized SEO strategy, provided posts that actually HELP - providing signals with proofs to gain ourselves traction, moving out of the traffic hell. We then run our campaigns with stronger emotional branding, running people and traffic into our emotion loop with unique content format, important milestones, and an oppression strategy.",

    // News-bar marquee images (run continuously under the branding story).
    loopImages: [
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/AVA%201.png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/BOL%206%20(1).png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/BOL%20NOT%20KAME%202%201%20(1).png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/Frame%201597880583%20(1).png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/Frame%201597880586%20(1).png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/Frame%201597880622%20(1).png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/Frame%205.png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/MOTION%20BOL%2010%20(1).png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/MOTION%20BOL%2014.png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/MOTION%20BOL%2017%20(1).png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/MOTION%20BOL%205%20(1).png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/MOTION%20BOL%207%20(1).png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/MOTION%20BOL%208%20(1).png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/MOTION%20BOL%209%20(1).png",
      "/Boltrade-ai/Branding/Visual-branding/Loop%20lines/web/%7B5BFB6F3D-0BB4-4BCF-96EF-ACE4E2257F3C%7D%201.png",
    ],
    desc: "Short description of the work and the outcome it drove.",
    context: (
      <>
        Boltrade was{" "}
        <span className="font-semibold text-emerald-300">
          initially a meme signal tool
        </span>
        , made by scraping smart wallets and identify abnormal activities. At
        the time, it was blended among massive wave of trading bots, buried in
        the traffic hell, having no identity and worst, having no idea how to
        market a finished product. Late 2024 and early 2025, everyone was
        craving for AI Agents, and I think I found{" "}
        <span className="font-semibold text-emerald-300">
          that "HOPE"! I changed the entire project into Trading AI-Agent, into hope
        </span>
        , creating an identity for it, and the rest is history. We made it to
        the top of Solana for a day, with a{" "}
        <span className="font-semibold text-white underline decoration-emerald-400 decoration-[3px] underline-offset-[6px]">
          $0 budget.
        </span>
      </>
    ),
    achievementsText: (
      <ul className="max-w-4xl list-disc space-y-14 pl-8 text-2xl leading-loose text-white/70 marker:text-emerald-400">
        <li>
          Top #1 Trending Token status on Dexscreener and Bullx_io, driving
          $110M+ trading volume in 24 hours.
        </li>
        <li>
          Oversaw the successful listing of C.A.T tokens (powered by the
          Boltrade platform) on major exchanges, including KCEX, XT Exchange,
          LBank, BitMart, Gate.io, MEXC, and CoinEx, and on platforms such as
          CoinMarketCap with zero listing budget.
        </li>
        <li>
          Virtuals.io reached out, twice to convince us to launch on them, 10+ tier 2 KOLs everywhere speaks about us, free.
        </li>
      </ul>
    ),
    achievementsImages: [
      "/Boltrade-ai/Achievements/1.jpg",
      "/Boltrade-ai/Achievements/2.jpeg",
      "/Boltrade-ai/Achievements/3.jpg",
      "/Boltrade-ai/Achievements/Gate-MEXC.png",
      "/Boltrade-ai/Achievements/Screenshot-2025-05-31-at-15.42.43.png",
      "/Boltrade-ai/Achievements/Screenshot-2025-05-31-at-15.42.49.png",
      "/Boltrade-ai/Achievements/Screenshot-2025-05-31-at-15.42.59.png",
      "/Boltrade-ai/Achievements/Screenshot-2025-05-31-at-15.43.13.png",
      "/Boltrade-ai/Achievements/Screenshot-2025-05-31-at-15.43.59.png",
    ],
    achievements: [
      { value: "1M+", caption: "Impressions on X within a single week" },
      { value: "26K+", caption: "Active users generated in 30 days" },
      { value: "$110M+", caption: "Day one trading volume w/o MMs or CEXes" },
      { value: "2nd", caption: "Runner up of SendAI Solana Hackathon" },
    ],
  },
  {
    title: "Mattle.fun - Business Co-founder",
    accent: "bg-zinc-800",
    banner: "/Mattlefun-banner.jpeg",
    desc: "Short description of the work and the outcome it drove.",
    context: (
      <>
        Mattle.fun was{" "}
        <span className="font-semibold text-emerald-300">
          initially a Play-to-earn pixel game that has a trading engine
        </span>
        . It has a good presence in the Solana community but from April to
        September, no significant traffic comes in, no way to launch, no
        interest from any VCs/entities. The market was misarable at the time I
        joined, so I decided to sell it to big players,{" "}
        <span className="font-semibold text-emerald-300">
          {`changed it to "gamified trading platform"`}
        </span>
        , and guess what, Solana Mobile, Legion, Dev.fun, Pump.fun came to us
        with offers. All of that because I{" "}
        <span className="font-semibold text-white underline decoration-emerald-400 decoration-[3px] underline-offset-[6px]">
          leveraged the winning of the hackathon, and tweaked the communication
          a little to give some hope!
        </span>
      </>
    ),

    achievements: [
      { value: "5M+", caption: "Impressions on X throughout 7 months" },
      { value: "46K+", caption: "All-time users on our game" },
      { value: "19%", caption: "Users finished their first match in the game" },
      { value: "1st", caption: "Winner of Solana Mobile Hackathon" },
    ],
    // Paragraph under the achievements numbers (full width).
    achievementsText: (
      <p className="text-2xl leading-9 text-white/70">
        For voice branding, the story is the same. We identified the correct
        audience, take reference from more than 10 projects doing in memes,
        trading bot, terminal. Initially, we dug into X algorithm code to find
        the optimized SEO strategy, provided posts that actually HELP - providing
        signals with proofs to gain ourselves traction, moving out of the
        traffic hell. We then run our campaigns with stronger emotional
        branding, running people and traffic into our emotion loop with unique
        content format, important milestones, and an oppression strategy.
      </p>
    ),
    // Weekly Avg DAU chart (Aug 2025 – Jun 2026), shown under the achievements.
    dauData: MATTLE_DAU,
    // Daily Impressions chart, shown under the DAU chart.
    impressionsData: MATTLE_IMPRESSIONS,
  },
  {
    title: "Lora.finance - Business Co-founder",
    accent: "bg-zinc-800",
    banner: "/Lorafinance-banner.jpeg",
    desc: "Short description of the work and the outcome it drove.",
    context:
      'Lora.finance was an idea on "renting convexity" created by my tech co-founder. Initially it took him 2 hours to explain each of members in the team what the product is. It was a nerd-idea having no feasible approach at first. I participated this from the beginning, selling crypto "renting convexity" under "trading with no-liquidation" - a universal hope of all traders. We gained massive traffic, nearly a million views in 2 weeks.  ',

    achievements: [
      { value: "1M+", caption: "Short caption" },
      { value: "26K+", caption: "Short caption" },
      { value: "$110M+", caption: "Short caption" },
      { value: "2nd", caption: "Short caption" },
    ],
  },
  {
    title: "Other projects",
    accent: "bg-zinc-800",
    banner: "/Other-project-banner.png",
    desc: "Short description of the work and the outcome it drove.",
    achievements: [
      { value: "1M+", caption: "Short caption" },
      { value: "26K+", caption: "Short caption" },
      { value: "$110M+", caption: "Short caption" },
      { value: "2nd", caption: "Short caption" },
    ],
  },
];

function pickEyeAsset(dx, dy) {
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 24) {
    return "/cat-eye-top.png";
  }

  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  if (angle >= -150 && angle < -90) {
    return "/cat-eye-top-left.png";
  }

  if (angle >= -90 && angle < -30) {
    return "/cat-eye-top.png";
  }

  if (angle >= -30 && angle < 30) {
    return "/cat-eye-top-right.png";
  }

  if (angle >= 30 && angle < 90) {
    return "/cat-eye-bottom-right.png";
  }

  if (angle >= 90 && angle < 150) {
    return "/cat-eye-bottom.png";
  }

  return "/cat-eye-bottom-left.png";
}

function TypingLogo() {
  const text = "MINH PHAM - SELLING STORY IS OLD. I SELL HOPE.";
  const [displayText, setDisplayText] = useState("");
  const [index, setIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout;

    if (!isDeleting && index < text.length) {
      // Typing forward
      timeout = setTimeout(() => {
        setDisplayText(text.slice(0, index + 1));
        setIndex(index + 1);
      }, index === 0 ? 500 : 65);
    } else if (!isDeleting && index === text.length) {
      // Pause after fully typed
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 2200);
    } else if (isDeleting && index > 0) {
      // Erasing backward
      timeout = setTimeout(() => {
        setDisplayText(text.slice(0, index - 1));
        setIndex(index - 1);
      }, 35);
    } else if (isDeleting && index === 0) {
      // Pause before typing again
      timeout = setTimeout(() => {
        setIsDeleting(false);
      }, 600);
    }

    return () => clearTimeout(timeout);
  }, [index, isDeleting]);

  return (
    <span className="relative inline-flex items-center whitespace-nowrap">
      {/* Invisible full text reserves a fixed footprint so the navbar never
          reflows as the text types and deletes. */}
      <span aria-hidden="true" className="invisible">
        {text}
      </span>
      {/* Animating text + cursor, overlaid so it doesn't affect layout. */}
      <span className="absolute inset-y-0 left-0 flex items-center whitespace-nowrap">
        <span className="text-emerald-300">{displayText}</span>
        <span className="ml-1 h-5 w-[2px] animate-pulse bg-emerald-300" />
      </span>
    </span>
  );
}

const PLACEHOLDER_PARAGRAPH =
  "For voice branding, the story is the same. We identified the correct audience, take reference from more than 10 projects doing in memes, trading bot, terminal. Initially, we dug into X algorithm code to find the optimized SEO strategy, provided posts that actually HELP - providing signals with proofs to gain ourselves traction, moving out of the traffic hell. We then run our campaigns with stronger emotional branding, running people and traffic into our emotion loop with unique content format, important milestones, and an oppression strategy.";

const DEFAULT_ACHIEVEMENTS = [
  { value: "00", caption: "Short caption" },
  { value: "00", caption: "Short caption" },
  { value: "00", caption: "Short caption" },
  { value: "00", caption: "Short caption" },
];

// Horizontal weekly column chart. Bars in [highlightFrom, highlightThrough]
// (by YYYY-MM month) are emphasized in the accent color; the rest are muted.
function DauChart({
  data = [],
  max = 3500,
  highlightFrom = "2025-08",
  highlightThrough = "2026-02",
}) {
  return (
    <div className="w-full">
      <div className="mb-6 flex items-baseline justify-between text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
        <span>Weekly Avg DAU — Aug 2025 → Jun 2026</span>
      </div>
      <div className="flex gap-3">
        {/* Y axis benchmarks */}
        <div className="relative h-[30rem] w-12 shrink-0">
          {[3000, 2000, 1000].map((v) => (
            <span
              key={v}
              className="absolute right-0 translate-y-1/2 text-xs font-medium text-white/40"
              style={{ bottom: `${(v / max) * 100}%` }}
            >
              {v.toLocaleString()}
            </span>
          ))}
        </div>
        {/* Plot */}
        <div className="flex-1">
          <div className="relative h-[30rem]">
            {/* horizontal benchmark gridlines */}
            {[1000, 2000, 3000].map((v) => (
              <div
                key={v}
                className="absolute inset-x-0 border-t border-dashed border-white/10"
                style={{ bottom: `${(v / max) * 100}%` }}
              />
            ))}
            <div className="flex h-full items-end gap-[3px] border-b border-white/15 sm:gap-[5px]">
              {data.map((d) => {
                const month = d.week.slice(0, 7);
                const on = month >= highlightFrom && month <= highlightThrough;
                const h = Math.min(1, d.dau / max) * 100;
                return (
                  <div
                    key={d.week}
                    title={`${d.week}: ${d.dau.toLocaleString()}${d.partial ? " (partial)" : ""}`}
                    className="group relative flex flex-1 items-end"
                    style={{ height: "100%" }}
                  >
                    <div
                      style={{ height: `${h}%` }}
                      className={`w-full rounded-t-[2px] transition-colors ${
                        on
                          ? "bg-emerald-400 group-hover:bg-emerald-300"
                          : "bg-white/25 group-hover:bg-white/40"
                      } ${d.partial ? "opacity-50" : ""}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-3 flex justify-between text-xs font-medium text-white/40">
            <span>Aug ’25</span>
            <span>Nov ’25</span>
            <span>Jan ’26</span>
            <span>Mar ’26</span>
            <span>Jun ’26</span>
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-6 text-sm text-white/55">
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-5 rounded-sm bg-emerald-400" />
          Aug 2025 – Feb 2026
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-5 rounded-sm bg-white/25" />
          Mar 2026 onward
        </span>
      </div>
    </div>
  );
}

// Dense daily Impressions bar chart (X-analytics style). `data` is an array of
// daily impression counts. Y benchmarks default to 95K / 190K / 285K / 380K.
function ImpressionsChart({
  data = [],
  max = 380000,
  benchmarks = [95000, 190000, 285000, 380000],
  startDate = "2025-06-08",
  highlightFrom = "2025-08",
  highlightThrough = "2026-02",
  xLabels = ["Jun ’25", "Aug", "Oct", "Dec", "Feb ’26", "Apr", "Jun ’26"],
}) {
  const fmtK = (v) => `${Math.round(v / 1000)}K`;
  const start = Date.parse(startDate + "T00:00:00Z");
  return (
    <div className="w-full">
      <div className="mb-6 flex items-baseline justify-between text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
        <span>Impressions — Daily (Jun 2025 → Jun 2026)</span>
      </div>
      <div className="flex gap-3">
        {/* Y axis benchmarks */}
        <div className="relative h-[30rem] w-12 shrink-0">
          {benchmarks.map((v) => (
            <span
              key={v}
              className="absolute right-0 translate-y-1/2 text-xs font-medium text-white/40"
              style={{ bottom: `${(v / max) * 100}%` }}
            >
              {fmtK(v)}
            </span>
          ))}
          <span className="absolute bottom-0 right-0 translate-y-1/2 text-xs font-medium text-white/40">
            0
          </span>
        </div>
        {/* Plot */}
        <div className="flex-1">
          <div className="relative h-[30rem]">
            {/* horizontal benchmark gridlines */}
            {benchmarks.map((v) => (
              <div
                key={v}
                className="absolute inset-x-0 border-t border-white/10"
                style={{ bottom: `${(v / max) * 100}%` }}
              />
            ))}
            <div className="flex h-full items-end gap-px border-b border-white/15">
              {data.map((imp, i) => {
                const h = Math.min(1, imp / max) * 100;
                const ym = new Date(start + i * 86400000)
                  .toISOString()
                  .slice(0, 7);
                const on = ym >= highlightFrom && ym <= highlightThrough;
                return (
                  <div
                    key={i}
                    title={`${ym} (day ${i + 1}): ${imp.toLocaleString()} impressions`}
                    className="flex-1"
                    style={{ height: `${h}%` }}
                  >
                    <div
                      className={`h-full w-full transition-colors ${
                        on
                          ? "bg-emerald-400 hover:bg-emerald-300"
                          : "bg-white/25 hover:bg-white/40"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-3 flex justify-between text-xs font-medium text-white/40">
            {xLabels.map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-6 text-sm text-white/55">
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-5 rounded-sm bg-emerald-400" />
          Aug 2025 – Feb 2026
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-5 rounded-sm bg-white/25" />
          Outside Aug 2025 – Feb 2026
        </span>
      </div>
    </div>
  );
}

// Fixed pseudo-random tilt + vertical offset per image, so the gallery looks
// scattered (like tossed photos) but stays stable across renders.
const SCATTER_ROTATE = [
  "-rotate-6",
  "rotate-3",
  "rotate-12",
  "-rotate-3",
  "rotate-6",
  "-rotate-12",
  "rotate-2",
  "-rotate-2",
  "rotate-6",
];
const SCATTER_MT = [
  "mt-0",
  "mt-12",
  "mt-4",
  "mt-20",
  "mt-2",
  "mt-16",
  "mt-8",
  "mt-24",
  "mt-6",
];

// Section heading label.
function SectionLabel({ children }) {
  return (
    <p className="text-base font-semibold uppercase tracking-[0.4em] text-emerald-300">
      {children}
    </p>
  );
}

// A dashed placeholder area to fill with images / content later.
function Placeholder({ label, className = "" }) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl border border-dashed border-white/15 text-center text-sm uppercase tracking-[0.3em] text-white/25 ${className}`}
    >
      {label}
    </div>
  );
}

// Fades its children in (with a slight rise) the first time they scroll into
// view. Used for everything on a card except the title + context.
function FadeIn({ children, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-[1200ms] ease-out ${
        shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}


// A small inline looping image frame — sits inside the branding story text.
function InlineLoop({ images, interval = 600, className = "" }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!images || images.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), interval);
    return () => clearInterval(t);
  }, [images, interval]);

  return (
    <span
      className={`relative mx-8 inline-block overflow-hidden rounded-xl border border-white/15 align-middle shadow-lg ${className}`}
    >
      {(images || []).map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          draggable="false"
          decoding="async"
          className={`absolute inset-0 h-full w-full select-none object-cover ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {(!images || images.length === 0) && (
        <span className="flex h-full w-full items-center justify-center font-mono text-xs uppercase tracking-widest text-white/25">
          seq
        </span>
      )}
    </span>
  );
}

// Wrap every occurrence of the word "hope" in a highlight marker.
function highlightHope(text) {
  if (!text) return text;
  return text.split(/(hope)/gi).map((part, i) =>
    part.toLowerCase() === "hope" ? (
      <span
        key={i}
        className="rounded bg-emerald-400/25 px-2 text-emerald-300"
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
}

// Editorial branding story — large flowing text with inline looping image
// frames punctuating the narrative.
function BrandingStory({
  sequences = [],
  interval = 600,
  words = {},
  joinB = false, // true = "to" leads clause 2 on wrap; false = ends clause 1
}) {
  // Editable text fragments around the sequence frames.
  const {
    a = "From ideas", // before seq 1 & 2
    b = "to", // after seq 2 (end of line 1)
    c = "a mascot", // before seq 3 (start of line 2)
    d = "of hope", // between seq 3 and seq 4
  } = words;
  const [s1 = [], s2 = [], s3 = [], s4 = []] = sequences;

  // Stick the two clauses together on one line; only right-align the second
  // clause once it actually wraps onto its own line. Pure CSS can't do this
  // (auto-margins spread it on one line), so we measure the wrap.
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const [wrapped, setWrapped] = useState(false);
  useEffect(() => {
    const check = () => {
      const a1 = line1Ref.current;
      const a2 = line2Ref.current;
      if (!a1 || !a2) return;
      setWrapped(a2.offsetTop > a1.offsetTop + 2);
    };
    check();
    const t = setTimeout(check, 150);
    window.addEventListener("resize", check);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", check);
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
      <span ref={line1Ref} className="flex items-center whitespace-nowrap">
        <span>{highlightHope(a)}</span>
        <InlineLoop images={s1} interval={interval} className="h-[9vw] w-[13.5vw] -rotate-6" />
        <InlineLoop images={s2} interval={interval} className="-ml-[4vw] h-[9vw] w-[13.5vw] rotate-3" />
        {!joinB && <span>{highlightHope(b)}</span>}
      </span>
      <span
        ref={line2Ref}
        className={`flex items-center whitespace-nowrap ${
          wrapped ? "ml-auto" : ""
        }`}
      >
        <span>{highlightHope(joinB ? `${b} ${c}` : c)}</span>
        <InlineLoop images={s3} interval={interval} className="h-[9vw] w-[13.5vw]" />
        <span>{highlightHope(d)}</span>
        {s4.length > 0 && (
          <InlineLoop images={s4} interval={interval} className="h-[9vw] w-[13.5vw]" />
        )}
      </span>
    </div>
  );
}

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.";

// Continuous news-bar marquee of images (seamless loop via duplicated track).
function Marquee({ images, speed = 60 }) {
  if (!images || images.length === 0) return null;
  const track = [...images, ...images];
  return (
    <div className="w-full overflow-hidden">
      <div
        className="flex w-max gap-6"
        style={{ animation: `marquee ${speed}s linear infinite` }}
      >
        {track.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            draggable="false"
            className="h-[42rem] w-auto select-none rounded-xl border border-white/10 object-cover"
          />
        ))}
      </div>
    </div>
  );
}

// Fixed pseudo-random vertical offsets (up/down scatter, no rotation) for the
// checkpoint image piles — varied per image and per checkpoint.
const CP_OFFSETS = [
  "translate-y-0",
  "translate-y-10",
  "-translate-y-6",
  "translate-y-4",
  "-translate-y-9",
];

// Horizontal checkpoint timeline — numbered nodes on a line, each with a
// title, "+" bullet points, and an overlapping image pile.
function CheckpointLine({ items = [], onZoom }) {
  return (
    <div className="relative">
      {/* the connecting line (desktop only) */}
      <div className="absolute left-0 right-0 top-7 hidden h-[2px] bg-white/15 lg:block" />
      {/* Subgrid: each column shares the same 4 row heights (header / bullets /
          images / paragraph), so the paragraphs all line up on the same y. */}
      <div className="relative grid grid-cols-1 gap-14 lg:grid-cols-3 lg:grid-rows-[auto_auto_auto_auto] lg:gap-x-12 lg:gap-y-0">
        {items.map((cp, i) => (
          <div key={i} className="lg:row-span-4 lg:grid lg:grid-rows-subgrid">
            {/* Row 1 — header */}
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-400 bg-zinc-900 text-2xl font-black text-emerald-300">
                {i + 1}
              </div>
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
                Checkpoint {i + 1}
              </p>
              <h4 className="mt-2 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                {cp.title}
              </h4>
            </div>
            {/* Row 2 — bullets */}
            <ul className="mt-10 space-y-6 text-2xl leading-relaxed text-white/70 lg:mt-0 lg:pt-10">
              {(cp.points || []).map((p, j) => (
                <li key={j} className="flex gap-3">
                  <span className="text-emerald-400">+</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            {/* Row 3 — image pile */}
            <div className="mt-20 flex items-center lg:mt-0 lg:pt-20">
              {(cp.images || []).map((img, k) => {
                const src = typeof img === "string" ? img : img.src;
                const width = (typeof img === "object" && img.width) || "10vw";
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => onZoom?.(src)}
                    style={{ zIndex: k }}
                    className={`-ml-[2vw] block shrink-0 transition duration-300 first:ml-0 hover:z-30 hover:!translate-y-0 hover:scale-105 ${
                      CP_OFFSETS[(k + i * 2) % CP_OFFSETS.length]
                    }`}
                  >
                    <img
                      src={src}
                      alt=""
                      draggable="false"
                      style={{ width }}
                      className="h-auto max-w-none cursor-zoom-in select-none rounded-lg border-2 border-white/20 shadow-xl"
                    />
                  </button>
                );
              })}
            </div>
            {/* Row 4 — paragraph (aligned across all checkpoints) */}
            <p className="mt-8 self-start text-2xl leading-relaxed text-white/60 lg:mt-0 lg:pt-8">
              <span className="mr-2 font-bold text-emerald-400">→</span>
              {cp.paragraph}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// A single portfolio card, split into 5 sections you scroll through:
// Title + Context, Achievements, Branding, Performance Campaigns, Collect.
function PortfolioCard({ card }) {
  // The image the user clicked to zoom (null = closed).
  const [zoomed, setZoomed] = useState(null);

  // Close the zoomed image on Escape.
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e) => {
      if (e.key === "Escape") setZoomed(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  return (
    <div
      className={`relative flex min-h-screen w-[96vw] flex-col gap-50 overflow-hidden rounded-[2rem] border border-white/10 ${card.accent} p-10 pb-110 shadow-2xl sm:w-[98vw] sm:p-14 sm:pb-110`}
    >
      {/* Optional full-bleed banner (original aspect ratio). No fade. */}
      {card.banner && (
        <div className="-mx-10 -mt-10 sm:-mx-14 sm:-mt-14">
          <img
            src={card.banner}
            alt={`${card.title} banner`}
            className="block aspect-[3/1] w-full select-none object-cover"
            draggable="false"
          />
        </div>
      )}

      {/* 1 — TITLE + CONTEXT (context below the title, right-aligned). No fade. */}
      <section>
        <h3 className="text-7xl font-black tracking-tight text-white sm:text-9xl">
          {card.title}
        </h3>
        <p className="mt-20 text-2xl leading-9 text-white/70 sm:text-3xl">
          {card.context || PLACEHOLDER_PARAGRAPH}
        </p>
      </section>

      {/* 2 — ACHIEVEMENTS (big numbers + captions, then a paragraph) */}
      <section>
        <FadeIn>
          <SectionLabel>Achievements</SectionLabel>
        </FadeIn>
        <FadeIn className="mt-10 grid grid-cols-2 gap-10 sm:grid-cols-4">
          {(card.achievements || DEFAULT_ACHIEVEMENTS).map((a, idx) => (
            <div key={idx}>
              <div className="text-7xl font-black tracking-tight text-white sm:text-8xl">
                {a.value}
              </div>
              <div className="mt-4 text-3xl leading-9 text-white/60">
                {a.caption}
              </div>
            </div>
          ))}
        </FadeIn>
        <FadeIn className="mt-28">
          {/* Text + the big three (the hero shots). */}
          <div
            className={
              card.achievementsImages
                ? "flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16"
                : ""
            }
          >
            <div className={card.achievementsImages ? "lg:w-1/2" : ""}>
              {card.achievementsText || (
                <p className="max-w-3xl text-2xl leading-9 text-white/70">
                  {PLACEHOLDER_PARAGRAPH}
                </p>
              )}
            </div>

            {card.achievementsImages && (
              <div className="lg:w-1/2">
                {/* Big three (the hero shots). */}
                <div className="flex flex-wrap items-start justify-center">
                  {card.achievementsImages.slice(0, 3).map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setZoomed(src)}
                      style={{ zIndex: i }}
                      className={`relative -ml-20 transition duration-300 first:ml-0 hover:z-40 hover:-translate-y-3 hover:scale-105 ${
                        SCATTER_ROTATE[i % SCATTER_ROTATE.length]
                      } ${SCATTER_MT[i % SCATTER_MT.length]}`}
                    >
                      <img
                        src={src}
                        alt=""
                        loading="lazy"
                        className="h-64 w-[22rem] cursor-zoom-in select-none rounded-xl border-2 border-white/20 object-cover shadow-2xl"
                        draggable="false"
                      />
                    </button>
                  ))}
                </div>

                {/* Breadcrumb trail — half size, ~15% overlap, centered under
                    the big three and pulled up over their lower half. */}
                <div className="-mt-20 flex items-start justify-center">
                  {card.achievementsImages.slice(3).map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setZoomed(src)}
                      style={{ zIndex: 20 + i }}
                      className={`relative -ml-10 transition duration-300 first:ml-0 hover:z-40 hover:-translate-y-3 hover:scale-110 ${
                        SCATTER_ROTATE[(i + 1) % SCATTER_ROTATE.length]
                      }`}
                    >
                      <img
                        src={src}
                        alt=""
                        loading="lazy"
                        className="h-48 w-[16.5rem] cursor-zoom-in select-none rounded-lg border-2 border-white/20 object-cover shadow-2xl"
                        draggable="false"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </FadeIn>
      </section>

      {/* 3 — BRANDING (only rendered for cards with branding content) */}
      {(card.brandingSequences || card.voiceSequences) && (
      <section className="space-y-10">
        <FadeIn>
          <SectionLabel>
            {card.figma ? "Visual Branding" : "Branding"}
          </SectionLabel>
        </FadeIn>
        <FadeIn>
          {card.brandingSequences ? (
            <BrandingStory
              sequences={card.brandingSequences}
              words={card.brandingWords}
              interval={600}
            />
          ) : (
            <Placeholder label="Images" className="h-[55vh]" />
          )}
        </FadeIn>
        {card.brandingSequences && (
          <FadeIn className="pb-10 pt-10">
            <p className="text-2xl leading-relaxed text-white/70">
              {card.brandingText1 || LOREM}
            </p>
          </FadeIn>
        )}
        {card.figma && (
          <FadeIn className="pt-10">
            <SectionLabel>Voice Branding</SectionLabel>
          </FadeIn>
        )}
        {card.voiceSequences ? (
          <FadeIn>
            <BrandingStory
              sequences={card.voiceSequences}
              words={card.voiceWords}
              interval={600}
              joinB
            />
          </FadeIn>
        ) : (
          <FadeIn>
            <Placeholder label="Images" className="h-[55vh]" />
          </FadeIn>
        )}
        <FadeIn className="pt-10">
          <p className="text-2xl leading-9 text-white/70">
            {card.voiceText1 || PLACEHOLDER_PARAGRAPH}
          </p>
        </FadeIn>
      </section>
      )}

      {/* 4 — PERFORMANCE CAMPAIGNS (your space) */}
      <section className="space-y-10">
        <FadeIn>
          <SectionLabel>Performance Campaigns</SectionLabel>
        </FadeIn>
        {card.campaigns ? (
          <FadeIn className="pt-8">
            <CheckpointLine items={card.campaigns} onZoom={setZoomed} />
          </FadeIn>
        ) : (
          !card.dauData &&
          !card.impressionsData && (
            <FadeIn>
              <Placeholder label="Your space" className="h-[75vh]" />
            </FadeIn>
          )
        )}
        {card.dauData && (
          <FadeIn className="pt-8">
            <DauChart data={card.dauData} />
          </FadeIn>
        )}
        {card.impressionsData && (
          <FadeIn className="pt-8">
            <ImpressionsChart
              data={card.impressionsData}
              startDate={MATTLE_IMPRESSIONS_START}
            />
          </FadeIn>
        )}
      </section>

      {/* 5 — MATERIALS (your space) */}
      <section className="space-y-10">
        <FadeIn>
          <SectionLabel>Collect</SectionLabel>
        </FadeIn>
        {card.loopImages ? (
          <FadeIn className="-mx-10 pt-6 sm:-mx-14">
            <Marquee images={card.loopImages} speed={60} />
          </FadeIn>
        ) : (
          <FadeIn>
            <Placeholder label="Your space" className="h-[75vh]" />
          </FadeIn>
        )}
      </section>

      {/* Zoom lightbox — rendered in a portal so it escapes the pinned/
          transformed stage and overlays the whole viewport. */}
      {zoomed &&
        createPortal(
          <div
            onClick={() => setZoomed(null)}
            className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
          >
            <img
              src={zoomed}
              alt=""
              onClick={(e) => e.stopPropagation()}
              className="max-h-[70vh] max-w-[70vw] rounded-xl object-contain shadow-2xl"
            />
          </div>,
          document.body
        )}
    </div>
  );
}

export default function App() {
  const imageRef = useRef(null);
  const [eyeSrc, setEyeSrc] = useState("/cat-eye-top.png");

  // GSAP ScrollTrigger: pin the hero stage, then stack the cards ON TOP of the
  // hero (the cat is the base the cards slide over).
  const stageRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray(".card");
      if (cards.length === 0 || !stageRef.current) return;

      const pinEl = stageRef.current.querySelector(".cards-pin");

      // Cards are AUTO-HEIGHT (sized by their content). Each one stacks up over
      // ~1 viewport, then you scroll THROUGH its overflow ~1:1, so the timeline
      // adapts to whatever content length each card has — no fixed card height.
      const vh0 = window.innerHeight;
      const overflowUnits = cards.map(
        (card) => Math.max(0, card.offsetHeight - vh0) / vh0
      );

      // Start every card one viewport below the fold (the hero shows first).
      cards.forEach((card) => gsap.set(card, { y: () => window.innerHeight }));

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinEl,
          start: "top top",
          // Total scroll = sum over cards of (1 stack + its overflow), in
          // viewports. Recomputed on refresh so it stays correct on resize.
          end: () => {
            const v = window.innerHeight;
            let units = 0;
            cards.forEach((card) => {
              units += 1 + Math.max(0, card.offsetHeight - v) / v;
            });
            return "+=" + units * v;
          },
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      let at = 0;
      cards.forEach((card, i) => {
        // 1) stack up: slide from below until the card's top hits the top.
        tl.fromTo(
          card,
          { y: () => window.innerHeight },
          { y: 0, duration: 1, ease: "none" },
          at
        );
        // (No scale recede: scaling the covered card lifted its bottom edge,
        // exposing the bottom-most card's animating marquee through the gap.)
        at += 1;

        // 2) scroll through: slide up ~1:1 to reveal the card's bottom.
        const ovr = overflowUnits[i];
        if (ovr > 0.001) {
          tl.to(
            card,
            {
              y: () => -(card.offsetHeight - window.innerHeight),
              duration: ovr,
              ease: "none",
            },
            at
          );
          at += ovr;
        }
      });
    }, stageRef);

    return () => ctx.revert();
  }, []);

  function handleMouseMove(event) {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();

    const catCenterX = rect.left + rect.width * CAT_CENTER.x;
    const catCenterY = rect.top + rect.height * CAT_CENTER.y;

    const dx = event.clientX - catCenterX;
    const dy = event.clientY - catCenterY;

    setEyeSrc(pickEyeAsset(dx, dy));
  }

  function handleMouseLeave() {
    setEyeSrc("/cat-eye-top.png");
  }

  return (
    <main
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="min-h-screen overflow-x-clip bg-black text-white"
    >
      <nav className="fixed left-0 top-0 z-50 flex w-full items-center justify-between border-b border-white/10 bg-black/45 px-8 py-5 backdrop-blur-xl sm:px-14 lg:px-20">
        <a
        href="#home"
        className="block w-[390px] font-mono text-sm font-bold tracking-tight text-white sm:text-base"
        >
        <TypingLogo />
        </a>

        <div className="hidden items-center gap-8 text-sm font-semibold text-white/70 md:flex">
          <a href="#portfolio" className="transition hover:text-emerald-300">
            Portfolio
          </a>

          <a href="#contact" className="transition hover:text-emerald-300">
            Contact
          </a>
        </div>
      </nav>

      

      {/* HERO + PORTFOLIO: one pinned stage. The cat hero is the base; the
          portfolio cards stack right on top of it as you scroll. */}
      <section id="home" ref={stageRef} className="relative">
        {/* Anchor for the "Portfolio" nav link. The hero + deck share one pinned
            stage; card 1 is fully shown ~1 viewport into the pin, so the anchor
            sits 100vh down (not at the hero top). */}
        <span
          id="portfolio"
          aria-hidden="true"
          className="absolute left-0"
          style={{ top: "100vh" }}
        />

        {/* This stage gets pinned; cards stack on top of the hero inside it. */}
        <div className="cards-pin relative h-screen w-full overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.16),transparent_55%)]" />

          {/* CAT HERO (the base the cards stack over) */}
          <div className="absolute inset-0 z-10 flex items-end justify-center px-6 pt-20">
            {/* FRONT IMAGE LAYERS (eyes track the cursor) */}
            <div
              ref={imageRef}
              className="relative w-full max-w-[1100px] [@media(max-height:1010px)]:max-w-[800px]"
            >
              <img
                src="/me-background.png"
                alt="Portrait background"
                className="block h-auto w-full select-none"
                draggable="false"
              />

              <img
                src="/cat-hand-idle.png"
                alt="Cat and hands"
                className="pointer-events-none absolute inset-0 h-full w-full select-none"
                draggable="false"
              />

              <img
                src={eyeSrc}
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full select-none"
                draggable="false"
              />
            </div>
          </div>

          {/* HERO HEADLINE — split to the edges so the cat sits between the
              words (and never blocks them). Behind the cat (z-0). */}
          <div className="pointer-events-none absolute inset-0 z-0 flex items-center px-10">
            <h1 className="flex w-full flex-col justify-center gap-[3vh] font-black uppercase leading-[0.9] tracking-tight text-white">
              {/* Line 1: "Selling" (left)  …  "story?." (right) */}
              <span className="flex items-center justify-center gap-[14vw] whitespace-nowrap text-[7vw]">
                <span>Selling</span>
                <span className="whitespace-nowrap">
                  <span className="relative inline-block">
                    story
                    {/* Cypherpunk graffiti cross-out over "story". */}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 200 80"
                      fill="none"
                      preserveAspectRatio="none"
                      className="pointer-events-none absolute -bottom-3 -left-4 -right-4 -top-3 -rotate-3 overflow-visible text-emerald-400 [filter:drop-shadow(0_0_16px_rgba(52,211,153,0.75))]"
                    >
                      <path
                        d="M4 16 Q78 44 196 66"
                        stroke="currentColor"
                        strokeWidth="22"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                      <path
                        d="M8 68 Q112 32 197 14"
                        stroke="currentColor"
                        strokeWidth="22"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </span>
                  ?
                </span>
              </span>

              {/* Line 2: "I Sell" (left)  …  "hope." (right) */}
              <span className="flex items-center justify-center gap-[14vw] whitespace-nowrap text-[12.5vw]">
                <span>I Sell</span>
                <span className="whitespace-nowrap">
                  <span className="relative inline-block">
                    hope
                    {/* Cypherpunk graffiti double underline under "hope". */}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 200 30"
                      fill="none"
                      preserveAspectRatio="none"
                      className="pointer-events-none absolute -left-3 -right-8 bottom-[-0.18em] h-[0.4em] -rotate-1 overflow-visible text-emerald-400 [filter:drop-shadow(0_0_16px_rgba(52,211,153,0.75))]"
                    >
                      <path
                        d="M3 8 Q92 1 197 9"
                        stroke="currentColor"
                        strokeWidth="18"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                      <path
                        d="M5 24 Q108 30 196 21"
                        stroke="currentColor"
                        strokeWidth="18"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                    {/* Hand-drawn one-stroke graffiti star, top-right corner. */}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 100 100"
                      fill="none"
                      className="pointer-events-none absolute -right-[0.3em] -top-[0.2em] h-[0.6em] w-[0.6em] rotate-12 overflow-visible text-yellow-400 [filter:drop-shadow(0_0_10px_rgba(250,204,21,0.85))]"
                    >
                      <path
                        d="M51 7 Q63 47 78 86 Q42 56 5 34 Q50 38 96 36 Q58 64 22 89 Q38 47 52 8 Q57 15 64 20"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
             
                </span>
              </span>
            </h1>
          </div>

          {/* PORTFOLIO CARDS — stack on top of the hero. */}
          {PORTFOLIO_CARDS.map((card, i) => (
            <div
              key={card.title}
              className="card absolute inset-x-0 top-0 flex justify-center"
              style={{ zIndex: 40 + i }}
            >
              <PortfolioCard card={card} />
            </div>
          ))}
        </div>
      </section>

      <section
        id="contact"
        className="border-t border-white/10 bg-neutral-950 px-8 py-32 sm:px-14 lg:px-20"
      >
        <div className="mx-auto max-w-7xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300">
            Contact
          </p>

          <h2 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
            Let&apos;s build something sellable.
          </h2>

          <a
            href="mailto:pdq.minh63@gmail.com"
            className="mt-10 inline-flex rounded-full bg-white px-6 py-3 font-bold text-black transition hover:scale-105 hover:bg-emerald-300"
          >
            Email Me
          </a>
        </div>
      </section>
    </main>
  );
}