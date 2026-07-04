"use client";

import { useState, useEffect, useRef } from "react";

export default function UserPortal() {
  // Layouts state
  const [layouts, setLayouts] = useState([]);
  const [loadingLayoutList, setLoadingLayoutList] = useState(true);
  const [selectedLayoutId, setSelectedLayoutId] = useState("");
  const [selectedLayoutName, setSelectedLayoutName] = useState("");
  const [layoutImage, setLayoutImage] = useState(null);
  const [loadingLayoutDetails, setLoadingLayoutDetails] = useState(false);

  // Plots state
  const [plots, setPlots] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const imageContainerRef = useRef(null);

  // Load layouts on mount
  useEffect(() => {
    fetchLayoutList();
  }, []);

  const fetchLayoutList = async () => {
    try {
      setLoadingLayoutList(true);
      const res = await fetch("/api/layout");
      const data = await res.json();
      if (res.ok) {
        setLayouts(data);
        if (data.length > 0) {
          // Select the first layout sheet by default
          setSelectedLayoutId(data[0]._id);
          setSelectedLayoutName(data[0].name);
          fetchLayoutDetails(data[0]._id);
        }
      }
    } catch (err) {
      console.error("Error loading layout list:", err);
    } finally {
      setLoadingLayoutList(false);
    }
  };

  const fetchLayoutDetails = async (layoutId) => {
    if (!layoutId) return;

    try {
      setLoadingLayoutDetails(true);
      setSelectedPlot(null); // Close tooltip on switch

      // 1. Fetch layout image details
      const layoutRes = await fetch(`/api/layout/${layoutId}`);
      const layoutData = await layoutRes.json();
      if (layoutRes.ok) {
        setLayoutImage(layoutData.image);
      } else {
        setLayoutImage(null);
      }

      // 2. Fetch associated plot markers
      const plotsRes = await fetch(`/api/plots?layoutId=${layoutId}`);
      const plotsData = await plotsRes.json();
      if (plotsRes.ok) {
        setPlots(plotsData);
      } else {
        setPlots([]);
      }
    } catch (err) {
      console.error("Error loading layout details:", err);
    } finally {
      setLoadingLayoutDetails(false);
    }
  };

  const handleLayoutChange = (layoutId) => {
    setSelectedLayoutId(layoutId);
    const name = layouts.find(l => l._id === layoutId)?.name || "Layout";
    setSelectedLayoutName(name);
    fetchLayoutDetails(layoutId);
  };

  // Capture canvas and download layout as PNG
  const handleDownloadLayout = async () => {
    if (!imageContainerRef.current) return;

    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(imageContainerRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        scale: 2, // High resolution scale
      });

      const dataUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      
      const safeName = selectedLayoutName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      downloadLink.download = `SSV_Layout_${safeName}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error("Error capturing layout:", error);
      alert("Failed to download the layout. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleMarkerClick = (plot, e) => {
    e.stopPropagation();
    setSelectedPlot(plot);
  };

  const closeTooltip = () => {
    setSelectedPlot(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
        return "var(--color-available)";
      case "Registered":
        return "var(--color-registered)";
      case "Booked":
        return "var(--color-booked)";
      case "On Hold":
        return "var(--color-onhold)";
      default:
        return "#fff";
    }
  };

  return (
    <div>
      {/* Top Navbar */}
      <nav className="admin-navbar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <img src="/logo.jpg" alt="Sri Sidhi Vinayakaa Logo" style={{ height: "60px", width: "60px", borderRadius: "50%", border: "1.5px solid var(--border-light)", objectFit: "cover" }} />
          <div className="logo-area">SRI SIDHI VINAYAKAA DEVELOPERS</div>
        </div>
        <div>
          {layoutImage && (
            <button className="btn btn-primary" onClick={handleDownloadLayout} disabled={downloading}>
              {downloading ? (
                <>
                  <div className="loading-spinner" style={{ width: 14, height: 14, marginRight: "0.5rem" }}></div>
                  Exporting...
                </>
              ) : (
                "Download Layout Plan"
              )}
            </button>
          )}
        </div>
      </nav>

      <div className="container fade-in">
        {/* Header Title */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1>Interactive Plot Layout</h1>
          <p>Select a layout drawing and click on any circular plot marker to view its dimensions.</p>
        </div>

        {/* Loading list state */}
        {loadingLayoutList ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: "1rem" }}>Fetching Layout Drawings...</p>
          </div>
        ) : layouts.length === 0 ? (
          // Empty sheets state
          <div className="glass-card" style={{ padding: "4rem 2rem", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
            <h2>No Layouts Configured</h2>
            <p style={{ marginTop: "1rem" }}>The administrator has not uploaded any plot layout drawings yet. Please check back later.</p>
          </div>
        ) : (
          <div>
            {/* Header Control Panel: Layout Selector Switcher & Stats Legends */}
            <div className="glass-card control-panel-grid">
              {/* Layout Switcher Selection */}
              <div>
                <label className="form-label" style={{ marginBottom: "0.4rem" }}>Select Layout Sheet</label>
                <select
                  className="form-select"
                  value={selectedLayoutId}
                  onChange={(e) => handleLayoutChange(e.target.value)}
                >
                  {layouts.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Legends list */}
              <div className="control-panel-legends">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--color-available)" }}></span>
                  <span>Available ({plots.filter((p) => p.status === "Available").length})</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--color-registered)" }}></span>
                  <span>Registered ({plots.filter((p) => p.status === "Registered").length})</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--color-booked)" }}></span>
                  <span>Booked ({plots.filter((p) => p.status === "Booked").length})</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--color-onhold)" }}></span>
                  <span>On Hold ({plots.filter((p) => p.status === "On Hold").length})</span>
                </div>
              </div>
            </div>

            {/* Layout Canvas Body */}
            {loadingLayoutDetails ? (
              <div style={{ textAlign: "center", padding: "5rem" }}>
                <div className="loading-spinner"></div>
                <p style={{ marginTop: "1rem" }}>Loading Interactive Canvas & Plots...</p>
              </div>
            ) : !layoutImage ? (
              <div className="glass-card" style={{ padding: "5rem", textAlign: "center" }}>
                <h3>Failed to load layout map drawing.</h3>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <div className="layout-container-outer">
                  <div className="layout-canvas-wrapper" ref={imageContainerRef}>
                    {/* Active layout map drawing */}
                    <img src={layoutImage} alt={`SSV Developers Layout - ${selectedLayoutName}`} className="layout-image" />

                    {/* Plot Overlays */}
                    {plots.map((plot) => (
                      <div
                        key={plot._id}
                        className={`plot-marker status-${plot.status.toLowerCase().replace(" ", "")} ${
                          selectedPlot?._id === plot._id ? "plot-marker-active" : ""
                        }`}
                        style={{
                          left: `${plot.x}%`,
                          top: `${plot.y}%`,
                        }}
                        onClick={(e) => handleMarkerClick(plot, e)}
                      >
                        {plot.plotNo}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Details Overlay Tooltip Card Modal */}
                {selectedPlot && (
                  <div className="modal-overlay" onClick={closeTooltip}>
                    <div
                      className="glass-card plot-detail-tooltip fade-in"
                      style={{ width: "320px" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="tooltip-title-row">
                        <span className="tooltip-title">Plot Details</span>
                        <button className="close-btn" onClick={closeTooltip} style={{ fontSize: "1.25rem", lineHeight: 1 }}>
                          &times;
                        </button>
                      </div>

                      <div className="tooltip-body">
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span className="tooltip-label">Plot Number:</span>
                          <span className="tooltip-value" style={{ fontSize: "1.1rem" }}>
                            {selectedPlot.plotNo}
                          </span>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span className="tooltip-label">Status:</span>
                          <span
                            className={`badge badge-${selectedPlot.status.toLowerCase().replace(" ", "")}`}
                            style={{
                              backgroundColor: getStatusColor(selectedPlot.status) + "22",
                              color: getStatusColor(selectedPlot.status),
                              borderColor: getStatusColor(selectedPlot.status),
                              fontSize: "0.85rem",
                              fontWeight: "bold",
                            }}
                          >
                            {selectedPlot.status}
                          </span>
                        </div>

                        {selectedPlot.customerName && (
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span className="tooltip-label">Customer:</span>
                            <span className="tooltip-value">{selectedPlot.customerName}</span>
                          </div>
                        )}

                        {selectedPlot.plotSize && (
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span className="tooltip-label">Plot Size:</span>
                            <span className="tooltip-value">{selectedPlot.plotSize}</span>
                          </div>
                        )}

                        {selectedPlot.facing && (
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span className="tooltip-label">Facing Direction:</span>
                            <span className="tooltip-value">{selectedPlot.facing}</span>
                          </div>
                        )}

                        {selectedPlot.bookingDate && (
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span className="tooltip-label">Date of Booking:</span>
                            <span className="tooltip-value">{selectedPlot.bookingDate}</span>
                          </div>
                        )}

                        {selectedPlot.registrationDate && (
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span className="tooltip-label">Date of Registration:</span>
                            <span className="tooltip-value">{selectedPlot.registrationDate}</span>
                          </div>
                        )}
                      </div>

                      <button
                        className="btn btn-secondary"
                        onClick={closeTooltip}
                        style={{ width: "100%", padding: "0.5rem", fontSize: "0.85rem", marginTop: "0.5rem" }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
