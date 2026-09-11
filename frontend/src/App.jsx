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

const API_BASE_URL = "http://127.0.0.1:8000";

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

  const [loading, setLoading] = useState(true);

  const [apiError, setApiError] = useState(false);

  const [selectedNode, setSelectedNode] = useState(null);

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
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/intelligence`),
        axios.get(`${API_BASE_URL}/network`),
        axios.get(`${API_BASE_URL}/trends`),
        axios.get(`${API_BASE_URL}/propagation`),
        axios.get(`${API_BASE_URL}/topics`),
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

    const centerX = 430;
    const centerY = 280;

    const radius = Math.min(
      210,
      80 + nodes.length * 12
    );

    return nodes.map(
      (node, index) => {
        const userId =
          node.user_id ||
          node.id ||
          node.name;

        const intelligenceUser =
          intelligence.find(
            (post) =>
              post.user_id === userId
          );

        const angle =
          (2 * Math.PI * index) /
            nodes.length -
          Math.PI / 2;

        const x =
          centerX +
          radius *
            Math.cos(angle);

        const y =
          centerY +
          radius *
            Math.sin(angle);

        return {
          ...node,

          user_id: userId,

          community:
            node.community ??
            intelligenceUser?.community ??
            null,

          pagerank:
            node.pagerank ??
            intelligenceUser?.pagerank ??
            0,

          betweenness:
            node.betweenness ??
            intelligenceUser?.betweenness ??
            0,

          influence_score:
            node.influence_score ??
            intelligenceUser?.influence_score ??
            0,

          x,
          y,
        };
      }
    );
  }, [
    network.nodes,
    intelligence,
  ]);

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
  };

  /*
   * ==============================
   * SIDEBAR
   * ==============================
   */

  const renderSidebar = () => (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Radio size={20} />
        </div>

        <div>
          <h1>
            SocialSense
          </h1>

          <span>
            INTELLIGENCE PLATFORM
          </span>
        </div>
      </div>

      <nav className="navigation">
        <button
          className={`nav-item ${
            activePage === "overview"
              ? "active"
              : ""
          }`}
          onClick={() =>
            handleNavigation(
              "overview"
            )
          }
        >
          <Activity size={18} />

          <span>
            Overview
          </span>
        </button>

        <button
          className={`nav-item ${
            activePage === "narratives"
              ? "active"
              : ""
          }`}
          onClick={() =>
            handleNavigation(
              "narratives"
            )
          }
        >
          <TrendingUp size={18} />

          <span>
            Narratives
          </span>
        </button>

        <button
          className={`nav-item ${
            activePage === "network"
              ? "active"
              : ""
          }`}
          onClick={() =>
            handleNavigation(
              "network"
            )
          }
        >
          <Network size={18} />

          <span>
            Network
          </span>
        </button>

        <button
          className={`nav-item ${
            activePage === "monitoring"
              ? "active"
              : ""
          }`}
          onClick={() =>
            handleNavigation(
              "monitoring"
            )
          }
        >
          <Shield size={18} />

          <span>
            Monitoring
          </span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="status-dot"></div>

        <div>
          <strong>
            {apiError
              ? "API Offline"
              : "System Online"}
          </strong>

          <span>
            {apiError
              ? "Backend connection failed"
              : "Intelligence engine active"}
          </span>
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
      {renderTopbar(
        "Operational Overview"
      )}

      <section className="dashboard">
        <div className="welcome-card">
          <div>
            <p className="eyebrow">
              SOCIALSENSE CORE
            </p>

            <h3>
              Monitor narratives.
              <br />
              Understand influence.
              <br />
              Track propagation.
            </h3>

            <p className="description">
              AI-powered analysis of social
              conversations, communities and
              information flow.
            </p>
          </div>

          <div className="radar">
            <div className="radar-ring ring-one"></div>

            <div className="radar-ring ring-two"></div>

            <div className="radar-ring ring-three"></div>

            <div className="radar-core">
              <Activity size={28} />
            </div>
          </div>
        </div>

        <div className="section-title">
          <span>
            INTELLIGENCE SNAPSHOT
          </span>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span>
              ACTIVE NARRATIVES
            </span>

            <strong>
              {loading
                ? "—"
                : "01"}
            </strong>

            <small>
              Currently detected
            </small>
          </div>

          <div className="stat-card">
            <span>
              ANALYZED POSTS
            </span>

            <strong>
              {loading
                ? "—"
                : analyzedPosts}
            </strong>

            <small>
              Across{" "}
              {loading
                ? "—"
                : platformCount}{" "}
              platforms
            </small>
          </div>

          <div className="stat-card">
            <span>
              NETWORK NODES
            </span>

            <strong>
              {loading
                ? "—"
                : networkNodes}
            </strong>

            <small>
              Observed users
            </small>
          </div>

          <div className="stat-card">
            <span>
              COMMUNITIES
            </span>

            <strong>
              {loading
                ? "—"
                : communityCount}
            </strong>

            <small>
              Detected clusters
            </small>
          </div>
        </div>

        {apiError && (
          <div className="api-error">
            <strong>
              Intelligence API unavailable
            </strong>

            <span>
              Make sure FastAPI is running on
              127.0.0.1:8000.
            </span>
          </div>
        )}

        <div className="section-title">
          <span>
            ANALYTICS MODULES
          </span>
        </div>

        <div className="module-grid">
          <button
            className="module-card"
            onClick={() =>
              handleNavigation(
                "narratives"
              )
            }
          >
            <TrendingUp size={22} />

            <h3>
              Narrative Detection
            </h3>

            <p>
              Identify emerging topics and
              changes in conversation velocity.
            </p>
          </button>

          <button
            className="module-card"
            onClick={() =>
              handleNavigation(
                "network"
              )
            }
          >
            <Network size={22} />

            <h3>
              Network Intelligence
            </h3>

            <p>
              Discover influential users,
              communities and propagation paths.
            </p>
          </button>

          <button
            className="module-card"
            onClick={() =>
              handleNavigation(
                "monitoring"
              )
            }
          >
            <Shield size={22} />

            <h3>
              Audience Intelligence
            </h3>

            <p>
              Analyze sentiment and emotional
              signals across social communities.
            </p>
          </button>
        </div>
      </section>
    </>
  );

  /*
   * ==============================
   * NARRATIVES PAGE
   * ==============================
   */

  const renderNarratives = () => (
    <>
      {renderTopbar(
        "Narrative Intelligence",
        "NARRATIVE DETECTION"
      )}

      <section className="dashboard">
        <div className="page-intro">
          <div>
            <p className="eyebrow">
              ACTIVE NARRATIVE
            </p>

            <h3>
              Fuel Price Discussion
            </h3>

            <p>
              Tracking the evolution of the
              conversation across observed
              social platforms.
            </p>
          </div>

          <div className="trend-status">
            <TrendingUp size={18} />

            <span>
              {trends?.status ||
                "ANALYZING"}
            </span>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span>
              POST VOLUME
            </span>

            <strong>
              {loading
                ? "—"
                : analyzedPosts}
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
              {trends
                ? `${trends.growth_rate}%`
                : "—"}
            </strong>

            <small>
              Conversation velocity
            </small>
          </div>

          <div className="stat-card">
            <span>
              NEGATIVE SIGNALS
            </span>

            <strong>
              {loading
                ? "—"
                : negativePosts}
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
              {loading
                ? "—"
                : positivePosts}
            </strong>

            <small>
              Posts with positive sentiment
            </small>
          </div>
        </div>

        <div className="section-title">
          <span>
            TOPIC SIGNALS
          </span>
        </div>

        <div className="topic-grid">
  {topics.length > 0 ? (
    topics.map((topic, index) => (
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
          Detected by TF-IDF
        </small>
      </div>
    ))
  ) : (
    <div className="topic-card">
      <span>--</span>

      <strong>
        No topics detected
      </strong>

      <small>
        Waiting for conversation data
      </small>
    </div>
  )}
</div>

        <div className="section-title">
          <span>
            CONVERSATION TIMELINE
          </span>
        </div>

        <div className="timeline-card">
          {trends?.timeline?.map(
            (item, index) => (
              <div
                className="timeline-row"
                key={index}
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
                      width:
                        `${Math.min(
                          item.post_count *
                            35,
                          100
                        )}%`,
                    }}
                  ></div>
                </div>

                <strong>
                  {item.post_count}
                </strong>
              </div>
            )
          )}
        </div>
      </section>
    </>
  );

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

    return (
      <div className="network-graph-card">
        <div className="graph-header">
          <div>
            <strong>
              SOCIAL NETWORK TOPOLOGY
            </strong>

            <span>
              Influence, relationships and community structure
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
          </div>
        </div>

        <div className="graph-container">
          <svg
            className="network-svg"
            viewBox="0 0 860 560"
            preserveAspectRatio="xMidYMid meet"
          >
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

                return (
                  <g key={index}>
                    <line
                      className="graph-link"
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                    />

                    <circle
                      className="graph-link-point"
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
                      r="2"
                    />
                  </g>
                );
              }
            )}

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

                const radius =
                  Math.max(
                    18,
                    Math.min(
                      32,
                      18 +
                        influence *
                          45
                    )
                  );

                const community =
                  Number(
                    node.community || 0
                  );

                const isSelected =
                  selectedNode &&
                  (
                    selectedNode.user_id ||
                    selectedNode.id ||
                    selectedNode.name
                  ) === nodeId;

                return (
                  <g
                    key={nodeId}
                    className={`graph-node ${
                      isSelected
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedNode(
                        node
                      )
                    }
                  >
                    <circle
                      className="node-glow"
                      cx={node.x}
                      cy={node.y}
                      r={radius + 9}
                    />

                    <circle
                      className={`community-ring community-${
                        community % 4
                      }`}
                      cx={node.x}
                      cy={node.y}
                      r={radius + 5}
                    />

                    <circle
                      className="node-circle"
                      cx={node.x}
                      cy={node.y}
                      r={radius}
                    />

                    <text
                      className="node-index"
                      x={node.x}
                      y={node.y + 3}
                      textAnchor="middle"
                    >
                      {index + 1}
                    </text>

                    <text
                      className="node-label"
                      x={node.x}
                      y={
                        node.y +
                        radius +
                        17
                      }
                      textAnchor="middle"
                    >
                      {nodeId}
                    </text>
                  </g>
                );
              }
            )}
          </svg>

          {selectedNode && (
            <div className="selected-node-panel">
              <div className="selected-node-header">
                <div>
                  <span>
                    SELECTED NODE
                  </span>

                  <strong>
                    {
                      selectedNode.user_id ||
                      selectedNode.id ||
                      selectedNode.name
                    }
                  </strong>
                </div>

                <button
                  onClick={() =>
                    setSelectedNode(null)
                  }
                  aria-label="Close node details"
                >
                  ×
                </button>
              </div>

              <div className="selected-node-metrics">
                <div>
                  <small>
                    COMMUNITY
                  </small>

                  <strong>
                    {selectedNode.community ??
                      "—"}
                  </strong>
                </div>

                <div>
                  <small>
                    PAGERANK
                  </small>

                  <strong>
                    {selectedNode.pagerank ??
                      "—"}
                  </strong>
                </div>

                <div>
                  <small>
                    BETWEENNESS
                  </small>

                  <strong>
                    {selectedNode.betweenness ??
                      "—"}
                  </strong>
                </div>

                <div>
                  <small>
                    INFLUENCE
                  </small>

                  <strong>
                    {selectedNode.influence_score ??
                      selectedNode.influence ??
                      "—"}
                  </strong>
                </div>
              </div>

              <p>
                Node represents an observed participant
                in the social information network.
              </p>
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

        <div className="influence-card">
          {topInfluencers.map(
            (user, index) => (
              <div
                className="influence-row"
                key={user.user_id}
              >
                <div className="rank">
                  0{index + 1}
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
              </div>
            )
          )}
        </div>

        <div className="section-title">
          <span>
            NETWORK CONNECTIONS
          </span>
        </div>

        <div className="connections-grid">
          {network.links.map(
            (link, index) => (
              <div
                className="connection-card"
                key={index}
              >
                <strong>
                  {link.source}
                </strong>

                <ArrowUpRight size={15} />

                <strong>
                  {link.target}
                </strong>

                <span>
                  {link.interaction}
                </span>
              </div>
            )
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
                Derived from sentiment activity
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