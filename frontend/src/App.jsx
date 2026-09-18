import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  Activity,
  Network,
  TrendingUp,
  Shield,
  Radio,
  Users,
  ArrowUpRight,
  MessageSquare,
  Clock3,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Globe2,
  Zap,
  Eye,
} from "lucide-react";

import "./App.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function App() {
  const [activePage, setActivePage] = useState("overview");

  const [intelligence, setIntelligence] = useState([]);

  const [network, setNetwork] = useState({
    nodes: [],
    links: [],
  });

  const [trends, setTrends] = useState(null);

  const [topics, setTopics] = useState([]);

  const [propagation, setPropagation] = useState([]);

  const [livePosts, setLivePosts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [apiError, setApiError] = useState(false);

  const [selectedNode, setSelectedNode] = useState(null);

  const [selectedConnection, setSelectedConnection] = useState(null);

  /*
   * ==============================
   * FETCH BACKEND DATA
   * ==============================
   */

 useEffect(() => {
  const fetchIntelligence = async () => {
    

    try {
      const [
        intelligenceResponse,
        networkResponse,
        trendsResponse,
        propagationResponse,
        topicsResponse,
        livePostsResponse,
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/intelligence`),
        axios.get(`${API_BASE_URL}/network`),
        axios.get(`${API_BASE_URL}/trends`),
        axios.get(`${API_BASE_URL}/propagation`),
        axios.get(`${API_BASE_URL}/topics`),
        axios.get(`${API_BASE_URL}/live-posts`),
      ]);

      console.log(
        "SocialSense: live data refreshed"
      );

      setIntelligence(
        intelligenceResponse.data
      );

      setNetwork(
        networkResponse.data
      );

      setTrends(
        trendsResponse.data
      );

      setPropagation(
        propagationResponse.data
      );

      setTopics(
        topicsResponse.data.topics || []
      );

      setLivePosts(
        livePostsResponse.data.posts || []
      );

      setLoading(false);
      setApiError(false);
    } catch (error) {
      console.error(
        "SocialSense API connection failed:",
        error
      );

      setLoading(false);
      setApiError(true);
    }
  };

  // Fetch immediately when dashboard opens.
  fetchIntelligence();

  // Refresh every 5 seconds.
  const refreshInterval = setInterval(
    fetchIntelligence,
    5000
  );

  // Stop the timer when the dashboard closes.
  return () => {
    clearInterval(refreshInterval);
  };
}, []);
  /*
   * ==============================
   * GLOBAL STATISTICS
   * ==============================
   */

  const analyzedPosts = intelligence.length;

  const networkNodes = network.nodes.length;

  const networkLinks = network.links.length;

  const platformCount = new Set(
    intelligence.map(
      (post) => post.platform
    )
  ).size;

  const communityCount = new Set(
    intelligence
      .map(
        (post) => post.community
      )
      .filter(
        (community) =>
          community !== null &&
          community !== undefined
      )
  ).size;

  /*
   * ==============================
   * SENTIMENT
   * ==============================
   */

  const negativePosts =
    intelligence.filter(
      (post) =>
        post.sentiment === "negative"
    ).length;

  const positivePosts =
    intelligence.filter(
      (post) =>
        post.sentiment === "positive"
    ).length;

  const neutralPosts =
    intelligence.filter(
      (post) =>
        post.sentiment === "neutral"
    ).length;

  /*
   * ==============================
   * EMOTION SIGNAL
   * ==============================
   *
   * Emotion is displayed only as an aggregate signal.
   * The backend may expose the mapped emotion as `emotion`,
   * `emotion_label`, or `emotion_bucket`.
   */

  const emotionSummary = useMemo(() => {
    const counts = {};

    intelligence.forEach((post) => {
      const rawEmotion =
        post.emotion_bucket ??
        post.emotion_label ??
        post.emotion ??
        null;

      if (!rawEmotion) {
        return;
      }

      const emotion = String(rawEmotion).trim();

      if (!emotion) {
        return;
      }

      counts[emotion] =
        (counts[emotion] || 0) + 1;
    });

    const ranked = Object.entries(counts)
      .sort((a, b) => b[1] - a[1]);

    return {
      dominant: ranked.length > 0 ? ranked[0][0] : null,
      count: ranked.length > 0 ? ranked[0][1] : 0,
      total: ranked.reduce(
        (sum, [, count]) => sum + count,
        0
      ),
    };
  }, [intelligence]);

  /*
   * ==============================
   * LIVE NARRATIVE TIMELINE
   * ==============================
   *
   * Build the narrative timeline directly from
   * the currently observed intelligence posts.
   * This means newly ingested Telegram events are
   * reflected here after the next dashboard refresh.
   */

  const liveTimeline = useMemo(() => {
    const timestamps = intelligence
      .map((post) => new Date(post.timestamp))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a - b);

    if (timestamps.length === 0) {
      return [];
    }

    // Group posts into 10-minute time buckets.
    const bucketMap = {};

    timestamps.forEach((date) => {
      const bucketStart = new Date(date);
      bucketStart.setMinutes(
        Math.floor(bucketStart.getMinutes() / 10) * 10,
        0,
        0
      );

      const key = bucketStart.getTime();

      bucketMap[key] = (bucketMap[key] || 0) + 1;
    });

    return Object.entries(bucketMap)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([time, count]) => ({
        time_bucket: Number(time),
        post_count: count,
      }))
      .slice(-8);
  }, [intelligence]);

  /*
   * Growth is calculated from the two most recent
   * 10-minute observation buckets.
   */

  const liveGrowthRate = useMemo(() => {
    if (liveTimeline.length < 2) {
      return 0;
    }

    const previous =
      liveTimeline[liveTimeline.length - 2].post_count;

    const latest =
      liveTimeline[liveTimeline.length - 1].post_count;

    if (previous === 0) {
      return latest > 0 ? 100 : 0;
    }

    return Math.round(
      ((latest - previous) / previous) * 100
    );
  }, [liveTimeline]);

  /*
   * ==============================
   * TOP INFLUENCERS
   * ==============================
   */

  const topInfluencers =
    [...intelligence]
      .sort(
        (a, b) =>
          (b.influence_score || 0) -
          (a.influence_score || 0)
      )
      .slice(0, 5);

  /*
   * ==============================
   * PLATFORM ACTIVITY
   * ==============================
   */

  const platformActivity = useMemo(() => {
    const counts = {};

    intelligence.forEach((post) => {
      const platform =
        post.platform || "unknown";

      counts[platform] =
        (counts[platform] || 0) + 1;
    });

    return Object.entries(counts)
      .sort(
        (a, b) => b[1] - a[1]
      );
  }, [intelligence]);

  /*
   * ==============================
   * ACTIVITY LEVEL
   * ==============================
   */

  const activityLevel = useMemo(() => {
    if (analyzedPosts === 0) {
      return "NO DATA";
    }

    if (negativePosts / analyzedPosts >= 0.7) {
      return "ELEVATED";
    }

    if (negativePosts / analyzedPosts >= 0.4) {
      return "WATCH";
    }

    return "STABLE";
  }, [
    analyzedPosts,
    negativePosts,
  ]);

  /*
   * ==============================
   * NETWORK GRAPH POSITIONS
   * ==============================
   */

  const graphNodes = useMemo(() => {
    const nodes = network.nodes || [];

    if (nodes.length === 0) {
      return [];
    }

    const enriched = nodes.map((node) => {
      const userId = node.user_id || node.id || node.name;
      const intelligenceUser = intelligence.find(
        (post) => post.user_id === userId
      );

      return {
        ...node,
        user_id: userId,
        community: node.community ?? intelligenceUser?.community ?? null,
        pagerank: node.pagerank ?? intelligenceUser?.pagerank ?? 0,
        betweenness: node.betweenness ?? intelligenceUser?.betweenness ?? 0,
        influence_score:
          node.influence_score ?? intelligenceUser?.influence_score ?? 0,
      };
    });

    const groups = {};
    enriched.forEach((node) => {
      const key =
        node.community === null || node.community === undefined
          ? "unassigned"
          : String(node.community);
      if (!groups[key]) groups[key] = [];
      groups[key].push(node);
    });

    const groupEntries = Object.entries(groups);
    const centerX = 490;
    const centerY = 310;

    const anchors =
      groupEntries.length === 1
        ? [{ x: centerX, y: centerY }]
        : groupEntries.length === 2
        ? [
            { x: 320, y: centerY },
            { x: 660, y: centerY },
          ]
        : groupEntries.length === 3
        ? [
            { x: 490, y: 175 },
            { x: 300, y: 425 },
            { x: 680, y: 425 },
          ]
        : [
            { x: 315, y: 190 },
            { x: 665, y: 190 },
            { x: 315, y: 430 },
            { x: 665, y: 430 },
          ];

    return enriched.map((node) => {
      const key =
        node.community === null || node.community === undefined
          ? "unassigned"
          : String(node.community);

      const groupIndex = groupEntries.findIndex(
        ([groupKey]) => groupKey === key
      );
      const members = groupEntries[groupIndex]?.[1] || [node];
      const memberIndex = members.findIndex(
        (member) => member.user_id === node.user_id
      );
      const anchor =
        anchors[groupIndex % anchors.length] || {
          x: centerX,
          y: centerY,
        };

      const localRadius =
        members.length <= 1
          ? 0
          : Math.min(72, 38 + members.length * 6);

      const angle =
        members.length <= 1
          ? 0
          : -Math.PI / 2 +
            memberIndex * ((2 * Math.PI) / members.length);

      return {
        ...node,
        x: anchor.x + localRadius * Math.cos(angle),
        y: anchor.y + localRadius * Math.sin(angle),
        groupX: anchor.x,
        groupY: anchor.y,
      };
    });
  }, [network.nodes, intelligence]);

  /*
   * ==============================
   * NETWORK NODE LOOKUP
   * ==============================
   */

  const nodeMap = useMemo(() => {
    const map = {};

    graphNodes.forEach(
      (node) => {
        const id =
          node.user_id ||
          node.id ||
          node.name;

        if (id) {
          map[id] = node;
        }
      }
    );

    return map;
  }, [graphNodes]);

  /*
   * ==============================
   * NAVIGATION
   * ==============================
   */

  const handleNavigation = (page) => {
    setActivePage(page);
    setSelectedNode(null);
    setSelectedConnection(null);
  };

  const focusNetworkGraph = () => {
    requestAnimationFrame(() => {
      document
        .getElementById("network-topology-card")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    });
  };

  const inspectParticipant = (user) => {
    setSelectedConnection(null);
    setSelectedNode(user);
    focusNetworkGraph();
  };

  const inspectConnection = (link, index) => {
    setSelectedConnection(index);

    const sourceNode =
      nodeMap[link.source];

    setSelectedNode(sourceNode || null);
    focusNetworkGraph();
  };

  /*
   * ==============================
   * SIDEBAR
   * ==============================
   */

  const renderSidebar = () => (
  <aside className="w-[250px] min-h-screen shrink-0 border-r border-white/[0.07] bg-[#090b10] flex flex-col">

    {/* BRAND */}
    <div className="px-5 pt-6 pb-7">
      <div className="flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-400">
          <Radio size={19} />
        </div>

        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold tracking-wide text-white">
            SocialSense
          </h1>

          <p className="mt-0.5 text-[9px] font-medium tracking-[0.18em] text-slate-500">
            INTELLIGENCE OS
          </p>
        </div>

      </div>
    </div>

    {/* NAVIGATION */}
    <div className="px-3">

      <p className="mb-2 px-3 text-[9px] font-semibold tracking-[0.18em] text-slate-600">
        WORKSPACE
      </p>

      <nav className="space-y-1">

        {/* OVERVIEW */}
        <button
          onClick={() => handleNavigation("overview")}
          className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
            activePage === "overview"
              ? "border border-blue-400/10 bg-blue-500/[0.09] text-white"
              : "border border-transparent text-slate-400 hover:bg-white/[0.035] hover:text-slate-200"
          }`}
        >
          <Activity
            size={17}
            className={
              activePage === "overview"
                ? "text-blue-400"
                : "text-slate-500 group-hover:text-slate-300"
            }
          />

          <span>Overview</span>

          {activePage === "overview" && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
          )}
        </button>

        {/* NARRATIVES */}
        <button
          onClick={() => handleNavigation("narratives")}
          className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
            activePage === "narratives"
              ? "border border-blue-400/10 bg-blue-500/[0.09] text-white"
              : "border border-transparent text-slate-400 hover:bg-white/[0.035] hover:text-slate-200"
          }`}
        >
          <TrendingUp
            size={17}
            className={
              activePage === "narratives"
                ? "text-blue-400"
                : "text-slate-500 group-hover:text-slate-300"
            }
          />

          <span>Narratives</span>

          {activePage === "narratives" && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
          )}
        </button>

        {/* NETWORK */}
        <button
          onClick={() => handleNavigation("network")}
          className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
            activePage === "network"
              ? "border border-blue-400/10 bg-blue-500/[0.09] text-white"
              : "border border-transparent text-slate-400 hover:bg-white/[0.035] hover:text-slate-200"
          }`}
        >
          <Network
            size={17}
            className={
              activePage === "network"
                ? "text-blue-400"
                : "text-slate-500 group-hover:text-slate-300"
            }
          />

          <span>Network</span>

          {activePage === "network" && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
          )}
        </button>

        {/* MONITORING */}
        <button
          onClick={() => handleNavigation("monitoring")}
          className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
            activePage === "monitoring"
              ? "border border-blue-400/10 bg-blue-500/[0.09] text-white"
              : "border border-transparent text-slate-400 hover:bg-white/[0.035] hover:text-slate-200"
          }`}
        >
          <Shield
            size={17}
            className={
              activePage === "monitoring"
                ? "text-blue-400"
                : "text-slate-500 group-hover:text-slate-300"
            }
          />

          <span>Monitoring</span>

          {activePage === "monitoring" && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
          )}
        </button>

      </nav>
    </div>

    {/* LIVE SOURCES */}
    <div className="mt-8 px-3">

      <p className="mb-2 px-3 text-[9px] font-semibold tracking-[0.18em] text-slate-600">
        LIVE SOURCES
      </p>

      <div className="space-y-1">

        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />

          <span className="text-sm text-slate-300">
            Telegram
          </span>

          <span className="ml-auto text-[9px] font-semibold tracking-wider text-emerald-400">
            LIVE
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <span className="h-2 w-2 rounded-full bg-slate-600" />

          <span className="text-sm text-slate-500">
            X
          </span>

          <span className="ml-auto text-[9px] font-semibold tracking-wider text-slate-600">
            DATA
          </span>
        </div>

      </div>
    </div>

    {/* SYSTEM STATUS */}
    <div className="mt-auto p-3">

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">

        <div className="flex items-start gap-3">

          <span
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
              apiError
                ? "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.7)]"
                : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
            }`}
          />

          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-200">
              {apiError
                ? "API Offline"
                : "System Online"}
            </p>

            <p className="mt-0.5 text-[9px] leading-4 text-slate-600">
              {apiError
                ? "Backend connection failed"
                : "Intelligence engine active"}
            </p>
          </div>

        </div>

      </div>

    </div>

  </aside>
);

  /*
   * ==============================
   * TOP BAR
   * ==============================
   */

  const renderTopbar = (
    title,
    eyebrow =
      "SOCIAL MEDIA INTELLIGENCE"
  ) => (
    <header className="topbar">
      <div>
        <p className="eyebrow">
          {eyebrow}
        </p>

        <h2>
          {title}
        </h2>
      </div>

      <div className="system-status">
        <span className="status-dot"></span>

        {apiError
          ? "OFFLINE"
          : "LIVE"}
      </div>
    </header>
  );

  /*
   * ==============================
   * OVERVIEW PAGE
   * ==============================
   */

  const renderOverview = () => (
  <>
    {/* TOP BAR */}
    <header className="flex items-center justify-between border-b border-white/[0.06] px-8 py-5">
      <div>
        <p className="mb-1 text-[10px] font-semibold tracking-[0.2em] text-blue-400/70">
          SOCIAL MEDIA INTELLIGENCE
        </p>

        <h2 className="text-2xl font-semibold tracking-tight text-white">
          Intelligence Overview
        </h2>
      </div>

      <div
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold tracking-[0.15em] ${
          apiError
            ? "border-red-400/20 bg-red-400/5 text-red-300"
            : "border-emerald-400/20 bg-emerald-400/5 text-emerald-300"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            apiError
              ? "bg-red-400"
              : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
          }`}
        />

        {apiError ? "OFFLINE" : "LIVE"}
      </div>
    </header>

    {/* MAIN CONTENT */}
    <section className="space-y-8 px-8 py-8">

      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-[#141923] via-[#10141c] to-[#0b0e14] p-8">

        {/* Background glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-500/[0.06] blur-3xl" />

        <div className="relative flex items-center justify-between gap-10">

          <div className="max-w-3xl">

            <div className="mb-4 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />

              <span className="text-[10px] font-semibold tracking-[0.2em] text-blue-300/70">
                SOCIALSENSE CORE
              </span>
            </div>

            <h3 className="text-4xl font-semibold leading-[1.08] tracking-tight text-white">
              Observe the conversation.
              <br />
              Understand the network.
              <br />
              Trace the narrative.
            </h3>

            <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-400">
              SocialSense connects social-media activity, audience signals,
              network structure and information propagation into one
              intelligence workflow.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">

              <button
                onClick={() => handleNavigation("narratives")}
                className="group inline-flex items-center gap-2 rounded-lg border border-blue-400/20 bg-blue-500/10 px-4 py-2.5 text-xs font-semibold text-blue-200 transition-all duration-200 hover:border-blue-400/30 hover:bg-blue-500/15"
              >
                Investigate Narrative

                <ArrowUpRight
                  size={15}
                  className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </button>

              <button
                onClick={() => handleNavigation("network")}
                className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-xs font-medium text-slate-300 transition-all duration-200 hover:bg-white/[0.05] hover:text-white"
              >
                <Network size={14} />
                Explore Network
              </button>

            </div>
          </div>

          {/* SIGNAL VISUAL */}
          <div className="hidden shrink-0 lg:flex">

            <div className="relative flex h-48 w-48 items-center justify-center">

              <div className="absolute h-48 w-48 rounded-full border border-blue-400/[0.08]" />
              <div className="absolute h-36 w-36 rounded-full border border-blue-400/[0.10]" />
              <div className="absolute h-24 w-24 rounded-full border border-blue-400/[0.12]" />

              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/[0.08] text-blue-300 shadow-[0_0_35px_rgba(59,130,246,0.12)]">
                <Activity size={25} />
              </div>

              <span className="absolute right-5 top-10 h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.9)]" />

              <span className="absolute bottom-7 left-8 h-1 w-1 rounded-full bg-emerald-400" />

            </div>

          </div>

        </div>
      </div>


      {/* INTELLIGENCE SNAPSHOT */}
      <div>

        <div className="mb-3 flex items-center justify-between">

          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-600">
              INTELLIGENCE SNAPSHOT
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Current state of the observed social network
            </p>
          </div>

          <span className="text-[10px] text-slate-600">
            AUTO REFRESH · 5s
          </span>

        </div>


        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

          {/* NARRATIVES */}
          <button
            onClick={() => handleNavigation("narratives")}
            className="group rounded-xl border border-white/[0.07] bg-[#0d1016] p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400/20 hover:bg-[#10141c]"
          >
            <div className="flex items-start justify-between">

              <span className="text-[10px] font-medium tracking-[0.14em] text-slate-500">
                ACTIVE NARRATIVES
              </span>

              <TrendingUp
                size={16}
                className="text-slate-600 transition-colors group-hover:text-blue-400"
              />

            </div>

            <div className="mt-5 flex items-end justify-between">

              <strong className="text-3xl font-semibold tracking-tight text-white">
                {loading ? "—" : "01"}
              </strong>

              <ArrowUpRight
                size={16}
                className="mb-1 text-slate-700 transition-colors group-hover:text-blue-400"
              />

            </div>

            <p className="mt-2 text-[11px] text-slate-600">
              Currently detected
            </p>
          </button>


          {/* POSTS */}
          <button
            onClick={() => handleNavigation("narratives")}
            className="group rounded-xl border border-white/[0.07] bg-[#0d1016] p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400/20 hover:bg-[#10141c]"
          >
            <div className="flex items-start justify-between">

              <span className="text-[10px] font-medium tracking-[0.14em] text-slate-500">
                ANALYZED POSTS
              </span>

              <MessageSquare
                size={16}
                className="text-slate-600 transition-colors group-hover:text-blue-400"
              />

            </div>

            <div className="mt-5 flex items-end justify-between">

              <strong className="text-3xl font-semibold tracking-tight text-white">
                {loading ? "—" : analyzedPosts}
              </strong>

              <ArrowUpRight
                size={16}
                className="mb-1 text-slate-700 transition-colors group-hover:text-blue-400"
              />

            </div>

            <p className="mt-2 text-[11px] text-slate-600">
              Across {loading ? "—" : platformCount} platforms
            </p>
          </button>


          {/* NETWORK */}
          <button
            onClick={() => handleNavigation("network")}
            className="group rounded-xl border border-white/[0.07] bg-[#0d1016] p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400/20 hover:bg-[#10141c]"
          >
            <div className="flex items-start justify-between">

              <span className="text-[10px] font-medium tracking-[0.14em] text-slate-500">
                NETWORK NODES
              </span>

              <Network
                size={16}
                className="text-slate-600 transition-colors group-hover:text-blue-400"
              />

            </div>

            <div className="mt-5 flex items-end justify-between">

              <strong className="text-3xl font-semibold tracking-tight text-white">
                {loading ? "—" : networkNodes}
              </strong>

              <ArrowUpRight
                size={16}
                className="mb-1 text-slate-700 transition-colors group-hover:text-blue-400"
              />

            </div>

            <p className="mt-2 text-[11px] text-slate-600">
              Observed participants
            </p>
          </button>


          {/* COMMUNITIES */}
          <button
            onClick={() => handleNavigation("network")}
            className="group rounded-xl border border-white/[0.07] bg-[#0d1016] p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400/20 hover:bg-[#10141c]"
          >
            <div className="flex items-start justify-between">

              <span className="text-[10px] font-medium tracking-[0.14em] text-slate-500">
                COMMUNITIES
              </span>

              <Users
                size={16}
                className="text-slate-600 transition-colors group-hover:text-blue-400"
              />

            </div>

            <div className="mt-5 flex items-end justify-between">

              <strong className="text-3xl font-semibold tracking-tight text-white">
                {loading ? "—" : communityCount}
              </strong>

              <ArrowUpRight
                size={16}
                className="mb-1 text-slate-700 transition-colors group-hover:text-blue-400"
              />

            </div>

            <p className="mt-2 text-[11px] text-slate-600">
              Detected clusters
            </p>
          </button>

        </div>
      </div>


      {/* API ERROR */}
      {apiError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-400/15 bg-red-400/[0.04] px-4 py-3">

          <AlertTriangle
            size={17}
            className="shrink-0 text-red-400"
          />

          <div>
            <p className="text-xs font-medium text-red-300">
              Intelligence API unavailable
            </p>

            <p className="mt-0.5 text-[11px] text-red-300/50">
              Make sure FastAPI is running on 127.0.0.1:8000.
            </p>
          </div>

        </div>
      )}


      {/* LOWER INTELLIGENCE AREA */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.8fr]">

        {/* ACTIVE NARRATIVE */}
        <div className="rounded-xl border border-white/[0.07] bg-[#0d1016] p-6">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-blue-400/70">
                ACTIVE NARRATIVE
              </p>

              <h3 className="mt-2 text-xl font-semibold text-white">
                Fuel Price Discussion
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Observed conversation across connected social sources
              </p>
            </div>

            <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.05] px-2.5 py-1 text-[9px] font-semibold tracking-wider text-emerald-400">
              ACTIVE
            </span>

          </div>


          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">

            <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3">
              <span className="text-[9px] tracking-wider text-slate-600">
                POSTS
              </span>

              <strong className="mt-1 block text-lg text-white">
                {loading ? "—" : analyzedPosts}
              </strong>
            </div>

            <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3">
              <span className="text-[9px] tracking-wider text-slate-600">
                PLATFORMS
              </span>

              <strong className="mt-1 block text-lg text-white">
                {loading ? "—" : platformCount}
              </strong>
            </div>

            <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3">
              <span className="text-[9px] tracking-wider text-slate-600">
                NEGATIVE
              </span>

              <strong className="mt-1 block text-lg text-red-300">
                {loading ? "—" : negativePosts}
              </strong>
            </div>

            <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3">
              <span className="text-[9px] tracking-wider text-slate-600">
                POSITIVE
              </span>

              <strong className="mt-1 block text-lg text-emerald-300">
                {loading ? "—" : positivePosts}
              </strong>
            </div>

          </div>


          {/* TOPICS */}
          <div className="mt-6">

            <div className="mb-3 flex items-center justify-between">
              <span className="text-[9px] font-semibold tracking-[0.16em] text-slate-600">
                TOPIC SIGNALS
              </span>

              <span className="text-[9px] text-slate-700">
                TF-IDF
              </span>
            </div>

            <div className="flex flex-wrap gap-2">

              {topics.length > 0 ? (
                topics.slice(0, 5).map((topic, index) => (
                  <span
                    key={`${topic}-${index}`}
                    className="rounded-md border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5 text-[10px] text-slate-400"
                  >
                    {topic}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-600">
                  No topic signals available
                </span>
              )}

            </div>

          </div>


          {/* ACTION */}
          <div className="mt-6 border-t border-white/[0.05] pt-5">

            <button
              onClick={() => handleNavigation("narratives")}
              className="group inline-flex items-center gap-2 text-xs font-semibold text-blue-400 transition-colors hover:text-blue-300"
            >
              Investigate this narrative

              <ArrowUpRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </button>

          </div>


          {/* RECENT INTELLIGENCE */}
          <div className="mt-6 border-t border-white/[0.05] pt-5">

            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-semibold tracking-[0.16em] text-slate-600">
                  RECENT INTELLIGENCE
                </p>

                <p className="mt-1 text-[11px] text-slate-500">
                  Signals derived from observed activity
                </p>
              </div>

              <Activity size={15} className="text-slate-600" />
            </div>

            <div className="space-y-2">

              {/* SENTIMENT */}
              <button
                onClick={() => handleNavigation("monitoring")}
                className="group flex w-full items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.015] p-3 text-left transition-all duration-200 hover:border-red-400/10 hover:bg-white/[0.03]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-400/[0.06] text-red-300">
                  <AlertTriangle size={14} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium text-slate-300">
                    Negative sentiment signal
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-600">
                    {negativePosts} of {analyzedPosts} observed posts classified as negative
                  </p>
                </div>

                <ArrowUpRight
                  size={13}
                  className="text-slate-700 transition-colors group-hover:text-red-300"
                />
              </button>


              {/* NETWORK */}
              <button
                onClick={() => handleNavigation("network")}
                className="group flex w-full items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.015] p-3 text-left transition-all duration-200 hover:border-blue-400/10 hover:bg-white/[0.03]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-400/[0.06] text-blue-300">
                  <Network size={14} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium text-slate-300">
                    Network activity
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-600">
                    {networkLinks} interaction links across {communityCount} communities
                  </p>
                </div>

                <ArrowUpRight
                  size={13}
                  className="text-slate-700 transition-colors group-hover:text-blue-300"
                />
              </button>


              {/* PROPAGATION */}
              <button
                onClick={() => handleNavigation("monitoring")}
                className="group flex w-full items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.015] p-3 text-left transition-all duration-200 hover:border-purple-400/10 hover:bg-white/[0.03]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-400/[0.06] text-purple-300">
                  <Activity size={14} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium text-slate-300">
                    Information flow
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-600">
                    {propagation.length} propagation events observed
                  </p>
                </div>

                <ArrowUpRight
                  size={13}
                  className="text-slate-700 transition-colors group-hover:text-purple-300"
                />
              </button>

            </div>

          </div>

        </div>


        {/* SIGNALS */}
        <div className="rounded-xl border border-white/[0.07] bg-[#0d1016] p-6">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-600">
                CURRENT SIGNALS
              </p>

              <h3 className="mt-1 text-sm font-semibold text-white">
                Intelligence indicators
              </h3>
            </div>

            <Zap
              size={17}
              className="text-slate-600"
            />

          </div>


          <div className="mt-5 space-y-3">

            {/* SENTIMENT */}
            <button
              onClick={() => handleNavigation("monitoring")}
              className="group flex w-full items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.015] p-3 text-left transition-colors hover:bg-white/[0.035]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-400/[0.07] text-red-300">
                <AlertTriangle size={15} />
              </div>

              <div className="min-w-0 flex-1">

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[9px] font-semibold tracking-wider text-slate-600">
                    SENTIMENT SIGNAL
                  </span>

                  <ArrowUpRight
                    size={13}
                    className="text-slate-700 group-hover:text-blue-400"
                  />
                </div>

                <p className="mt-1 text-xs font-medium text-slate-300">
                  {negativePosts > positivePosts
                    ? "Negative sentiment dominates"
                    : "No dominant negative signal"}
                </p>

              </div>
            </button>


            {/* NETWORK */}
            <button
              onClick={() => handleNavigation("network")}
              className="group flex w-full items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.015] p-3 text-left transition-colors hover:bg-white/[0.035]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-400/[0.07] text-blue-300">
                <Network size={15} />
              </div>

              <div className="min-w-0 flex-1">

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[9px] font-semibold tracking-wider text-slate-600">
                    NETWORK SIGNAL
                  </span>

                  <ArrowUpRight
                    size={13}
                    className="text-slate-700 group-hover:text-blue-400"
                  />
                </div>

                <p className="mt-1 text-xs font-medium text-slate-300">
                  {networkLinks > 0
                    ? `${networkLinks} interaction links detected`
                    : "Network awaiting data"}
                </p>

              </div>
            </button>


            {/* PROPAGATION */}
            <button
              onClick={() => handleNavigation("monitoring")}
              className="group flex w-full items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.015] p-3 text-left transition-colors hover:bg-white/[0.035]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-400/[0.07] text-purple-300">
                <Activity size={15} />
              </div>

              <div className="min-w-0 flex-1">

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[9px] font-semibold tracking-wider text-slate-600">
                    PROPAGATION SIGNAL
                  </span>

                  <ArrowUpRight
                    size={13}
                    className="text-slate-700 group-hover:text-blue-400"
                  />
                </div>

                <p className="mt-1 text-xs font-medium text-slate-300">
                  {propagation.length > 0
                    ? `${propagation.length} information-flow events`
                    : "No propagation events"}
                </p>

              </div>
            </button>

          </div>


          {/* SOURCE STATUS */}
          <div className="mt-5 border-t border-white/[0.05] pt-5">

            <div className="mb-3 flex items-center justify-between">
              <span className="text-[9px] font-semibold tracking-[0.16em] text-slate-600">
                OBSERVED SOURCES
              </span>

              <span className="text-[9px] text-slate-700">
                {platformCount} ACTIVE
              </span>
            </div>

            <div className="flex gap-2">

              <div className="flex flex-1 items-center gap-2 rounded-lg border border-emerald-400/10 bg-emerald-400/[0.03] px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                <span className="text-[10px] text-slate-400">
                  Telegram
                </span>
              </div>

              <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />

                <span className="text-[10px] text-slate-500">
                  X
                </span>
              </div>

            </div>

          </div>


          {/* LIVE INTELLIGENCE FEED */}
          <div className="mt-5 border-t border-white/[0.05] pt-5">

            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-semibold tracking-[0.16em] text-slate-600">
                  LIVE INTELLIGENCE FEED
                </p>

                <p className="mt-1 text-[11px] text-slate-500">
                  Recently ingested events
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-[9px] font-semibold tracking-wider text-emerald-400">
                  LIVE
                </span>
              </div>
            </div>

            {livePosts.length > 0 ? (
              <div className="space-y-2">
                {[...livePosts]
                  .slice(-4)
                  .reverse()
                  .map((post, index) => {
                    const date = new Date(post.timestamp);
                    const time = Number.isNaN(date.getTime())
                      ? "—"
                      : date.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                    return (
                      <div
                        key={`${post.id || post.post_id || "live"}-${index}`}
                        className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                              {post.platform || "source"}
                            </span>
                          </div>

                          <span className="text-[9px] text-slate-700">
                            {time}
                          </span>
                        </div>

                        <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-slate-400">
                          {post.text}
                        </p>

                        <p className="mt-1 text-[9px] text-slate-700">
                          {post.user_id || "unknown participant"}
                        </p>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/[0.06] bg-white/[0.01] px-3 py-4">
                <p className="text-[10px] font-medium text-slate-500">
                  Waiting for live events
                </p>

                <p className="mt-1 text-[9px] leading-4 text-slate-700">
                  New Telegram events will appear here after ingestion.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>

    </section>
  </>
);
  /*
   * ==============================
   * NARRATIVES PAGE
   * ==============================
   */

  const renderNarratives = () => {
    const narrativeStatus = trends?.status || "ANALYZING";

    return (
      <>
        {renderTopbar(
          "Narrative Intelligence",
          "NARRATIVE DETECTION"
        )}

        <section className="dashboard">

          {/* SIMPLE NARRATIVE HEADER */}
          <div className="page-intro">
            <div>
              <p className="eyebrow">
                ACTIVE NARRATIVE
              </p>

              <h3>
                Fuel Price Discussion
              </h3>

              <p>
                A simple view of what people are discussing,
                how the audience is responding, and how the
                conversation is changing.
              </p>
            </div>

            <div className="trend-status">
              <TrendingUp size={18} />

              <span>
                {narrativeStatus}
              </span>
            </div>
          </div>


          {/* KEY NUMBERS */}
          <div className="stats-grid">

            <div className="stat-card">
              <span>
                POST VOLUME
              </span>

              <strong>
                {loading ? "—" : analyzedPosts}
              </strong>

              <small>
                Observed conversation
              </small>
            </div>

            <div className="stat-card">
              <span>
                GROWTH RATE
              </span>

              <strong>
                {loading ? "—" : `${liveGrowthRate}%`}
              </strong>

              <small>
                Latest vs previous 10-min window
              </small>
            </div>

            <div className="stat-card">
              <span>
                NEGATIVE SIGNALS
              </span>

              <strong>
                {loading ? "—" : negativePosts}
              </strong>

              <small>
                Posts with negative sentiment
              </small>
            </div>

            <div className="stat-card">
              <span>
                POSITIVE SIGNALS
              </span>

              <strong>
                {loading ? "—" : positivePosts}
              </strong>

              <small>
                Posts with positive sentiment
              </small>
            </div>

          </div>


          {/* AUDIENCE SIGNAL */}
          <div className="section-title">
            <span>
              AUDIENCE SIGNAL
            </span>
          </div>

          <div className="timeline-card">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-sm font-semibold text-white">
                  How is the audience responding?
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Sentiment distribution across the observed posts.
                </p>
              </div>

              <button
                onClick={() => handleNavigation("monitoring")}
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-[10px] font-semibold text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                View monitoring
                <ArrowUpRight size={13} />
              </button>

            </div>

            <div className="mt-5 space-y-3">

              <div>
                <div className="mb-1.5 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">
                    Negative
                  </span>

                  <span className="text-red-300">
                    {negativePosts}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-red-400/70"
                    style={{
                      width:
                        analyzedPosts > 0
                          ? `${(negativePosts / analyzedPosts) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">
                    Positive
                  </span>

                  <span className="text-emerald-300">
                    {positivePosts}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-emerald-400/70"
                    style={{
                      width:
                        analyzedPosts > 0
                          ? `${(positivePosts / analyzedPosts) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">
                    Neutral
                  </span>

                  <span className="text-slate-300">
                    {neutralPosts}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-slate-500/70"
                    style={{
                      width:
                        analyzedPosts > 0
                          ? `${(neutralPosts / analyzedPosts) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

            </div>
          </div>


          {/* TOPICS */}
          <div className="section-title">
            <span>
              WHAT ARE PEOPLE TALKING ABOUT?
            </span>
          </div>

          <div className="topic-grid">

            {topics.length > 0 ? (
              topics.slice(0, 5).map((topic, index) => (
                <div
                  className="topic-card"
                  key={`${topic}-${index}`}
                >
                  <span>
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <strong>
                    {topic}
                  </strong>

                  <small>
                    Topic signal
                  </small>
                </div>
              ))
            ) : (
              <div className="topic-card">
                <span>
                  --
                </span>

                <strong>
                  No topics detected
                </strong>

                <small>
                  Waiting for conversation data
                </small>
              </div>
            )}

          </div>


          {/* CONVERSATION TIMELINE */}
          <div className="section-title">
            <span>
              HOW IS THE CONVERSATION CHANGING?
            </span>
          </div>

          <div className="timeline-card">

            {liveTimeline.length > 0 ? (
              liveTimeline.map((item, index) => {
                const maxCount = Math.max(
                  ...liveTimeline.map(
                    (entry) => entry.post_count
                  ),
                  1
                );

                return (
                  <div
                    className="timeline-row"
                    key={item.time_bucket}
                  >
                    <div className="timeline-time">
                      <Clock3 size={15} />

                      <span>
                        {new Date(
                          item.time_bucket
                        ).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>

                    <div className="timeline-bar">
                      <div
                        className="timeline-fill"
                        style={{
                          width: `${
                            (item.post_count / maxCount) * 100
                          }%`,
                        }}
                      ></div>
                    </div>

                    <strong>
                      {item.post_count}
                    </strong>
                  </div>
                );
              })
            ) : (
              <div className="monitoring-empty">
                No timeline data available.
              </div>
            )}

            {liveTimeline.length > 0 && (
              <p className="mt-4 text-[9px] text-slate-700">
                Updates automatically from observed posts · 10-minute windows
              </p>
            )}

          </div>


          {/* INVESTIGATION PATH */}
          <div className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-[#0d1016] p-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-xs font-semibold text-white">
                Want to understand how this narrative spreads?
              </p>

              <p className="mt-1 text-[10px] leading-4 text-slate-600">
                Explore the network to see connected participants,
                communities and influence metrics.
              </p>
            </div>

            <button
              onClick={() => handleNavigation("network")}
              className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg border border-blue-400/15 bg-blue-500/[0.08] px-4 py-2.5 text-[10px] font-semibold text-blue-300 transition-colors hover:bg-blue-500/[0.13] hover:text-blue-200"
            >
              Explore network
              <ArrowUpRight size={14} />
            </button>

          </div>

        </section>
      </>
    );
  };

  /*
   * ==============================
   * NETWORK GRAPH
   * ==============================
   */

  const renderNetworkGraph = () => {
    if (graphNodes.length === 0) {
      return (
        <div className="network-graph-card">
          <div className="graph-empty">
            <Network size={28} />

            <strong>
              No network data available
            </strong>

            <span>
              The backend returned no graph nodes.
            </span>
          </div>
        </div>
      );
    }

    const communityColors = [
      "#60a5fa",
      "#a78bfa",
      "#2dd4bf",
      "#fbbf24",
    ];

    const communities = [
      ...new Set(
        graphNodes.map((node) =>
          String(node.community ?? 0)
        )
      ),
    ].sort((a, b) => {
      const aNum = Number(a);
      const bNum = Number(b);

      if (
        Number.isFinite(aNum) &&
        Number.isFinite(bNum)
      ) {
        return aNum - bNum;
      }

      return a.localeCompare(b);
    });

    const communityAnchors = [
      { x: 245, y: 180 },
      { x: 615, y: 180 },
      { x: 245, y: 430 },
      { x: 615, y: 430 },
    ];

    const maxInfluence = Math.max(
      ...graphNodes.map((node) =>
        Number(
          node.influence_score ||
            node.influence ||
            node.pagerank ||
            0
        )
      ),
      0.01
    );

    return (
      <div id="network-topology-card" className="network-graph-card network-graph-enhanced">
        <div className="graph-header">
          <div>
            <strong>
              SOCIAL NETWORK TOPOLOGY
            </strong>

            <span>
              Communities, connections and structural influence
            </span>
          </div>

          <div className="graph-legend">
            <span>
              <i className="legend-dot"></i>
              User
            </span>

            <span>
              <i className="legend-line"></i>
              Connection
            </span>

            <span>
              <i className="legend-size"></i>
              Size = influence
            </span>
          </div>
        </div>

        <div className="graph-container relative">
          <svg
            className="network-svg"
            viewBox="0 0 860 620"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Social network topology showing communities, connections and influential users"
          >
            {/* Subtle graph field */}
            <rect
              x="0"
              y="0"
              width="860"
              height="620"
              fill="rgba(255,255,255,0.005)"
            />

            {/* Community zones */}
            {communities.map(
              (community, index) => {
                const anchor =
                  communityAnchors[
                    index %
                      communityAnchors.length
                  ];

                const communityColor =
                  communityColors[
                    index %
                      communityColors.length
                  ];

                return (
                  <g
                    key={`community-zone-${community}`}
                    pointerEvents="none"
                  >
                    <circle
                      cx={anchor.x}
                      cy={anchor.y}
                      r="112"
                      fill={communityColor}
                      opacity="0.025"
                    />

                    <circle
                      cx={anchor.x}
                      cy={anchor.y}
                      r="112"
                      fill="none"
                      stroke={communityColor}
                      strokeWidth="1"
                      strokeDasharray="4 8"
                      opacity="0.18"
                    />

                    <text
                      x={anchor.x - 94}
                      y={anchor.y - 91}
                      fill={communityColor}
                      opacity="0.65"
                      fontSize="10"
                      fontWeight="600"
                      letterSpacing="1.5"
                    >
                      COMMUNITY {community}
                    </text>
                  </g>
                );
              }
            )}

            {/* Connections */}
            {(network.links || []).map(
              (link, index) => {
                const source =
                  nodeMap[
                    link.source
                  ];

                const target =
                  nodeMap[
                    link.target
                  ];

                if (
                  !source ||
                  !target
                ) {
                  return null;
                }

                const sourceCommunity =
                  String(
                    source.community ?? 0
                  );

                const targetCommunity =
                  String(
                    target.community ?? 0
                  );

                const isCrossCommunity =
                  sourceCommunity !==
                  targetCommunity;

                return (
                  <g
                    key={`link-${index}`}
                    onClick={() => {
                      setSelectedConnection(index);
                      setSelectedNode(source);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <line
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={
                        selectedConnection === index
                          ? "#60a5fa"
                          : isCrossCommunity
                          ? "rgba(148,163,184,0.30)"
                          : "rgba(96,165,250,0.22)"
                      }
                      strokeWidth={
                        selectedConnection === index
                          ? "3"
                          : isCrossCommunity
                          ? "1.6"
                          : "1.2"
                      }
                      opacity={
                        selectedConnection !== null &&
                        selectedConnection !== index
                          ? "0.45"
                          : "1"
                      }
                    />

                    <circle
                      cx={
                        (source.x +
                          target.x) /
                        2
                      }
                      cy={
                        (source.y +
                          target.y) /
                        2
                      }
                      r={
                        selectedConnection === index
                          ? "3.5"
                          : "2"
                      }
                      fill={
                        selectedConnection === index
                          ? "#60a5fa"
                          : isCrossCommunity
                          ? "rgba(203,213,225,0.50)"
                          : "rgba(148,163,184,0.35)"
                      }
                    />
                  </g>
                );
              }
            )}

            {/* Users */}
            {graphNodes.map(
              (node, index) => {
                const nodeId =
                  node.user_id ||
                  node.id ||
                  node.name ||
                  `node-${index}`;

                const influence =
                  Number(
                    node.influence_score ||
                      node.influence ||
                      node.pagerank ||
                      0
                  );

                const normalizedInfluence =
                  Math.min(
                    influence /
                      maxInfluence,
                    1
                  );

                const radius =
                  17 +
                  normalizedInfluence *
                    15;

                const communityIndex =
                  Math.max(
                    0,
                    communities.indexOf(
                      String(
                        node.community ?? 0
                      )
                    )
                  );

                const communityColor =
                  communityColors[
                    communityIndex %
                      communityColors.length
                  ];

                const isSelected =
                  selectedNode &&
                  (
                    selectedNode.user_id ||
                    selectedNode.id ||
                    selectedNode.name
                  ) === nodeId;

                const selectedLink =
                  selectedConnection !== null
                    ? network.links[
                        selectedConnection
                      ]
                    : null;

                const isConnectionEndpoint =
                  selectedLink &&
                  (
                    selectedLink.source === nodeId ||
                    selectedLink.target === nodeId
                  );

                const isEmphasized =
                  isSelected ||
                  isConnectionEndpoint;

                return (
                  <g
                    key={nodeId}
                    className={`graph-node ${
                      isEmphasized
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedNode(
                        node
                      )
                    }
                    style={{
                      cursor: "pointer",
                    }}
                  >
                    {/* Influence halo */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius + 10}
                      fill={communityColor}
                      opacity={
                        isEmphasized
                          ? "0.14"
                          : "0.045"
                      }
                    />

                    {/* Community ring */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius + 5}
                      fill="rgba(9,11,16,0.92)"
                      stroke={communityColor}
                      strokeWidth={
                        isEmphasized
                          ? "2.5"
                          : "1.5"
                      }
                      opacity="0.95"
                    />

                    {/* Node body */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius}
                      fill="#0c1119"
                      stroke={
                        isEmphasized
                          ? "#ffffff"
                          : "rgba(226,232,240,0.55)"
                      }
                      strokeWidth={
                        isSelected
                          ? "2"
                          : "1"
                      }
                    />

                    {/* Node index */}
                    <text
                      x={node.x}
                      y={node.y + 4}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="12"
                      fontWeight="600"
                    >
                      {index + 1}
                    </text>

                    {/* User label */}
                    <text
                      x={node.x}
                      y={
                        node.y +
                        radius +
                        17
                      }
                      textAnchor="middle"
                      fill={
                        isEmphasized
                          ? "#ffffff"
                          : "#94a3b8"
                      }
                      fontSize="11"
                      fontWeight={
                        isEmphasized
                          ? "600"
                          : "400"
                      }
                    >
                      {nodeId}
                    </text>

                    {/* Community marker */}
                    <circle
                      cx={
                        node.x +
                        radius *
                          0.68
                      }
                      cy={
                        node.y -
                        radius *
                          0.68
                      }
                      r="4"
                      fill={communityColor}
                      stroke="#0b0e14"
                      strokeWidth="2"
                    />
                  </g>
                );
              }
            )}

            {/* Center explanation */}
            <g pointerEvents="none">
              <circle
                cx="430"
                cy="305"
                r="34"
                fill="rgba(11,14,20,0.82)"
                stroke="rgba(148,163,184,0.12)"
              />

              <text
                x="430"
                y="301"
                textAnchor="middle"
                fill="#64748b"
                fontSize="8"
                fontWeight="600"
                letterSpacing="1.2"
              >
                OBSERVED
              </text>

              <text
                x="430"
                y="314"
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="8"
                fontWeight="600"
                letterSpacing="1.2"
              >
                NETWORK
              </text>
            </g>
          </svg>

          {/* Graph controls / explanation */}
          <div className="absolute left-4 top-4 flex flex-col gap-2">
            <div className="rounded-lg border border-white/[0.06] bg-[#0b0f16]/90 px-3 py-2 backdrop-blur-sm">
              <p className="text-[9px] font-semibold tracking-[0.14em] text-slate-500">
                HOW TO READ
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                Larger nodes indicate higher structural influence.
              </p>
            </div>

            <div className="rounded-lg border border-white/[0.06] bg-[#0b0f16]/90 px-3 py-2 backdrop-blur-sm">
              <p className="text-[9px] font-semibold tracking-[0.14em] text-slate-500">
                INTERACTION
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                Lines represent observed relationships.
              </p>
            </div>
          </div>

          {/* Community legend */}
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
            {communities.map(
              (community, index) => (
                <div
                  key={`legend-${community}`}
                  className="flex items-center gap-2 rounded-md border border-white/[0.06] bg-[#0b0f16]/90 px-2.5 py-1.5 backdrop-blur-sm"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      background:
                        communityColors[
                          index %
                            communityColors.length
                        ],
                    }}
                  />

                  <span className="text-[9px] text-slate-400">
                    Community {community}
                  </span>
                </div>
              )
            )}
          </div>

          {/* Selected node */}
          {selectedNode && (
            <div className="absolute right-4 top-4 w-[260px] rounded-xl border border-white/[0.08] bg-[#0b0f16]/95 p-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[9px] font-semibold tracking-[0.15em] text-blue-400/70">
                    SELECTED PARTICIPANT
                  </span>

                  <strong className="mt-1 block text-sm text-white">
                    {selectedNode.user_id ||
                      selectedNode.id ||
                      selectedNode.name}
                  </strong>
                </div>

                <button
                  onClick={() =>
                    setSelectedNode(null)
                  }
                  className="text-lg leading-none text-slate-600 transition-colors hover:text-white"
                  aria-label="Close node details"
                >
                  ×
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5">
                  <small className="block text-[8px] tracking-wider text-slate-600">
                    COMMUNITY
                  </small>

                  <strong className="mt-1 block text-sm text-white">
                    {selectedNode.community ??
                      "—"}
                  </strong>
                </div>

                <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5">
                  <small className="block text-[8px] tracking-wider text-slate-600">
                    INFLUENCE
                  </small>

                  <strong className="mt-1 block text-sm text-white">
                    {selectedNode.influence_score ??
                      selectedNode.influence ??
                      "—"}
                  </strong>
                </div>

                <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5">
                  <small className="block text-[8px] tracking-wider text-slate-600">
                    PAGERANK
                  </small>

                  <strong className="mt-1 block text-sm text-slate-300">
                    {selectedNode.pagerank ??
                      "—"}
                  </strong>
                </div>

                <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5">
                  <small className="block text-[8px] tracking-wider text-slate-600">
                    BETWEENNESS
                  </small>

                  <strong className="mt-1 block text-sm text-slate-300">
                    {selectedNode.betweenness ??
                      "—"}
                  </strong>
                </div>
              </div>

              <p className="mt-3 text-[9px] leading-4 text-slate-600">
                Structural metrics describe the participant's
                position within the observed network.
              </p>
            </div>
          )}

          {!selectedNode && (
            <div className="absolute bottom-4 right-4 rounded-lg border border-white/[0.06] bg-[#0b0f16]/90 px-3 py-2 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Users size={13} className="text-slate-500" />

                <span className="text-[9px] font-medium text-slate-500">
                  Click a participant to inspect
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /*
   * ==============================
   * NETWORK PAGE
   * ==============================
   */

  const renderNetwork = () => (
    <>
      {renderTopbar(
        "Network Intelligence",
        "LINK ANALYSIS"
      )}

      <section className="dashboard">
        <div className="page-intro">
          <div>
            <p className="eyebrow">
              SOCIAL GRAPH
            </p>

            <h3>
              Influence & Communities
            </h3>

            <p>
              Explore relationships,
              influential users and information
              flow across the observed network.
            </p>
          </div>

          <div className="network-live">
            <span className="status-dot"></span>
            GRAPH ONLINE
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span>
              NETWORK NODES
            </span>

            <strong>
              {networkNodes}
            </strong>

            <small>
              Observed users
            </small>
          </div>

          <div className="stat-card">
            <span>
              CONNECTIONS
            </span>

            <strong>
              {networkLinks}
            </strong>

            <small>
              Interaction links
            </small>
          </div>

          <div className="stat-card">
            <span>
              COMMUNITIES
            </span>

            <strong>
              {communityCount}
            </strong>

            <small>
              Detected clusters
            </small>
          </div>

          <div className="stat-card">
            <span>
              PLATFORMS
            </span>

            <strong>
              {platformCount}
            </strong>

            <small>
              Observed sources
            </small>
          </div>
        </div>

        <div className="section-title">
          <span>
            NETWORK TOPOLOGY
          </span>
        </div>

        {renderNetworkGraph()}

        <div className="section-title">
          <span>
            INFLUENCE RANKING
          </span>
        </div>

        <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-400/10 bg-blue-400/[0.05] text-blue-300">
              <TrendingUp size={15} />
            </div>

            <div>
              <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500">
                HOW TO INTERPRET
              </p>

              <p className="mt-1 text-[10px] leading-5 text-slate-500">
                <span className="text-slate-300">PageRank</span> shows structural importance ·{" "}
                <span className="text-slate-300">Betweenness</span> shows bridge position ·{" "}
                <span className="text-slate-300">Influence</span> is the SocialSense influence signal.
              </p>
            </div>
          </div>
        </div>

        <div className="influence-card">
          {topInfluencers.map(
            (user, index) => {
              const isRankedSelected =
                selectedNode &&
                (
                  selectedNode.user_id ||
                  selectedNode.id ||
                  selectedNode.name
                ) === user.user_id;

              return (
                <button
                  type="button"
                  className={`influence-row w-full text-left transition-colors ${
                    isRankedSelected
                      ? "bg-blue-400/[0.045]"
                      : "hover:bg-white/[0.025]"
                  }`}
                  key={user.user_id}
                  onClick={() =>
                    inspectParticipant(
                      nodeMap[user.user_id] || user
                    )
                  }
                >
                  <div className="rank">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="user-icon">
                    <Users size={16} />
                  </div>

                  <div className="user-info">
                    <strong>
                      {user.user_id}
                    </strong>

                    <span>
                      Community{" "}
                      {user.community}
                    </span>
                  </div>

                  <div className="metric">
                    <small>
                      PageRank
                    </small>

                    <strong>
                      {user.pagerank}
                    </strong>
                  </div>

                  <div className="metric">
                    <small>
                      Betweenness
                    </small>

                    <strong>
                      {user.betweenness}
                    </strong>
                  </div>

                  <div className="influence-score">
                    <small>
                      Influence
                    </small>

                    <strong>
                      {user.influence_score}
                    </strong>
                  </div>

                  <ArrowUpRight
                    size={14}
                    className="mr-1 text-slate-700 transition-colors group-hover:text-blue-300"
                  />
                </button>
              );
            }
          )}
        </div>

        <div className="section-title">
          <span>
            NETWORK CONNECTIONS
          </span>
        </div>

        <div className="connections-grid">
          {network.links.map(
            (link, index) => {
              const isSelected =
                selectedConnection === index;

              return (
                <button
                  type="button"
                  className={`connection-card text-left transition-all ${
                    isSelected
                      ? "border-blue-400/25 bg-blue-400/[0.045]"
                      : "hover:border-white/[0.10] hover:bg-white/[0.025]"
                  }`}
                  key={index}
                  onClick={() =>
                    inspectConnection(
                      link,
                      index
                    )
                  }
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <strong>
                      {link.source}
                    </strong>

                    <ArrowUpRight size={15} />

                    <strong>
                      {link.target}
                    </strong>
                  </div>

                  <span>
                    {link.interaction}
                  </span>
                </button>
              );
            }
          )}
        </div>
      </section>
    </>
  );

  /*
   * ==============================
   * MONITORING PAGE
   * ==============================
   */

  const renderMonitoring = () => (
    <>
      {renderTopbar(
        "Propagation Monitoring",
        "INFORMATION FLOW"
      )}

      <section className="dashboard">
        {/* HEADER */}

        <div className="monitoring-hero">
          <div>
            <p className="eyebrow">
              REAL-TIME OBSERVATION
            </p>

            <h3>
              Monitor Information Flow
            </h3>

            <p>
              Observe how narratives move across
              users and platforms and identify
              unusual activity signals.
            </p>
          </div>

          <div className="monitoring-live-badge">
            <span className="status-dot"></span>

            <div>
              <strong>
                MONITORING ACTIVE
              </strong>

              <small>
                Intelligence stream connected
              </small>
            </div>
          </div>
        </div>

        {/* STATUS SUMMARY */}

        <div className="section-title">
          <span>
            MONITORING STATUS
          </span>
        </div>

        <div className="monitoring-stat-grid">
          <div className="monitoring-stat-card">
            <div className="monitoring-stat-icon">
              <Eye size={19} />
            </div>

            <div>
              <span>
                OBSERVED EVENTS
              </span>

              <strong>
                {loading
                  ? "—"
                  : propagation.length}
              </strong>

              <small>
                Information-flow events
              </small>
            </div>
          </div>

          <div className="monitoring-stat-card">
            <div className="monitoring-stat-icon">
              <Users size={19} />
            </div>

            <div>
              <span>
                USERS INVOLVED
              </span>

              <strong>
                {loading
                  ? "—"
                  : networkNodes}
              </strong>

              <small>
                Observed participants
              </small>
            </div>
          </div>

          <div className="monitoring-stat-card">
            <div className="monitoring-stat-icon">
              <Globe2 size={19} />
            </div>

            <div>
              <span>
                PLATFORMS
              </span>

              <strong>
                {loading
                  ? "—"
                  : platformCount}
              </strong>

              <small>
                Observed sources
              </small>
            </div>
          </div>

          <div className="monitoring-stat-card">
            <div className="monitoring-stat-icon">
              <Zap size={19} />
            </div>

            <div>
              <span>
                ACTIVITY LEVEL
              </span>

              <strong>
                {loading
                  ? "—"
                  : activityLevel}
              </strong>

              <small>
                Based on observed conversation activity and sentiment signals
              </small>
            </div>
          </div>
        </div>

        {/* INTELLIGENCE SIGNALS */}

        <div className="section-title">
          <span>
            INTELLIGENCE SIGNALS
          </span>
        </div>

        <div className="monitoring-grid">
          {/* SIGNAL CARD */}

          <div className="signal-panel">
            <div className="panel-heading">
              <div>
                <span>
                  SENTIMENT DISTRIBUTION
                </span>

                <strong>
                  Audience Signal Profile
                </strong>
              </div>

              <BarChart3 size={19} />
            </div>

            <div className="sentiment-bars">
              <div className="sentiment-row">
                <div>
                  <span>
                    Negative
                  </span>

                  <strong>
                    {negativePosts}
                  </strong>
                </div>

                <div className="sentiment-track">
                  <div
                    className="sentiment-fill negative"
                    style={{
                      width:
                        analyzedPosts > 0
                          ? `${
                              (negativePosts /
                                analyzedPosts) *
                              100
                            }%`
                          : "0%",
                    }}
                  ></div>
                </div>
              </div>

              <div className="sentiment-row">
                <div>
                  <span>
                    Positive
                  </span>

                  <strong>
                    {positivePosts}
                  </strong>
                </div>

                <div className="sentiment-track">
                  <div
                    className="sentiment-fill positive"
                    style={{
                      width:
                        analyzedPosts > 0
                          ? `${
                              (positivePosts /
                                analyzedPosts) *
                              100
                            }%`
                          : "0%",
                    }}
                  ></div>
                </div>
              </div>

              <div className="sentiment-row">
                <div>
                  <span>
                    Neutral
                  </span>

                  <strong>
                    {neutralPosts}
                  </strong>
                </div>

                <div className="sentiment-track">
                  <div
                    className="sentiment-fill neutral"
                    style={{
                      width:
                        analyzedPosts > 0
                          ? `${
                              (neutralPosts /
                                analyzedPosts) *
                              100
                            }%`
                          : "0%",
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* DOMINANT EMOTION */}
            <div className="mt-5 border-t border-white/[0.05] pt-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-[9px] font-semibold tracking-[0.16em] text-slate-600">
                    DOMINANT EMOTION
                  </span>

                  <strong className="mt-1 block text-sm text-white">
                    {loading
                      ? "—"
                      : emotionSummary.dominant || "No emotion signal"}
                  </strong>

                  <p className="mt-1 text-[10px] leading-4 text-slate-600">
                    {emotionSummary.dominant
                      ? `${emotionSummary.count} observed posts`
                      : "Waiting for emotion analysis output"}
                  </p>
                </div>

                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-right">
                  <span className="block text-[8px] tracking-wider text-slate-600">
                    EMOTION DATA
                  </span>

                  <strong className="mt-1 block text-xs text-slate-300">
                    {loading
                      ? "—"
                      : emotionSummary.total}
                  </strong>
                </div>
              </div>

              <p className="mt-3 text-[9px] leading-4 text-slate-700">
                Aggregate textual-expression signal; not a profile of any individual.
              </p>
            </div>
          </div>

          {/* PLATFORM ACTIVITY */}

          <div className="signal-panel">
            <div className="panel-heading">
              <div>
                <span>
                  SOURCE ACTIVITY
                </span>

                <strong>
                  Platform Distribution
                </strong>
              </div>

              <Globe2 size={19} />
            </div>

            <div className="platform-list">
              {platformActivity.length === 0 ? (
                <div className="monitoring-empty">
                  No platform activity available.
                </div>
              ) : (
                platformActivity.map(
                  ([platform, count]) => (
                    <div
                      className="platform-row"
                      key={platform}
                    >
                      <div className="platform-name">
                        <span className="platform-dot"></span>

                        <strong>
                          {platform}
                        </strong>
                      </div>

                      <div className="platform-count">
                        <span>
                          {count} posts
                        </span>

                        <div className="mini-track">
                          <div
                            style={{
                              width:
                                `${
                                  analyzedPosts > 0
                                    ? (count /
                                        analyzedPosts) *
                                      100
                                    : 0
                                }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </div>

        {/* ALERTS */}

        <div className="section-title">
          <span>
            ACTIVITY ALERTS
          </span>
        </div>

        <div className="alert-grid">
          <div className="alert-card">
            <div className="alert-icon">
              {negativePosts >
              positivePosts ? (
                <AlertTriangle size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
            </div>

            <div>
              <span>
                SENTIMENT SIGNAL
              </span>

              <strong>
                {negativePosts >
                positivePosts
                  ? "Negative sentiment dominates"
                  : "No dominant negative signal"}
              </strong>

              <p>
                {negativePosts} of{" "}
                {analyzedPosts} observed posts
                currently carry negative sentiment.
              </p>
            </div>
          </div>

          <div className="alert-card">
            <div className="alert-icon">
              <Activity size={18} />
            </div>

            <div>
              <span>
                PROPAGATION SIGNAL
              </span>

              <strong>
                {propagation.length > 0
                  ? "Information flow detected"
                  : "No propagation events"}
              </strong>

              <p>
                {propagation.length > 0
                  ? `${propagation.length} observed events are available for replay.`
                  : "The current dataset contains no propagation events."}
              </p>
            </div>
          </div>

          <div className="alert-card">
            <div className="alert-icon">
              <Network size={18} />
            </div>

            <div>
              <span>
                NETWORK SIGNAL
              </span>

              <strong>
                {networkLinks > 0
                  ? "Connected participant network"
                  : "Network awaiting data"}
              </strong>

              <p>
                {networkLinks} interaction
                links connect{" "}
                {networkNodes} observed
                participants.
              </p>
            </div>
          </div>
        </div>

        {/* PROPAGATION TIMELINE */}

        <div className="section-title">
          <span>
            PROPAGATION TIMELINE
          </span>
        </div>

        <div className="propagation-card">
          {propagation.length === 0 ? (
            <div className="monitoring-empty large">
              <MessageSquare size={24} />

              <strong>
                No propagation events available
              </strong>

              <span>
                Propagation data returned by the
                backend will appear here.
              </span>
            </div>
          ) : (
            propagation.map(
              (event, index) => (
                <div
                  className="propagation-row"
                  key={index}
                >
                  <div className="event-number">
                    {String(
                      index + 1
                    ).padStart(2, "0")}
                  </div>

                  <div className="event-time">
                    <Clock3 size={14} />

                    {event.timestamp
                      ? new Date(
                          event.timestamp
                        ).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "—"}
                  </div>

                  <div className="event-flow">
                    <strong>
                      {event.user ||
                        "Unknown"}
                    </strong>

                    <ArrowUpRight size={16} />

                    <strong>
                      {event.target_user ||
                        "ORIGIN"}
                    </strong>
                  </div>

                  <div className="event-type">
                    {event.interaction ||
                      "origin"}
                  </div>

                  <div className="event-text">
                    <MessageSquare
                      size={14}
                    />

                    <span>
                      {event.text ||
                        "Propagation event observed."}
                    </span>
                  </div>
                </div>
              )
            )
          )}
        </div>

        {/* MONITORING FOOTER */}

        <div className="monitoring-footer">
          <div>
            <Shield size={17} />

            <div>
              <strong>
                Intelligence monitoring engine
              </strong>

              <span>
                Monitoring is based on the
                currently observed social dataset.
              </span>
            </div>
          </div>

          <div className="monitoring-footer-status">
            <span className="status-dot"></span>
            SYSTEM {apiError
              ? "OFFLINE"
              : "OPERATIONAL"}
          </div>
        </div>
      </section>
    </>
  );

  /*
   * ==============================
   * PAGE ROUTER
   * ==============================
   */

  const renderPage = () => {
    switch (activePage) {
      case "narratives":
        return renderNarratives();

      case "network":
        return renderNetwork();

      case "monitoring":
        return renderMonitoring();

      case "overview":
      default:
        return renderOverview();
    }
  };

  /*
   * ==============================
   * APPLICATION
   * ==============================
   */

  return (
    <div className="app">
      {renderSidebar()}

      <main className="main">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;