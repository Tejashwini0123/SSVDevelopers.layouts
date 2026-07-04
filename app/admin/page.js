"use client";

import { useState, useEffect, useRef } from "react";

export default function AdminPage() {
  // Session state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [submittingLogin, setSubmittingLogin] = useState(false);

  // Layouts state
  const [layouts, setLayouts] = useState([]);
  const [loadingLayoutList, setLoadingLayoutList] = useState(false);
  const [selectedLayoutId, setSelectedLayoutId] = useState("");
  const [layoutImage, setLayoutImage] = useState(null);
  const [loadingLayoutDetails, setLoadingLayoutDetails] = useState(false);

  // New Layout Modal state
  const [showAddLayoutModal, setShowAddLayoutModal] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState("");
  const [newLayoutFile, setNewLayoutFile] = useState(null);
  const [newLayoutFileBase64, setNewLayoutFileBase64] = useState("");
  const [submittingNewLayout, setSubmittingNewLayout] = useState(false);
  const [layoutModalError, setLayoutModalError] = useState("");

  // Plots state
  const [plots, setPlots] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState(null); // Plot being edited
  const [formPlotNo, setFormPlotNo] = useState("");
  const [formCustomerName, setFormCustomerName] = useState("");
  const [formPlotSize, setFormPlotSize] = useState("");
  const [formFacing, setFormFacing] = useState("");
  const [formBookingDate, setFormBookingDate] = useState("");
  const [formRegistrationDate, setFormRegistrationDate] = useState("");
  const [formStatus, setFormStatus] = useState("Available");
  const [formX, setFormX] = useState(0);
  const [formY, setFormY] = useState(0);
  const [isEditing, setIsEditing] = useState(false); // True if editing, false if placing new
  const [formError, setFormError] = useState("");
  const [submittingForm, setSubmittingForm] = useState(false);

  const fileInputRef = useRef(null);
  const imageContainerRef = useRef(null);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/check");
      if (res.ok) {
        setIsAuthenticated(true);
        fetchLayoutList();
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput.trim()) {
      setLoginError("Please enter both ID and Password.");
      return;
    }

    setLoginError("");
    setSubmittingLogin(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsAuthenticated(true);
        fetchLayoutList();
      } else {
        setLoginError(data.error || "Invalid username or password.");
      }
    } catch (err) {
      setLoginError("Failed to connect to login server.");
    } finally {
      setSubmittingLogin(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsAuthenticated(false);
      // Reset dashboard states
      setLayouts([]);
      setSelectedLayoutId("");
      setLayoutImage(null);
      setPlots([]);
      setSelectedPlot(null);
    } catch {
      alert("Failed to logout cleanly.");
    }
  };

  // Fetch list of layouts (metadata only)
  const fetchLayoutList = async (selectIdAfterFetch = null) => {
    try {
      setLoadingLayoutList(true);
      const res = await fetch("/api/layout");
      const data = await res.json();
      if (res.ok) {
        setLayouts(data);
        if (data.length > 0) {
          // If a specific ID is requested, select it. Otherwise select the first layout in list.
          const targetId = selectIdAfterFetch || data[0]._id;
          setSelectedLayoutId(targetId);
          fetchLayoutDetails(targetId);
        } else {
          setSelectedLayoutId("");
          setLayoutImage(null);
          setPlots([]);
        }
      }
    } catch (err) {
      console.error("Error fetching layout list:", err);
    } finally {
      setLoadingLayoutList(false);
    }
  };

  // Fetch details (image) of selected layout and its associated plots
  const fetchLayoutDetails = async (layoutId) => {
    if (!layoutId) return;

    try {
      setLoadingLayoutDetails(true);
      setSelectedPlot(null);
      setIsEditing(false);

      // 1. Fetch layout image
      const layoutRes = await fetch(`/api/layout/${layoutId}`);
      const layoutData = await layoutRes.json();
      if (layoutRes.ok) {
        setLayoutImage(layoutData.image);
      } else {
        setLayoutImage(null);
      }

      // 2. Fetch layout's plots
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
    fetchLayoutDetails(layoutId);
    resetPlotForm();
  };

  // Handle uploading and processing new layout file in modal
  const handleModalFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match("image.*")) {
      alert("Please upload an image file (PNG, JPG, or JPEG).");
      return;
    }

    setNewLayoutFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setNewLayoutFileBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Submit new Layout form
  const handleCreateLayoutSubmit = async (e) => {
    e.preventDefault();
    setLayoutModalError("");

    if (!newLayoutName.trim()) {
      setLayoutModalError("Layout Name is required.");
      return;
    }
    if (!newLayoutFileBase64) {
      setLayoutModalError("Layout Image drawing is required.");
      return;
    }

    setSubmittingNewLayout(true);
    try {
      const res = await fetch("/api/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newLayoutName.trim(),
          image: newLayoutFileBase64,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Clear modal form
        setNewLayoutName("");
        setNewLayoutFile(null);
        setNewLayoutFileBase64("");
        setShowAddLayoutModal(false);
        // Refresh and select new layout
        fetchLayoutList(data.layout._id);
      } else {
        setLayoutModalError(data.error || "Failed to create layout.");
      }
    } catch (err) {
      setLayoutModalError("Server connection error.");
    } finally {
      setSubmittingNewLayout(false);
    }
  };

  // Delete current Layout sheet and cascade delete plots
  const handleDeleteLayout = async () => {
    if (!selectedLayoutId) return;
    const currentLayoutName = layouts.find(l => l._id === selectedLayoutId)?.name || "Current Layout";
    if (!confirm(`WARNING: Are you sure you want to delete Layout Sheet "${currentLayoutName}"?\nThis will permanently delete ALL plot markers drawn on it!`)) return;

    try {
      const res = await fetch(`/api/layout/${selectedLayoutId}`, { method: "DELETE" });
      if (res.ok) {
        fetchLayoutList();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete layout.");
      }
    } catch {
      alert("Server error deleting layout.");
    }
  };

  // Handle clicking layout canvas to place or relocate a plot
  const handleLayoutClick = (e) => {
    if (!layoutImage || !selectedLayoutId) return;

    // Coords relative to layout container
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    const pctX = Math.round(clickX * 100) / 100;
    const pctY = Math.round(clickY * 100) / 100;

    if (isEditing && selectedPlot) {
      // Move active plot marker
      setFormX(pctX);
      setFormY(pctY);
    } else {
      // Create new plot marker
      setIsEditing(false);
      setSelectedPlot(null);
      setFormPlotNo("");
      setFormCustomerName("");
      setFormPlotSize("");
      setFormFacing("");
      setFormBookingDate("");
      setFormRegistrationDate("");
      setFormStatus("Available");
      setFormX(pctX);
      setFormY(pctY);
      setFormError("");
    }
  };

  // Handle clicking on an existing marker to edit/delete
  const handleMarkerClick = (plot, e) => {
    e.stopPropagation();
    setSelectedPlot(plot);
    setIsEditing(true);
    setFormPlotNo(plot.plotNo);
    setFormCustomerName(plot.customerName || "");
    setFormPlotSize(plot.plotSize || "");
    setFormFacing(plot.facing || "");
    setFormBookingDate(plot.bookingDate || "");
    setFormRegistrationDate(plot.registrationDate || "");
    setFormStatus(plot.status);
    setFormX(plot.x);
    setFormY(plot.y);
    setFormError("");
  };

  // Save changes to Plot
  const handlePlotFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formPlotNo.trim()) {
      setFormError("Plot No is mandatory.");
      return;
    }
    if (!selectedLayoutId) {
      setFormError("No Layout sheet selected.");
      return;
    }

    setSubmittingForm(true);

    const payload = {
      layoutId: selectedLayoutId,
      plotNo: formPlotNo.trim(),
      customerName: formCustomerName.trim(),
      plotSize: formPlotSize.trim(),
      facing: formFacing.trim(),
      bookingDate: formBookingDate,
      registrationDate: formRegistrationDate,
      status: formStatus,
      x: formX,
      y: formY,
    };

    try {
      let res;
      if (isEditing && selectedPlot) {
        res = await fetch(`/api/plots/${selectedPlot._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/plots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (res.ok) {
        // Refresh plot points
        fetchLayoutDetails(selectedLayoutId);
        resetPlotForm();
      } else {
        setFormError(data.error || "Failed to save plot.");
      }
    } catch {
      setFormError("Server connection error.");
    } finally {
      setSubmittingForm(false);
    }
  };

  const handlePlotDelete = async () => {
    if (!selectedPlot) return;
    if (!confirm(`Are you sure you want to delete Plot No: ${selectedPlot.plotNo}?`)) return;

    try {
      const res = await fetch(`/api/plots/${selectedPlot._id}`, { method: "DELETE" });
      if (res.ok) {
        fetchLayoutDetails(selectedLayoutId);
        resetPlotForm();
      } else {
        const data = await res.json();
        setFormError(data.error || "Failed to delete plot.");
      }
    } catch {
      setFormError("Server error deleting plot.");
    }
  };

  const resetPlotForm = () => {
    setSelectedPlot(null);
    setIsEditing(false);
    setFormPlotNo("");
    setFormCustomerName("");
    setFormPlotSize("");
    setFormFacing("");
    setFormBookingDate("");
    setFormRegistrationDate("");
    setFormStatus("Available");
    setFormX(0);
    setFormY(0);
    setFormError("");
  };

  if (checkingAuth) {
    return (
      <div className="admin-login-wrapper">
        <div style={{ textAlign: "center" }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: "1rem" }}>Verifying Session...</p>
        </div>
      </div>
    );
  }

  // --- LOGIN PANEL VIEW ---
  if (!isAuthenticated) {
    return (
      <div className="admin-login-wrapper">
        <div className="glass-card admin-login-card fade-in">
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "1.75rem", marginBottom: "0.25rem" }}>Admin Portal</h1>
            <p style={{ fontSize: "0.9rem" }}>SSV Developers Layouts System</p>
          </div>

          {loginError && <div className="error-message">{loginError}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">Admin ID</label>
              <input
                id="username"
                className="form-input"
                type="text"
                placeholder="Enter ID"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                disabled={submittingLogin}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: "2rem" }}>
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                className="form-input"
                type="password"
                placeholder="Enter Password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                disabled={submittingLogin}
                required
              />
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              style={{ width: "100%" }}
              disabled={submittingLogin}
            >
              {submittingLogin ? <div className="loading-spinner" style={{ width: 16, height: 16 }}></div> : "Login to Dashboard"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- DASHBOARD WORKSPACE VIEW ---
  return (
    <div>
      {/* Top Navigation */}
      <nav className="admin-navbar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <img src="/logo.jpg" alt="Sri Sidhi Vinayakaa Logo" style={{ height: "90px", width: "90px", borderRadius: "50%", border: "1.5px solid var(--border-light)", objectFit: "cover" }} />
          <div className="logo-area">SRI SIDHI VINAYAKAA DEVELOPERS | ADMIN PANEL</div>
        </div>
        <div>
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="container">
        {loadingLayoutList ? (
          <div style={{ textAlign: "center", padding: "5rem" }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: "1rem" }}>Loading Layout Configurations...</p>
          </div>
        ) : layouts.length === 0 ? (
          // Empty State: Prompt to create first named layout sheet
          <div className="glass-card fade-in" style={{ padding: "4rem 2rem", textAlign: "center", maxWidth: "600px", margin: "2rem auto" }}>
            <h2>Create Your First Layout Sheet</h2>
            <p style={{ marginTop: "1rem", marginBottom: "2rem" }}>
              Add a layout sheet (e.g. "Phase 1" or "Main Layout") and upload its background drawing to begin.
            </p>
            <button className="btn btn-primary" onClick={() => setShowAddLayoutModal(true)}>
              Create Layout Sheet
            </button>
          </div>
        ) : (
          <div className="admin-layout-grid fade-in">
            {/* Left Sidebar for Configurations */}
            <div className="admin-sidebar">
              {/* Layout Sheets Selection Card */}
              <div className="glass-card">
                <h2>Layout Sheet Selector</h2>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <select
                    className="form-select"
                    value={selectedLayoutId}
                    onChange={(e) => handleLayoutChange(e.target.value)}
                    style={{ flex: 1 }}
                  >
                    {layouts.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowAddLayoutModal(true)}
                    style={{ padding: "0.75rem", fontSize: "1.1rem" }}
                    title="Add Layout Sheet"
                  >
                    +
                  </button>
                </div>
                {selectedLayoutId && (
                  <button
                    className="btn btn-secondary"
                    onClick={handleDeleteLayout}
                    style={{ width: "100%", marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--color-registered)" }}
                  >
                    Delete Layout Sheet
                  </button>
                )}
              </div>

              {/* Plot Form Card */}
              <div className="glass-card">
                <h2>{isEditing ? `Edit Plot: ${selectedPlot?.plotNo}` : "Create Plot Marker"}</h2>

                {formError && <div className="error-message">{formError}</div>}

                {isEditing && (
                  <div className="info-banner">
                    💡 Click anywhere on the layout image to move this rectangular marker to a new position.
                  </div>
                )}
                {!isEditing && formX === 0 && formY === 0 && (
                  <div className="info-banner">
                    💡 Click on the layout image to choose where to place a new rectangular marker.
                  </div>
                )}

                <form onSubmit={handlePlotFormSubmit}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="plotNo">Plot No *</label>
                    <input
                      id="plotNo"
                      className="form-input"
                      type="text"
                      placeholder="e.g. 25"
                      value={formPlotNo}
                      onChange={(e) => setFormPlotNo(e.target.value)}
                      disabled={submittingForm}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="status">Status *</label>
                    <select
                      id="status"
                      className="form-select"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      disabled={submittingForm}
                    >
                      <option value="Available">Available (Green)</option>
                      <option value="Registered">Registered (Red)</option>
                      <option value="Booked">Booked (Blue)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="customer">Customer Name</label>
                    <input
                      id="customer"
                      className="form-input"
                      type="text"
                      placeholder="e.g. Rahul Sharma (Optional)"
                      value={formCustomerName}
                      onChange={(e) => setFormCustomerName(e.target.value)}
                      disabled={submittingForm}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="size">Plot Size</label>
                    <input
                      id="size"
                      className="form-input"
                      type="text"
                      placeholder="e.g. 1200 Sq.Ft (Optional)"
                      value={formPlotSize}
                      onChange={(e) => setFormPlotSize(e.target.value)}
                      disabled={submittingForm}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="facing">Facing Direction</label>
                    <input
                      id="facing"
                      className="form-input"
                      type="text"
                      placeholder="e.g. East Facing (Optional)"
                      value={formFacing}
                      onChange={(e) => setFormFacing(e.target.value)}
                      disabled={submittingForm}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="bookingDate">Date of Booking</label>
                    <input
                      id="bookingDate"
                      className="form-input"
                      type="date"
                      value={formBookingDate}
                      onChange={(e) => setFormBookingDate(e.target.value)}
                      disabled={submittingForm}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="registrationDate">Date of Registration</label>
                    <input
                      id="registrationDate"
                      className="form-input"
                      type="date"
                      value={formRegistrationDate}
                      onChange={(e) => setFormRegistrationDate(e.target.value)}
                      disabled={submittingForm}
                    />
                  </div>

                  {/* Position coordinates indicator */}
                  <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    <div>X: <strong style={{ color: "var(--text-main)" }}>{formX}%</strong></div>
                    <div>Y: <strong style={{ color: "var(--text-main)" }}>{formY}%</strong></div>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      className="btn btn-primary"
                      type="submit"
                      style={{ flex: 1 }}
                      disabled={submittingForm || (formX === 0 && formY === 0)}
                    >
                      {submittingForm ? <div className="loading-spinner" style={{ width: 14, height: 14 }}></div> : isEditing ? "Save Changes" : "Place Marker"}
                    </button>

                    {(isEditing || formX > 0 || formY > 0) && (
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={resetPlotForm}
                        disabled={submittingForm}
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {isEditing && (
                    <button
                      className="btn btn-danger"
                      type="button"
                      onClick={handlePlotDelete}
                      style={{ width: "100%", marginTop: "0.75rem" }}
                      disabled={submittingForm}
                    >
                      Delete Marker
                    </button>
                  )}
                </form>
              </div>

              {/* Sidebar list of plots in current layout */}
              <div className="glass-card" style={{ flex: 1, minHeight: 0 }}>
                <h2>Plots in Layout ({plots.length})</h2>
                {plots.length === 0 ? (
                  <div className="empty-state">No plot markers created yet. Click on the layout drawing to drop the first rectangle.</div>
                ) : (
                  <div className="plots-list-container">
                    {plots.map((plot) => (
                      <div
                        key={plot._id}
                        className={`plot-list-item ${selectedPlot?._id === plot._id ? "plot-marker-active" : ""}`}
                        onClick={(e) => handleMarkerClick(plot, e)}
                      >
                        <div>
                          <strong style={{ color: "var(--text-main)" }}>Plot #{plot.plotNo}</strong>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {plot.facing && `${plot.facing} | `}{plot.plotSize || "Size not set"}
                          </div>
                        </div>
                        <span className={`badge badge-${plot.status.toLowerCase().replace(" ", "")}`}>
                          {plot.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Interactive Canvas Viewer */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="glass-card" style={{ padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
                    Canvas Layout: {layouts.find((l) => l._id === selectedLayoutId)?.name}
                  </h2>
                  <p style={{ fontSize: "0.85rem" }}>
                    Click on the layout map to choose marker coordinates. Relocate placed markers instantly.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <span className="badge badge-available">Available ({plots.filter(p => p.status === "Available").length})</span>
                  <span className="badge badge-registered">Registered ({plots.filter(p => p.status === "Registered").length})</span>
                  <span className="badge badge-booked">Booked ({plots.filter(p => p.status === "Booked").length})</span>
                </div>
              </div>

              <div className="layout-container-outer">
                {loadingLayoutDetails ? (
                  <div style={{ padding: "5rem", textAlign: "center" }}>
                    <div className="loading-spinner"></div>
                    <p style={{ marginTop: "1rem" }}>Fetching Layout Drawing & Plots...</p>
                  </div>
                ) : !layoutImage ? (
                  <div className="glass-card" style={{ padding: "5rem", textAlign: "center" }}>
                    <h3>Layout sheet image failed to load.</h3>
                  </div>
                ) : (
                  <div className="layout-canvas-wrapper" ref={imageContainerRef}>
                    {/* Base drawing */}
                    <img
                      src={layoutImage}
                      alt="SSV Developers Layout Map"
                      className="layout-image"
                      onClick={handleLayoutClick}
                    />

                    {/* Plots rectangles with number labels */}
                    {plots.map((plot) => (
                      <div
                        key={plot._id}
                        className={`plot-marker status-${plot.status.toLowerCase().replace(" ", "")} ${selectedPlot?._id === plot._id ? "plot-marker-active" : ""}`}
                        style={{
                          left: `${plot.x}%`,
                          top: `${plot.y}%`,
                        }}
                        title={`Plot ${plot.plotNo}: ${plot.status}`}
                        onClick={(e) => handleMarkerClick(plot, e)}
                      >
                        {plot.plotNo}
                      </div>
                    ))}

                    {/* Placing rectangle template */}
                    {!isEditing && (formX > 0 || formY > 0) && (
                      <div
                        className={`plot-marker status-${formStatus.toLowerCase().replace(" ", "")} plot-marker-active`}
                        style={{
                          left: `${formX}%`,
                          top: `${formY}%`,
                          animation: "pulse 1.5s infinite"
                        }}
                      >
                        +
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE NEW LAYOUT SHEET POP-UP MODAL */}
      {showAddLayoutModal && (
        <div className="modal-overlay" onClick={() => setShowAddLayoutModal(false)}>
          <div className="glass-card modal-content-card fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Layout Sheet</h2>
              <button className="close-btn" onClick={() => setShowAddLayoutModal(false)}>
                &times;
              </button>
            </div>

            {layoutModalError && <div className="error-message">{layoutModalError}</div>}

            <form onSubmit={handleCreateLayoutSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="layoutName">Layout Name *</label>
                <input
                  id="layoutName"
                  className="form-input"
                  type="text"
                  placeholder="e.g. Phase 1 / Sector B"
                  value={newLayoutName}
                  onChange={(e) => setNewLayoutName(e.target.value)}
                  disabled={submittingNewLayout}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "2rem" }}>
                <label className="form-label" htmlFor="layoutFile">Layout Image drawing *</label>
                <input
                  id="layoutFile"
                  className="form-input"
                  type="file"
                  onChange={handleModalFileChange}
                  accept="image/png, image/jpeg, image/jpg"
                  disabled={submittingNewLayout}
                  required
                />
                {newLayoutFileBase64 && (
                  <div style={{ marginTop: "1rem", maxHeight: "150px", overflow: "hidden", border: "1px solid var(--border-light)", borderRadius: "8px" }}>
                    <img src={newLayoutFileBase64} alt="Preview" style={{ width: "100%", height: "auto", display: "block" }} />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="btn btn-primary"
                  type="submit"
                  style={{ flex: 1 }}
                  disabled={submittingNewLayout}
                >
                  {submittingNewLayout ? <div className="loading-spinner" style={{ width: 14, height: 14 }}></div> : "Create Layout"}
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setShowAddLayoutModal(false)}
                  disabled={submittingNewLayout}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(109, 40, 217, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(109, 40, 217, 0); }
          100% { box-shadow: 0 0 0 0 rgba(109, 40, 217, 0); }
        }
      `}</style>
    </div>
  );
}
