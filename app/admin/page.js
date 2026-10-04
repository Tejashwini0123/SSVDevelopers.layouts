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

  // View tabs & Customers state
  const [activeTab, setActiveTab] = useState("canvas"); // "canvas" | "customers" | "regCustomers"
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerForm, setCustomerForm] = useState({
    customerName: "",
    dateOfBooking: "",
    plotNo: "",
    sqYards: "",
    sqYardCost: "",
    facing: "",
    facingCharges: "",
    paidAmount: "",
    tlName: "",
  });
  const [customerFormError, setCustomerFormError] = useState("");
  const [submittingCustomer, setSubmittingCustomer] = useState(false);

  // Reg.Customers state
  const [regCustomers, setRegCustomers] = useState([]);
  const [loadingRegCustomers, setLoadingRegCustomers] = useState(false);
  const [showRegCustomerForm, setShowRegCustomerForm] = useState(false);
  const [editingRegCustomer, setEditingRegCustomer] = useState(null);
  const [regCustomerForm, setRegCustomerForm] = useState({
    sNo: "",
    customerName: "",
    sqYards: "",
    facing: "",
    regDate: "",
    documentNo: "",
  });
  const [regCustomerFormError, setRegCustomerFormError] = useState("");
  const [submittingRegCustomer, setSubmittingRegCustomer] = useState(false);

  const fileInputRef = useRef(null);
  const imageContainerRef = useRef(null);
  const customerTableCardRef = useRef(null);
  const downloadMenuRef = useRef(null);
  const regCustomerTableCardRef = useRef(null);
  const regDownloadMenuRef = useRef(null);

  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [downloadingTable, setDownloadingTable] = useState(false);
  const [showRegDownloadMenu, setShowRegDownloadMenu] = useState(false);
  const [downloadingRegTable, setDownloadingRegTable] = useState(false);

  // Close download dropdowns on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) {
        setShowDownloadMenu(false);
      }
      if (regDownloadMenuRef.current && !regDownloadMenuRef.current.contains(e.target)) {
        setShowRegDownloadMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

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
      setCustomers([]);
      setRegCustomers([]);
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
          fetchCustomers(targetId);
          fetchRegCustomers(targetId);
        } else {
          setSelectedLayoutId("");
          setLayoutImage(null);
          setPlots([]);
          setCustomers([]);
          setRegCustomers([]);
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
    fetchCustomers(layoutId);
    fetchRegCustomers(layoutId);
    resetPlotForm();
    setShowCustomerForm(false);
    setEditingCustomer(null);
    setShowRegCustomerForm(false);
    setEditingRegCustomer(null);
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

  // Customers Management Handlers (Strictly bound to selectedLayoutId)
  const fetchCustomers = async (layoutId = selectedLayoutId) => {
    if (!layoutId) {
      setCustomers([]);
      return;
    }
    try {
      setLoadingCustomers(true);
      const res = await fetch(`/api/customers?layoutId=${layoutId}`);
      const data = await res.json();
      if (res.ok) {
        const list = Array.isArray(data) ? data : [];
        list.sort((a, b) => {
          const dateA = a.dateOfBooking?.trim();
          const dateB = b.dateOfBooking?.trim();
          if (dateA && dateB && dateA !== dateB) {
            return dateA.localeCompare(dateB);
          }
          if (dateA && !dateB) return -1;
          if (!dateA && dateB) return 1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        setCustomers(list);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleOpenAddCustomer = () => {
    setEditingCustomer(null);
    setCustomerForm({
      customerName: "",
      dateOfBooking: new Date().toISOString().split("T")[0],
      plotNo: "",
      sqYards: "",
      sqYardCost: "",
      facing: "",
      facingCharges: "",
      paidAmount: "",
      tlName: "",
    });
    setCustomerFormError("");
    setShowCustomerForm(true);
  };

  const handleOpenEditCustomer = (cust) => {
    setEditingCustomer(cust);
    setCustomerForm({
      customerName: cust.customerName || "",
      dateOfBooking: cust.dateOfBooking || "",
      plotNo: cust.plotNo || "",
      sqYards: cust.sqYards ?? "",
      sqYardCost: cust.sqYardCost ?? "",
      facing: cust.facing || "",
      facingCharges: cust.facingCharges ?? "",
      paidAmount: cust.paidAmount ?? "",
      tlName: cust.tlName || "",
    });
    setCustomerFormError("");
    setShowCustomerForm(true);
  };

  const handleCustomerPlotNoChange = (enteredPlotNo) => {
    const trimmed = enteredPlotNo.trim();
    const matchedPlot = plots.find(
      (p) => String(p.plotNo).trim().toLowerCase() === trimmed.toLowerCase()
    );

    let autoSqYards = customerForm.sqYards;

    if (matchedPlot && matchedPlot.plotSize) {
      // Extract numeric sq yards if present (e.g. "200", "150 Sq Yards", "133.33")
      const match = matchedPlot.plotSize.match(/[\d.]+/);
      if (match) {
        autoSqYards = match[0];
      }
    }

    setCustomerForm((prev) => ({
      ...prev,
      plotNo: enteredPlotNo,
      sqYards: autoSqYards,
    }));
  };

  const handleCustomerFormSubmit = async (e) => {
    e.preventDefault();
    setCustomerFormError("");

    if (!selectedLayoutId) {
      setCustomerFormError("Please select a layout sheet first.");
      return;
    }
    if (!customerForm.customerName.trim()) {
      setCustomerFormError("Customer Name is mandatory.");
      return;
    }
    if (!customerForm.plotNo.trim()) {
      setCustomerFormError("Plot No is mandatory.");
      return;
    }

    setSubmittingCustomer(true);
    try {
      const payload = {
        ...customerForm,
        layoutId: selectedLayoutId,
        sqYards: Number(customerForm.sqYards) || 0,
        sqYardCost: Number(customerForm.sqYardCost) || 0,
        facingCharges: Number(customerForm.facingCharges) || 0,
        paidAmount: Number(customerForm.paidAmount) || 0,
      };

      let res;
      if (editingCustomer) {
        res = await fetch(`/api/customers/${editingCustomer._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (res.ok) {
        // Once saved, hide the form and display only the table!
        setShowCustomerForm(false);
        setEditingCustomer(null);
        fetchCustomers(selectedLayoutId);
      } else {
        setCustomerFormError(data.error || "Failed to save customer.");
      }
    } catch {
      setCustomerFormError("Server connection error.");
    } finally {
      setSubmittingCustomer(false);
    }
  };

  const handleDeleteCustomer = async (cust) => {
    if (!confirm(`Are you sure you want to delete customer "${cust.customerName}" (Plot #${cust.plotNo})?`)) return;

    try {
      const res = await fetch(`/api/customers/${cust._id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCustomers(selectedLayoutId);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete customer.");
      }
    } catch {
      alert("Server error deleting customer.");
    }
  };

  const formSqYards = Number(customerForm.sqYards) || 0;
  const formSqYardCost = Number(customerForm.sqYardCost) || 0;
  const formFacingCharges = Number(customerForm.facingCharges) || 0;
  const formPaidAmount = Number(customerForm.paidAmount) || 0;
  const formTotalPlotCost = Math.round((formSqYardCost + formFacingCharges) * formSqYards);
  const formBalanceAmount = Math.round(formTotalPlotCost - formPaidAmount);

  // Calculate elapsed days from date of booking to today; when balance is 0, days stop counting
  const getBookingDays = (bookingDateStr, balanceAmount, clearedDate) => {
    if (!bookingDateStr) return "—";
    const bal = Number(balanceAmount);

    try {
      const parseDate = (dStr) => {
        if (!dStr) return null;
        const parts = String(dStr).split("-");
        if (parts.length === 3) {
          return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        }
        const d = new Date(dStr);
        return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
      };

      const bookingDate = parseDate(bookingDateStr);
      if (!bookingDate) return "—";

      // When balance is zero or less, days should not count; it stops when balance became 0
      if (bal <= 0) {
        if (clearedDate && clearedDate !== bookingDateStr) {
          const cDate = parseDate(clearedDate);
          if (cDate) {
            const diffMs = cDate.getTime() - bookingDate.getTime();
            const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
            return diffDays === 1 ? "1 day" : `${diffDays} days`;
          }
        }
        return "0 days";
      }

      // Balance is still due (> 0): count from booking date to today
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffMs = today.getTime() - bookingDate.getTime();
      const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      return diffDays === 1 ? "1 day" : `${diffDays} days`;
    } catch {
      return "—";
    }
  };

  // Customer metrics for overview
  const totalCustomersCount = customers.length;
  const totalAgreedValue = customers.reduce((sum, c) => sum + (Number(c.totalPlotCost) || 0), 0);
  const totalCollections = customers.reduce((sum, c) => sum + (Number(c.paidAmount) || 0), 0);
  const totalBalanceDue = customers.reduce((sum, c) => sum + (Number(c.balanceAmount) || 0), 0);

  // Download Customer Table as CSV / Excel
  const handleDownloadCSV = () => {
    if (customers.length === 0) return;
    setShowDownloadMenu(false);

    const currentLayout = layouts.find((l) => l._id === selectedLayoutId);
    const layoutName = currentLayout?.name || "SSV Layout";
    const safeName = layoutName.replace(/[^a-z0-9]/gi, "_");
    const today = new Date().toISOString().split("T")[0];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      "Sl.No",
      "Customer Name",
      "Date of Booking",
      "Plot No",
      "Sq yards",
      "Sq yard Cost (Rs)",
      "Facing",
      "Facing Charges (Rs)",
      "Total Plot Cost (Rs)",
      "Paid Amount (Rs)",
      "Balance Amount (Rs)",
      "No.of Days",
      "TL Name",
    ];

    const rows = customers.map((cust, idx) => {
      const sqYards = cust.sqYards || "";
      const sqYardCost = Number(cust.sqYardCost) || 0;
      const facing = cust.facing || "";
      const facingCharges = Number(cust.facingCharges) || 0;
      const totalPlotCost = Number(cust.totalPlotCost || ((sqYardCost + facingCharges) * (Number(sqYards) || 0)));
      const paidAmount = Number(cust.paidAmount) || 0;
      const balanceAmount = Number(cust.balanceAmount ?? (totalPlotCost - paidAmount));
      const days = getBookingDays(cust.dateOfBooking, balanceAmount, cust.clearedDate);

      return [
        idx + 1,
        escapeCsv(cust.customerName),
        escapeCsv(cust.dateOfBooking),
        escapeCsv(`Plot #${cust.plotNo}`),
        sqYards,
        sqYardCost,
        escapeCsv(facing),
        facingCharges,
        totalPlotCost,
        paidAmount,
        balanceAmount,
        escapeCsv(days),
        escapeCsv(cust.tlName || "—"),
      ];
    });

    const summaryRow = [
      "",
      escapeCsv(`TOTALS (${customers.length} Customers)`),
      "",
      "",
      "",
      "",
      "",
      "",
      totalAgreedValue,
      totalCollections,
      totalBalanceDue,
      "",
      "",
    ];

    const metaRows = [
      [`Sri Sidhi Vinayakaa Developers - Customers Ledger (${layoutName})`],
      [`Export Date: ${today}`, `Total Customers: ${customers.length}`, `Total Plot Cost: Rs.${totalAgreedValue}`, `Total Paid: Rs.${totalCollections}`, `Total Balance Due: Rs.${totalBalanceDue}`],
      [],
    ];

    const allLines = [
      ...metaRows.map((r) => r.map(escapeCsv).join(",")),
      headers.map(escapeCsv).join(","),
      ...rows.map((r) => r.join(",")),
      summaryRow.join(","),
    ];

    const csvContent = "\uFEFF" + allLines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `SSV_${safeName}_Customers_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download Customer Table as PNG Image
  const handleDownloadPNG = async () => {
    if (!customerTableCardRef.current || customers.length === 0) return;
    setDownloadingTable(true);
    setShowDownloadMenu(false);

    const cardElement = customerTableCardRef.current;
    const table = cardElement.querySelector(".customer-table");
    const tableWrapper = cardElement.querySelector(".customer-table-wrapper");

    const prevCardWidth = cardElement.style.width;
    const prevCardMinWidth = cardElement.style.minWidth;
    const prevCardMaxWidth = cardElement.style.maxWidth;
    const prevTableOverflow = tableWrapper ? tableWrapper.style.overflowX : "";
    const prevTableWidth = tableWrapper ? tableWrapper.style.width : "";

    try {
      const html2canvas = (await import("html2canvas")).default;
      const currentLayout = layouts.find((l) => l._id === selectedLayoutId);
      const layoutName = currentLayout?.name || "SSV Layout";
      const safeName = layoutName.replace(/[^a-z0-9]/gi, "_");
      const today = new Date().toISOString().split("T")[0];

      // Measure full required width so all 13 columns (including TL Name) fit with generous padding
      const fullTableWidth = table ? Math.max(table.scrollWidth, table.offsetWidth) : cardElement.scrollWidth;
      const targetWidth = Math.max(fullTableWidth + 100, 1420);

      cardElement.style.width = `${targetWidth}px`;
      cardElement.style.minWidth = `${targetWidth}px`;
      cardElement.style.maxWidth = "none";
      if (tableWrapper) {
        tableWrapper.style.overflowX = "visible";
        tableWrapper.style.width = "100%";
      }

      await new Promise((resolve) => setTimeout(resolve, 80));

      // Dynamic scale: 2x for normal tables, 1.5x for 100+ customer records to ensure smooth memory allocation and prevent browser canvas limits
      const isLargeDataset = cardElement.scrollHeight > 2800;
      const exportScale = isLargeDataset ? 1.5 : 2;

      const canvas = await html2canvas(cardElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        scale: exportScale,
        scrollX: 0,
        scrollY: 0,
        width: targetWidth,
        height: cardElement.scrollHeight,
        windowWidth: targetWidth + 60,
        windowHeight: cardElement.scrollHeight + 100,
      });

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `SSV_${safeName}_Customers_${today}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error exporting customer table image:", err);
      alert("Failed to export image. Please try downloading CSV instead.");
    } finally {
      cardElement.style.width = prevCardWidth;
      cardElement.style.minWidth = prevCardMinWidth;
      cardElement.style.maxWidth = prevCardMaxWidth;
      if (tableWrapper) {
        tableWrapper.style.overflowX = prevTableOverflow;
        tableWrapper.style.width = prevTableWidth;
      }
      setDownloadingTable(false);
    }
  };

  // Download Customer Table as PDF Document (Supports 100+ customers with auto multi-page layout)
  const handleDownloadPDF = async () => {
    if (customers.length === 0) return;
    setDownloadingTable(true);
    setShowDownloadMenu(false);

    try {
      const { jsPDF } = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");
      const autoTable = autoTableModule.default || autoTableModule;

      const currentLayout = layouts.find((l) => l._id === selectedLayoutId);
      const layoutName = currentLayout?.name || "SSV Layout";
      const safeName = layoutName.replace(/[^a-z0-9]/gi, "_");
      const today = new Date().toISOString().split("T")[0];

      // Landscape A4 PDF: 297mm x 210mm
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Header Banner
      doc.setFillColor(109, 40, 217);
      doc.rect(10, 8, 277, 16, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text("SRI SIDHI VINAYAKAA DEVELOPERS", 14, 15);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(237, 233, 254);
      doc.text(`Customer Allotments Ledger: ${layoutName}   |   Export Date: ${today}`, 14, 21);

      // Summary Bar under banner
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(10, 27, 277, 9, 1.5, 1.5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`CUSTOMERS: ${customers.length}`, 14, 33);

      doc.setTextColor(109, 40, 217);
      doc.text(`TOTAL PLOT COST: Rs.${totalAgreedValue.toLocaleString("en-IN")}`, 55, 33);

      doc.setTextColor(5, 150, 105);
      doc.text(`TOTAL PAID: Rs.${totalCollections.toLocaleString("en-IN")}`, 135, 33);

      doc.setTextColor(totalBalanceDue <= 0 ? 22 : 220, totalBalanceDue <= 0 ? 163 : 38, totalBalanceDue <= 0 ? 74 : 38);
      doc.text(`TOTAL BALANCE: Rs.${totalBalanceDue.toLocaleString("en-IN")}`, 210, 33);

      // Prepare Table Data for autoTable
      const head = [
        [
          "Sl.No",
          "Customer Name",
          "Date of Booking",
          "Plot No",
          "Sq yds",
          "Sq yard Cost",
          "Facing",
          "Facing Chg",
          "Total Plot Cost",
          "Paid Amount",
          "Balance Amount",
          "No.of Days",
          "TL Name",
        ],
      ];

      const body = customers.map((cust, idx) => {
        const sqYards = cust.sqYards || "—";
        const sqYardCost = Number(cust.sqYardCost) || 0;
        const facing = cust.facing || "—";
        const facingCharges = Number(cust.facingCharges) || 0;
        const totalPlotCost = Number(cust.totalPlotCost || ((sqYardCost + facingCharges) * (Number(sqYards) || 0)));
        const paidAmount = Number(cust.paidAmount) || 0;
        const balanceAmount = Number(cust.balanceAmount ?? (totalPlotCost - paidAmount));
        const days = getBookingDays(cust.dateOfBooking, balanceAmount, cust.clearedDate);

        return [
          idx + 1,
          cust.customerName || "—",
          cust.dateOfBooking || "—",
          `#${cust.plotNo}`,
          sqYards,
          sqYardCost ? `Rs.${sqYardCost.toLocaleString("en-IN")}` : "—",
          facing,
          facingCharges ? `Rs.${facingCharges.toLocaleString("en-IN")}` : "Rs.0",
          `Rs.${totalPlotCost.toLocaleString("en-IN")}`,
          `Rs.${paidAmount.toLocaleString("en-IN")}`,
          `Rs.${balanceAmount.toLocaleString("en-IN")}`,
          days,
          cust.tlName || "—",
        ];
      });

      const foot = [
        [
          "",
          `TOTALS (${customers.length} Customers)`,
          "",
          "",
          "",
          "",
          "",
          "",
          `Rs.${totalAgreedValue.toLocaleString("en-IN")}`,
          `Rs.${totalCollections.toLocaleString("en-IN")}`,
          `Rs.${totalBalanceDue.toLocaleString("en-IN")}`,
          totalBalanceDue <= 0 ? "All Cleared" : "Balance Due",
          "",
        ],
      ];

      autoTable(doc, {
        head: head,
        body: body,
        foot: foot,
        startY: 39,
        margin: { top: 14, left: 10, right: 10, bottom: 12 },
        theme: "grid",
        showHead: "everyPage",
        showFoot: "lastPage",
        styles: {
          font: "helvetica",
          fontSize: 7.2,
          cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
          lineColor: [203, 213, 225],
          lineWidth: 0.2,
          valign: "middle",
          textColor: [15, 23, 42],
        },
        headStyles: {
          fillColor: [109, 40, 217],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 7.5,
          halign: "left",
        },
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: "bold",
          fontSize: 7.5,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 33, fontStyle: "bold" },
          2: { cellWidth: 20 },
          3: { cellWidth: 14, halign: "center", fontStyle: "bold", textColor: [109, 40, 217] },
          4: { cellWidth: 14, halign: "center" },
          5: { cellWidth: 20, halign: "right" },
          6: { cellWidth: 20, halign: "center" },
          7: { cellWidth: 18, halign: "right" },
          8: { cellWidth: 25, halign: "right", fontStyle: "bold" },
          9: { cellWidth: 24, halign: "right", fontStyle: "bold", textColor: [5, 150, 105] },
          10: { cellWidth: 24, halign: "right", fontStyle: "bold" },
          11: { cellWidth: 18, halign: "center" },
          12: { cellWidth: 27, fontStyle: "bold", textColor: [71, 85, 105] },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 10) {
            const rawVal = data.cell.raw;
            if (rawVal === "Rs.0") {
              data.cell.styles.textColor = [22, 163, 74];
            } else {
              data.cell.styles.textColor = [220, 38, 38];
            }
          }
        },
      });

      // Accurate Multi-Page Headers & Footers (e.g. "Page 1 of 5" for 100+ customers)
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // On Page 2 and above, print a clean running top banner
        if (i > 1) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(109, 40, 217);
          doc.text(`SRI SIDHI VINAYAKAA DEVELOPERS — ${layoutName} (Continued)`, 14, 9);
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.3);
          doc.line(14, 11, 283, 11);
        }

        // Bottom Page Numbers on every page
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Sri Sidhi Vinayakaa Developers   |   Page ${i} of ${totalPages}`,
          148.5,
          205,
          { align: "center" }
        );
      }

      doc.save(`SSV_${safeName}_Customers_${today}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to export PDF: " + err.message);
    } finally {
      setDownloadingTable(false);
    }
  };

  // Reg.Customers Management Handlers (Strictly bound to selectedLayoutId)
  const fetchRegCustomers = async (layoutId = selectedLayoutId) => {
    if (!layoutId) {
      setRegCustomers([]);
      return;
    }
    try {
      setLoadingRegCustomers(true);
      const res = await fetch(`/api/reg-customers?layoutId=${layoutId}`);
      const data = await res.json();
      if (res.ok) {
        setRegCustomers(Array.isArray(data) ? data : []);
      } else {
        setRegCustomers([]);
      }
    } catch (err) {
      console.error("Error fetching registered customers:", err);
      setRegCustomers([]);
    } finally {
      setLoadingRegCustomers(false);
    }
  };

  const handleOpenAddRegCustomer = () => {
    setEditingRegCustomer(null);
    setRegCustomerForm({
      sNo: String(regCustomers.length + 1),
      customerName: "",
      sqYards: "",
      facing: "",
      regDate: new Date().toISOString().split("T")[0],
      documentNo: "",
    });
    setRegCustomerFormError("");
    setShowRegCustomerForm(true);
  };

  const handleOpenEditRegCustomer = (cust) => {
    setEditingRegCustomer(cust);
    setRegCustomerForm({
      sNo: cust.sNo || "",
      customerName: cust.customerName || "",
      sqYards: cust.sqYards || "",
      facing: cust.facing || "",
      regDate: cust.regDate || "",
      documentNo: cust.documentNo || "",
    });
    setRegCustomerFormError("");
    setShowRegCustomerForm(true);
  };

  const handleRegCustomerFormSubmit = async (e) => {
    e.preventDefault();
    setRegCustomerFormError("");

    if (!selectedLayoutId) {
      setRegCustomerFormError("Please select a layout sheet first.");
      return;
    }

    setSubmittingRegCustomer(true);
    try {
      const payload = {
        ...regCustomerForm,
        layoutId: selectedLayoutId,
      };

      let res;
      if (editingRegCustomer) {
        res = await fetch(`/api/reg-customers/${editingRegCustomer._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/reg-customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (res.ok) {
        setShowRegCustomerForm(false);
        setEditingRegCustomer(null);
        fetchRegCustomers(selectedLayoutId);
      } else {
        setRegCustomerFormError(data.error || "Failed to save registered customer.");
      }
    } catch {
      setRegCustomerFormError("Server connection error.");
    } finally {
      setSubmittingRegCustomer(false);
    }
  };

  const handleDeleteRegCustomer = async (cust) => {
    const displayName = cust.customerName || `S.No ${cust.sNo}` || "this record";
    if (!confirm(`Are you sure you want to delete registered customer "${displayName}"?`)) return;

    try {
      const res = await fetch(`/api/reg-customers/${cust._id}`, { method: "DELETE" });
      if (res.ok) {
        fetchRegCustomers(selectedLayoutId);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete registered customer.");
      }
    } catch {
      alert("Server error deleting registered customer.");
    }
  };

  // Reg.Customer metrics for overview
  const totalRegCustomersCount = regCustomers.length;
  const totalRegSqYards = regCustomers.reduce((sum, c) => sum + (Number(c.sqYards) || 0), 0);

  // Download Reg Customer Table as CSV / Excel
  const handleDownloadRegCSV = () => {
    if (regCustomers.length === 0) return;
    setShowRegDownloadMenu(false);

    const currentLayout = layouts.find((l) => l._id === selectedLayoutId);
    const layoutName = currentLayout?.name || "SSV Layout";
    const safeName = layoutName.replace(/[^a-z0-9]/gi, "_");
    const today = new Date().toISOString().split("T")[0];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      "S.No.",
      "Customer Name",
      "Sq.yards",
      "Facing",
      "Reg Date",
      "Document No."
    ];

    const rows = regCustomers.map((cust, idx) => [
      escapeCsv(cust.sNo || idx + 1),
      escapeCsv(cust.customerName || ""),
      escapeCsv(cust.sqYards || ""),
      escapeCsv(cust.facing || ""),
      escapeCsv(cust.regDate || ""),
      escapeCsv(cust.documentNo || "")
    ]);

    const csvContent = [
      [`Sri Sidhi Vinayakaa Developers - Registered Customers (${layoutName})`],
      [`Export Date: ${today}`, `Total Registered Customers: ${regCustomers.length}`, `Total Sq. Yards: ${totalRegSqYards}`],
      [],
      headers,
      ...rows,
    ]
      .map((row) => row.join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SSV_${safeName}_RegCustomers_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download Reg Customer Table as PNG Image
  const handleDownloadRegPNG = async () => {
    if (!regCustomerTableCardRef.current || regCustomers.length === 0) return;
    setDownloadingRegTable(true);
    setShowRegDownloadMenu(false);

    try {
      const html2canvas = (await import("html2canvas")).default;
      const currentLayout = layouts.find((l) => l._id === selectedLayoutId);
      const layoutName = currentLayout?.name || "SSV Layout";
      const safeName = layoutName.replace(/[^a-z0-9]/gi, "_");
      const today = new Date().toISOString().split("T")[0];

      const canvas = await html2canvas(regCustomerTableCardRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        ignoreElements: (element) => {
          return (
            element.classList?.contains("no-print") ||
            element.getAttribute("data-html2canvas-ignore") === "true"
          );
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `SSV_${safeName}_RegCustomers_${today}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error exporting Reg Customers table image:", err);
      alert("Failed to export image.");
    } finally {
      setDownloadingRegTable(false);
    }
  };

  // Download Reg Customer Table as PDF Document
  const handleDownloadRegPDF = async () => {
    if (regCustomers.length === 0) return;
    setDownloadingRegTable(true);
    setShowRegDownloadMenu(false);

    try {
      const { jsPDF } = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");
      const autoTable = autoTableModule.default || autoTableModule;

      const currentLayout = layouts.find((l) => l._id === selectedLayoutId);
      const layoutName = currentLayout?.name || "SSV Layout";
      const safeName = layoutName.replace(/[^a-z0-9]/gi, "_");
      const today = new Date().toISOString().split("T")[0];

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Crimson / Ruby header for Registered Customers
      doc.setFillColor(185, 28, 28);
      doc.rect(0, 0, 297, 24, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("SRI SIDHI VINAYAKAA DEVELOPERS", 14, 11);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`REGISTERED CUSTOMERS  •  LAYOUT: ${layoutName.toUpperCase()}`, 14, 18);

      doc.setFontSize(9);
      doc.text(`Generated: ${today}`, 283, 18, { align: "right" });

      // Summary Bar
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(254, 202, 202);
      doc.roundedRect(14, 28, 269, 12, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(185, 28, 28);
      doc.text(`REG. CUSTOMERS: ${regCustomers.length}`, 20, 35.5);
      if (totalRegSqYards > 0) {
        doc.text(`TOTAL SQ. YARDS: ${totalRegSqYards.toLocaleString("en-IN")}`, 80, 35.5);
      }

      const tableHeaders = [
        "S.No.",
        "Customer Name",
        "Sq.yards",
        "Facing",
        "Reg Date",
        "Document No.",
      ];

      const body = regCustomers.map((cust, idx) => [
        cust.sNo || String(idx + 1),
        cust.customerName || "—",
        cust.sqYards || "—",
        cust.facing || "—",
        cust.regDate || "—",
        cust.documentNo || "—",
      ]);

      autoTable(doc, {
        head: [tableHeaders],
        body: body,
        startY: 44,
        margin: { top: 30, right: 14, bottom: 20, left: 14 },
        theme: "grid",
        styles: {
          fontSize: 8.5,
          cellPadding: 2.8,
          textColor: [30, 41, 59],
          lineColor: [203, 213, 225],
          lineWidth: 0.2,
          valign: "middle",
        },
        headStyles: {
          fillColor: [185, 28, 28],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9,
          halign: "center",
        },
        columnStyles: {
          0: { halign: "center", fontStyle: "bold", cellWidth: 20 },
          1: { halign: "left", fontStyle: "bold", cellWidth: 70 },
          2: { halign: "center", cellWidth: 35 },
          3: { halign: "center", cellWidth: 40 },
          4: { halign: "center", cellWidth: 40 },
          5: { halign: "center", cellWidth: 64 },
        },
        alternateRowStyles: {
          fillColor: [254, 242, 242],
        },
        didDrawPage: function (data) {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.setFont("helvetica", "normal");
          doc.text(
            `Sri Sidhi Vinayakaa Developers  •  Confidential Registered Customers Ledger  •  Page ${data.pageNumber} of ${pageCount}`,
            148.5,
            204,
            { align: "center" }
          );
        },
      });

      doc.save(`SSV_${safeName}_RegCustomers_${today}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to export PDF: " + err.message);
    } finally {
      setDownloadingRegTable(false);
    }
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
          <>
            {/* TOP UNIFIED HEADER CARD: Layout Selector, Spacing, Canvas & Bookings Tab, Customers Tab, and Actions */}
            <div className="glass-card layout-header-card fade-in" style={{
              padding: "0.85rem 1.5rem",
              marginBottom: "1.25rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1.25rem"
            }}>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                {/* 1. Layout Selector */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-main)", whiteSpace: "nowrap" }}>
                    Layout:
                  </span>
                  <select
                    className="form-select"
                    value={selectedLayoutId}
                    onChange={(e) => handleLayoutChange(e.target.value)}
                    style={{
                      minWidth: "210px",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      padding: "0.45rem 0.9rem",
                      borderRadius: "8px",
                      border: "1.5px solid var(--border-light)",
                      backgroundColor: "#ffffff",
                      color: "var(--text-main)",
                      cursor: "pointer",
                    }}
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
                    style={{ padding: "0.45rem 0.75rem", fontSize: "1rem", lineHeight: 1 }}
                    title="Add Layout Sheet"
                  >
                    +
                  </button>
                </div>

                {/* 2. DISTANCE between Layout Selector and Tabs */}
                <div style={{ width: "2.5rem" }}></div>

                {/* 3. Canvas & Bookings, Customers, and Reg.Customers tabs */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("canvas")}
                    style={{
                      padding: "0.5rem 1.15rem",
                      fontSize: "0.9rem",
                      borderRadius: "8px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      ...(activeTab === "canvas"
                        ? {
                            background: "linear-gradient(135deg, #6d28d9 0%, #d946ef 100%)",
                            color: "#ffffff",
                            border: "none",
                            boxShadow: "0 4px 12px rgba(109, 40, 217, 0.35)",
                          }
                        : {
                            background: "#f1f5f9",
                            color: "#475569",
                            border: "1px solid #e2e8f0",
                          }),
                    }}
                  >
                    Canvas & Bookings
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("customers")}
                    style={{
                      padding: "0.5rem 1.15rem",
                      fontSize: "0.9rem",
                      borderRadius: "8px",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      ...(activeTab === "customers"
                        ? {
                            background: "linear-gradient(135deg, #15803d 0%, #16a34a 100%)",
                            color: "#ffffff",
                            border: "none",
                            boxShadow: "0 4px 12px rgba(22, 163, 74, 0.35)",
                          }
                        : {
                            background: "#f0fdf4",
                            color: "#16a34a",
                            border: "1.5px solid #86efac",
                          }),
                    }}
                  >
                    Customers
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("regCustomers")}
                    style={{
                      padding: "0.5rem 1.15rem",
                      fontSize: "0.9rem",
                      borderRadius: "8px",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      ...(activeTab === "regCustomers"
                        ? {
                            background: "linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)",
                            color: "#ffffff",
                            border: "none",
                            boxShadow: "0 4px 12px rgba(220, 38, 38, 0.35)",
                          }
                        : {
                            background: "#fef2f2",
                            color: "#dc2626",
                            border: "1.5px solid #fca5a5",
                          }),
                    }}
                  >
                    Reg.Customers
                  </button>
                </div>
              </div>

              {/* Right side of Top Header */}
              <div>
                {activeTab === "canvas" ? (
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                    <span className="badge badge-available">Available ({plots.filter(p => p.status === "Available").length})</span>
                    <span className="badge badge-registered">Registered ({plots.filter(p => p.status === "Registered").length})</span>
                    <span className="badge badge-booked">Booked ({plots.filter(p => p.status === "Booked").length})</span>
                  </div>
                ) : activeTab === "customers" ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      if (showCustomerForm && !editingCustomer) {
                        setShowCustomerForm(false);
                      } else {
                        handleOpenAddCustomer();
                      }
                    }}
                    style={{
                      padding: "0.55rem 1.25rem",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      boxShadow: "0 4px 12px rgba(109, 40, 217, 0.3)",
                    }}
                  >
                    {showCustomerForm && !editingCustomer ? "✕ Close Form" : "+ Add Customer"}
                  </button>
                ) : (
                  <button
                    className="btn"
                    onClick={() => {
                      if (showRegCustomerForm && !editingRegCustomer) {
                        setShowRegCustomerForm(false);
                      } else {
                        handleOpenAddRegCustomer();
                      }
                    }}
                    style={{
                      padding: "0.55rem 1.25rem",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      background: "linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
                      cursor: "pointer",
                    }}
                  >
                    {showRegCustomerForm && !editingRegCustomer ? "✕ Close Form" : "+ Add Reg.Customer"}
                  </button>
                )}
              </div>
            </div>

            {activeTab === "canvas" ? (
              <div className="admin-layout-grid fade-in">
                {/* Left Sidebar for Configurations */}
                <div className="admin-sidebar">
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
                          placeholder="e.g. SSVD"
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
                  {/* Delete Layout Sheet button */}
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

                {/* Right Interactive Canvas Viewer */}
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
            ) : activeTab === "customers" ? (
              <div className="admin-customers-container fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* 1. TOTAL SUMMARY ABOVE THE TABLE */}
                <div className="glass-card customer-summary-card" style={{
                  padding: "1.1rem 1.5rem",
                  borderRadius: "12px",
                  border: "1px solid var(--border-light)"
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "1rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)" }}>
                        Total Summary:
                      </span>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                        ({layouts.find((l) => l._id === selectedLayoutId)?.name || "Current Layout"})
                      </span>
                    </div>

                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1.25rem",
                      flexWrap: "wrap"
                    }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Customers:</span>
                        <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)" }}>
                          {totalCustomersCount}
                        </span>
                      </div>

                      <div style={{ width: "1px", height: "18px", background: "var(--border-light)" }}></div>

                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Total Plot Cost:</span>
                        <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#6d28d9" }}>
                          ₹{totalAgreedValue.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div style={{ width: "1px", height: "18px", background: "var(--border-light)" }}></div>

                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Total Paid:</span>
                        <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#009639" }}>
                          ₹{totalCollections.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div style={{ width: "1px", height: "18px", background: "var(--border-light)" }}></div>

                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Total Balance:</span>
                        <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#e60000" }}>
                          ₹{totalBalanceDue.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. INLINE ADD / EDIT CUSTOMER FORM (shown when showCustomerForm is true) */}
                {showCustomerForm && (
                  <div className="glass-card inline-customer-form fade-in" style={{
                    padding: "1.5rem",
                    border: "2px solid rgba(109, 40, 217, 0.25)",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248, 250, 252, 0.98) 100%)",
                    borderRadius: "14px",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid var(--border-light)", paddingBottom: "0.75rem" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--text-main)" }}>
                          {editingCustomer ? `Edit Customer: ${editingCustomer.customerName}` : "+ Add Customer"}
                        </h3>
                        <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                          Layout: <strong>{layouts.find((l) => l._id === selectedLayoutId)?.name || "Current Layout"}</strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        className="close-btn"
                        onClick={() => {
                          setShowCustomerForm(false);
                          setEditingCustomer(null);
                        }}
                        style={{ fontSize: "1.5rem", cursor: "pointer", background: "none", border: "none", color: "var(--text-muted)" }}
                        title="Close Form"
                      >
                        &times;
                      </button>
                    </div>

                    {customerFormError && <div className="error-message" style={{ marginBottom: "1rem" }}>{customerFormError}</div>}

                    <form onSubmit={handleCustomerFormSubmit}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                        <div className="form-group">
                          <label className="form-label" htmlFor="custName">Customer Name *</label>
                          <input
                            id="custName"
                            className="form-input"
                            type="text"
                            placeholder="e.g. SSVD"
                            value={customerForm.customerName}
                            onChange={(e) => setCustomerForm({ ...customerForm, customerName: e.target.value })}
                            disabled={submittingCustomer}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="custBookingDate">Date of Booking</label>
                          <input
                            id="custBookingDate"
                            className="form-input"
                            type="date"
                            value={customerForm.dateOfBooking}
                            onChange={(e) => setCustomerForm({ ...customerForm, dateOfBooking: e.target.value })}
                            disabled={submittingCustomer}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="custPlotNo">Plot No *</label>
                          <input
                            id="custPlotNo"
                            className="form-input"
                            type="text"
                            placeholder="e.g. 42"
                            value={customerForm.plotNo}
                            onChange={(e) => handleCustomerPlotNoChange(e.target.value)}
                            list="customer-plots-datalist"
                            disabled={submittingCustomer}
                            required
                          />
                          <datalist id="customer-plots-datalist">
                            {plots.map((p) => (
                              <option key={p._id} value={p.plotNo}>
                                Plot #{p.plotNo} {p.plotSize ? `(${p.plotSize})` : ""}
                              </option>
                            ))}
                          </datalist>
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="custSqYards">Sq yards *</label>
                          <input
                            id="custSqYards"
                            className="form-input"
                            type="number"
                            step="any"
                            placeholder="e.g. 150"
                            value={customerForm.sqYards}
                            onChange={(e) => setCustomerForm({ ...customerForm, sqYards: e.target.value })}
                            disabled={submittingCustomer}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="custSqYardCost">Sq yard Cost (₹) *</label>
                          <input
                            id="custSqYardCost"
                            className="form-input"
                            type="number"
                            step="any"
                            placeholder="e.g. 10000"
                            value={customerForm.sqYardCost}
                            onChange={(e) => setCustomerForm({ ...customerForm, sqYardCost: e.target.value })}
                            disabled={submittingCustomer}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="custFacing">Facing</label>
                          <select
                            id="custFacing"
                            className="form-select"
                            value={customerForm.facing}
                            onChange={(e) => setCustomerForm({ ...customerForm, facing: e.target.value })}
                            disabled={submittingCustomer}
                          >
                            <option value="">Select Facing</option>
                            <option value="East">East</option>
                            <option value="West">West</option>
                            <option value="North">North</option>
                            <option value="South">South</option>
                            <option value="North-East">North-East</option>
                            <option value="South-East">South-East</option>
                            <option value="North-West">North-West</option>
                            <option value="South-West">South-West</option>
                            <option value="Corner">Corner</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="custFacingCharges">Facing Charges (₹ / Sq yard)</label>
                          <input
                            id="custFacingCharges"
                            className="form-input"
                            type="number"
                            step="any"
                            placeholder="e.g. 500"
                            value={customerForm.facingCharges}
                            onChange={(e) => setCustomerForm({ ...customerForm, facingCharges: e.target.value })}
                            disabled={submittingCustomer}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="custPaidAmount">Paid Amount (₹)</label>
                          <input
                            id="custPaidAmount"
                            className="form-input"
                            type="number"
                            step="any"
                            placeholder="e.g. 50000"
                            value={customerForm.paidAmount}
                            onChange={(e) => setCustomerForm({ ...customerForm, paidAmount: e.target.value })}
                            disabled={submittingCustomer}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="custTlName">TL Name (Team Leader)</label>
                          <input
                            id="custTlName"
                            className="form-input"
                            type="text"
                            placeholder="e.g. SSVD"
                            value={customerForm.tlName}
                            onChange={(e) => setCustomerForm({ ...customerForm, tlName: e.target.value })}
                            disabled={submittingCustomer}
                          />
                        </div>
                      </div>

                      {/* Total Plot Cost & Balance Amount Display */}
                      <div style={{
                        background: "linear-gradient(135deg, rgba(109, 40, 217, 0.05) 0%, rgba(0, 150, 57, 0.05) 100%)",
                        border: "1px solid var(--border-light)",
                        borderRadius: "10px",
                        padding: "1.1rem 1.5rem",
                        marginBottom: "1.25rem",
                        display: "flex",
                        justifyContent: "space-around",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "1.5rem"
                      }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>
                            Total Plot Cost
                          </div>
                          <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#6d28d9", marginTop: "0.25rem" }}>
                            ₹{formTotalPlotCost.toLocaleString("en-IN")}
                          </div>
                        </div>

                        <div style={{ width: "1px", height: "40px", background: "var(--border-light)" }}></div>

                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>
                            Balance Amount
                          </div>
                          <div style={{
                            fontSize: "1.4rem",
                            fontWeight: 700,
                            color: formBalanceAmount <= 0 ? "#009639" : "#e60000",
                            marginTop: "0.25rem"
                          }}>
                            ₹{formBalanceAmount.toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                        <button
                          className="btn btn-secondary"
                          type="button"
                          onClick={() => {
                            setShowCustomerForm(false);
                            setEditingCustomer(null);
                          }}
                          disabled={submittingCustomer}
                          style={{ padding: "0.55rem 1.5rem" }}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-primary"
                          type="submit"
                          disabled={submittingCustomer}
                          style={{ padding: "0.55rem 1.75rem", fontWeight: 600 }}
                        >
                          {submittingCustomer ? (
                            <div className="loading-spinner" style={{ width: 14, height: 14 }}></div>
                          ) : editingCustomer ? (
                            "Update Customer"
                          ) : (
                            "Save Customer"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 3. CUSTOMERS TABLE (ALWAYS DISPLAYED BELOW THE FORM OR DIRECTLY BELOW THE SUMMARY) */}
                <div className="glass-card fade-in printable-customer-card" ref={customerTableCardRef} style={{ padding: "1.5rem" }}>
                  <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.2rem" }}>
                        Customers List ({layouts.find((l) => l._id === selectedLayoutId)?.name || "Current Layout"})
                      </h3>
                      <p style={{ margin: "0.2rem 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                        Showing all saved customer allotments for this layout.
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }} data-html2canvas-ignore="true" className="no-print">
                      {/* Download Table Button with Dropdown */}
                      <div className="download-btn-container" ref={downloadMenuRef}>
                        <button
                          type="button"
                          className="btn-download"
                          onClick={() => setShowDownloadMenu((prev) => !prev)}
                          disabled={customers.length === 0 || downloadingTable}
                          title={customers.length === 0 ? "No customer records to download" : "Download Customer Table"}
                        >
                          {downloadingTable ? (
                            <>
                              <div className="loading-spinner" style={{ width: 14, height: 14 }}></div>
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                              </svg>
                              <span>Download</span>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.2s", transform: showDownloadMenu ? "rotate(180deg)" : "none" }}>
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </>
                          )}
                        </button>

                        {showDownloadMenu && (
                          <div className="download-dropdown-menu fade-in">
                            <button
                              type="button"
                              className="download-menu-item"
                              onClick={handleDownloadCSV}
                            >
                              <div className="download-menu-item-icon" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#059669" }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                  <polyline points="14 2 14 8 20 8"></polyline>
                                  <line x1="8" y1="13" x2="16" y2="13"></line>
                                  <line x1="8" y1="17" x2="16" y2="17"></line>
                                  <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                              </div>
                              <div>
                                <div className="download-menu-item-title">Excel / CSV (.csv)</div>
                                <div className="download-menu-item-desc">Spreadsheet for Excel & Google Sheets</div>
                              </div>
                            </button>

                            <button
                              type="button"
                              className="download-menu-item"
                              onClick={handleDownloadPDF}
                            >
                              <div className="download-menu-item-icon" style={{ background: "rgba(220, 38, 38, 0.12)", color: "#dc2626" }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                  <polyline points="14 2 14 8 20 8"></polyline>
                                  <line x1="9" y1="15" x2="15" y2="15"></line>
                                </svg>
                              </div>
                              <div>
                                <div className="download-menu-item-title">PDF Document (.pdf)</div>
                                <div className="download-menu-item-desc">Full landscape A4 PDF document</div>
                              </div>
                            </button>

                            <button
                              type="button"
                              className="download-menu-item"
                              onClick={handleDownloadPNG}
                            >
                              <div className="download-menu-item-icon" style={{ background: "rgba(109, 40, 217, 0.12)", color: "#6d28d9" }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                  <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                              </div>
                              <div>
                                <div className="download-menu-item-title">Image (.png)</div>
                                <div className="download-menu-item-desc">High-resolution snapshot for sharing</div>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>

                      {!showCustomerForm && (
                        <button
                          className="btn btn-primary"
                          onClick={handleOpenAddCustomer}
                          style={{ fontSize: "0.88rem", padding: "0.45rem 1.15rem", fontWeight: 600 }}
                        >
                          + Add Customer
                        </button>
                      )}
                    </div>
                  </div>

                  {loadingCustomers ? (
                    <div style={{ textAlign: "center", padding: "3rem" }}>
                      <div className="loading-spinner"></div>
                      <p style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>Loading customer records...</p>
                    </div>
                  ) : customers.length === 0 ? (
                    <div className="empty-state">
                      No customer records found for <strong>{layouts.find((l) => l._id === selectedLayoutId)?.name || "this layout"}</strong>. Click <strong>+ Add Customer</strong> to record the first booking.
                    </div>
                  ) : (
                    <div className="customer-table-wrapper" style={{ overflowX: "auto" }}>
                      <table className="customer-table">
                        <thead>
                          <tr>
                            <th>Sl.No</th>
                            <th>Customer Name</th>
                            <th>Date of Booking</th>
                            <th>Plot No</th>
                            <th>Sq yards</th>
                            <th>Sq yard Cost</th>
                            <th>Facing</th>
                            <th>Facing Charges</th>
                            <th>Total Plot Cost</th>
                            <th>Paid Amount</th>
                            <th>Balance Amount</th>
                            <th>No.of Days</th>
                            <th style={{ minWidth: "115px", whiteSpace: "nowrap" }}>TL Name</th>
                            <th style={{ textAlign: "center" }} data-html2canvas-ignore="true" className="no-print">Edit/Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customers.map((cust, idx) => (
                            <tr key={cust._id}>
                              <td>
                                <span style={{ color: "#64748b", fontWeight: 700, fontSize: "0.85rem" }}>
                                  {idx + 1}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600, color: "var(--text-main)" }}>
                                {cust.customerName}
                              </td>
                              <td style={{ color: "#475569", fontWeight: 500 }}>
                                {cust.dateOfBooking || "—"}
                              </td>
                              <td>
                                <span className="badge-plot-no">#{cust.plotNo}</span>
                              </td>
                              <td style={{ fontWeight: 500 }}>{cust.sqYards ? `${cust.sqYards}` : "—"}</td>
                              <td style={{ fontWeight: 500 }}>{cust.sqYardCost ? `₹${Number(cust.sqYardCost).toLocaleString("en-IN")}` : "—"}</td>
                              <td>
                                {cust.facing ? (
                                  <span className="badge" style={{ background: "rgba(109, 40, 217, 0.08)", color: "var(--accent)", border: "1px solid rgba(109, 40, 217, 0.2)", textTransform: "uppercase" }}>
                                    {cust.facing}
                                  </span>
                                ) : "—"}
                              </td>
                              <td style={{ color: "#64748b" }}>{cust.facingCharges ? `₹${Number(cust.facingCharges).toLocaleString("en-IN")}` : "₹0"}</td>
                              <td style={{ fontWeight: 700, color: "var(--text-main)" }}>
                                ₹{Number(cust.totalPlotCost || ((Number(cust.sqYardCost || 0) + Number(cust.facingCharges || 0)) * Number(cust.sqYards || 0))).toLocaleString("en-IN")}
                              </td>
                              <td>
                                <span className="badge-paid-amount">
                                  ₹{Number(cust.paidAmount || 0).toLocaleString("en-IN")}
                                </span>
                              </td>
                              <td>
                                <span className={Number(cust.balanceAmount ?? (Number(cust.totalPlotCost || 0) - Number(cust.paidAmount || 0))) <= 0 ? "badge-balance-zero" : "badge-balance-due"}>
                                  ₹{Number(cust.balanceAmount ?? (Number(cust.totalPlotCost || 0) - Number(cust.paidAmount || 0))).toLocaleString("en-IN")}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600, color: "var(--text-main)" }}>
                                {getBookingDays(cust.dateOfBooking, cust.balanceAmount ?? (Number(cust.totalPlotCost || 0) - Number(cust.paidAmount || 0)), cust.clearedDate)}
                              </td>
                              <td style={{ fontWeight: 500, color: "#475569", whiteSpace: "nowrap" }}>{cust.tlName || "—"}</td>
                              <td style={{ textAlign: "center" }} data-html2canvas-ignore="true" className="no-print">
                                <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                                  <button
                                    className="btn-sm btn-edit"
                                    onClick={() => handleOpenEditCustomer(cust)}
                                    title="Edit Customer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn-sm btn-delete"
                                    onClick={() => handleDeleteCustomer(cust)}
                                    title="Delete Customer"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        {customers.length > 0 && (
                          <tfoot>
                            <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                              <td colSpan={8} style={{ textAlign: "right", color: "var(--text-main)", fontWeight: 700, fontSize: "0.9rem" }}>
                                Total Summary ({customers.length} Customers):
                              </td>
                              <td style={{ fontWeight: 800, color: "#6d28d9", fontSize: "0.92rem" }}>
                                ₹{totalAgreedValue.toLocaleString("en-IN")}
                              </td>
                              <td style={{ fontWeight: 800, color: "#059669", fontSize: "0.92rem" }}>
                                ₹{totalCollections.toLocaleString("en-IN")}
                              </td>
                              <td style={{ fontWeight: 800, color: totalBalanceDue <= 0 ? "#16a34a" : "#dc2626", fontSize: "0.92rem" }}>
                                ₹{totalBalanceDue.toLocaleString("en-IN")}
                              </td>
                              <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                                {totalBalanceDue <= 0 ? "All Cleared" : "Balance Due"}
                              </td>
                              <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>—</td>
                              <td data-html2canvas-ignore="true" className="no-print"></td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="admin-reg-customers-container fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* 1. TOTAL SUMMARY ABOVE THE TABLE */}
                <div className="glass-card customer-summary-card" style={{
                  padding: "1.1rem 1.5rem",
                  borderRadius: "12px",
                  border: "1px solid var(--border-light)"
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "1rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)" }}>
                        Registered Customers Summary:
                      </span>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                        ({layouts.find((l) => l._id === selectedLayoutId)?.name || "Current Layout"})
                      </span>
                    </div>

                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1.25rem",
                      flexWrap: "wrap"
                    }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Registered Customers:</span>
                        <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#dc2626" }}>
                          {totalRegCustomersCount}
                        </span>
                      </div>

                      {totalRegSqYards > 0 && (
                        <>
                          <div style={{ width: "1px", height: "18px", background: "var(--border-light)" }}></div>

                          <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Total Sq. Yards:</span>
                            <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)" }}>
                              {totalRegSqYards.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. INLINE ADD / EDIT REG.CUSTOMER FORM (No fields are mandatory) */}
                {showRegCustomerForm && (
                  <div className="glass-card inline-customer-form fade-in" style={{
                    padding: "1.5rem",
                    border: "2px solid rgba(220, 38, 38, 0.25)",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(254, 242, 242, 0.35) 100%)",
                    borderRadius: "14px",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid var(--border-light)", paddingBottom: "0.75rem" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#b91c1c" }}>
                          {editingRegCustomer ? `Edit Reg.Customer: ${editingRegCustomer.customerName || `S.No ${editingRegCustomer.sNo || ""}`}` : "+ Add Reg.Customer"}
                        </h3>
                        <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                          Layout: <strong>{layouts.find((l) => l._id === selectedLayoutId)?.name || "Current Layout"}</strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        className="close-btn"
                        onClick={() => {
                          setShowRegCustomerForm(false);
                          setEditingRegCustomer(null);
                        }}
                        style={{ fontSize: "1.5rem", cursor: "pointer", background: "none", border: "none", color: "var(--text-muted)" }}
                        title="Close Form"
                      >
                        &times;
                      </button>
                    </div>

                    {regCustomerFormError && <div className="error-message" style={{ marginBottom: "1rem" }}>{regCustomerFormError}</div>}

                    <form onSubmit={handleRegCustomerFormSubmit}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                        <div className="form-group">
                          <label className="form-label" htmlFor="regSNo">S.No.</label>
                          <input
                            id="regSNo"
                            className="form-input"
                            type="text"
                            placeholder="e.g. 1"
                            value={regCustomerForm.sNo}
                            onChange={(e) => setRegCustomerForm({ ...regCustomerForm, sNo: e.target.value })}
                            disabled={submittingRegCustomer}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="regCustomerName">Customer Name</label>
                          <input
                            id="regCustomerName"
                            className="form-input"
                            type="text"
                            placeholder="e.g. Ramesh Kumar"
                            value={regCustomerForm.customerName}
                            onChange={(e) => setRegCustomerForm({ ...regCustomerForm, customerName: e.target.value })}
                            disabled={submittingRegCustomer}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="regSqYards">Sq.yards</label>
                          <input
                            id="regSqYards"
                            className="form-input"
                            type="text"
                            placeholder="e.g. 150"
                            value={regCustomerForm.sqYards}
                            onChange={(e) => setRegCustomerForm({ ...regCustomerForm, sqYards: e.target.value })}
                            disabled={submittingRegCustomer}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="regFacing">Facing</label>
                          <select
                            id="regFacing"
                            className="form-select"
                            value={regCustomerForm.facing}
                            onChange={(e) => setRegCustomerForm({ ...regCustomerForm, facing: e.target.value })}
                            disabled={submittingRegCustomer}
                          >
                            <option value="">Select Facing</option>
                            <option value="East">East</option>
                            <option value="West">West</option>
                            <option value="North">North</option>
                            <option value="South">South</option>
                            <option value="North-East">North-East</option>
                            <option value="South-East">South-East</option>
                            <option value="North-West">North-West</option>
                            <option value="South-West">South-West</option>
                            <option value="Corner">Corner</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="regDate">Reg Date</label>
                          <input
                            id="regDate"
                            className="form-input"
                            type="date"
                            value={regCustomerForm.regDate}
                            onChange={(e) => setRegCustomerForm({ ...regCustomerForm, regDate: e.target.value })}
                            disabled={submittingRegCustomer}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="regDocNo">Document No.</label>
                          <input
                            id="regDocNo"
                            className="form-input"
                            type="text"
                            placeholder="e.g. 1234/2026"
                            value={regCustomerForm.documentNo}
                            onChange={(e) => setRegCustomerForm({ ...regCustomerForm, documentNo: e.target.value })}
                            disabled={submittingRegCustomer}
                          />
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                        <button
                          className="btn btn-secondary"
                          type="button"
                          onClick={() => {
                            setShowRegCustomerForm(false);
                            setEditingRegCustomer(null);
                          }}
                          disabled={submittingRegCustomer}
                          style={{ padding: "0.55rem 1.5rem" }}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn"
                          type="submit"
                          disabled={submittingRegCustomer}
                          style={{
                            padding: "0.55rem 1.75rem",
                            fontWeight: 600,
                            background: "linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)"
                          }}
                        >
                          {submittingRegCustomer ? (
                            <div className="loading-spinner" style={{ width: 14, height: 14 }}></div>
                          ) : editingRegCustomer ? (
                            "Update Reg.Customer"
                          ) : (
                            "Save Reg.Customer"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 3. REG.CUSTOMERS TABLE */}
                <div className="glass-card fade-in printable-customer-card" ref={regCustomerTableCardRef} style={{ padding: "1.5rem" }}>
                  <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#b91c1c" }}>
                        Reg.Customers List ({layouts.find((l) => l._id === selectedLayoutId)?.name || "Current Layout"})
                      </h3>
                      <p style={{ margin: "0.2rem 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                        Showing all registered customers for this layout sheet.
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }} data-html2canvas-ignore="true" className="no-print">
                      {/* Download Table Button with Dropdown */}
                      <div className="download-btn-container" ref={regDownloadMenuRef}>
                        <button
                          type="button"
                          className="btn-download"
                          onClick={() => setShowRegDownloadMenu((prev) => !prev)}
                          disabled={regCustomers.length === 0 || downloadingRegTable}
                          title={regCustomers.length === 0 ? "No registered customer records to download" : "Download Reg.Customer Table"}
                        >
                          {downloadingRegTable ? (
                            <>
                              <div className="loading-spinner" style={{ width: 14, height: 14 }}></div>
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                              </svg>
                              <span>Download</span>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.2s", transform: showRegDownloadMenu ? "rotate(180deg)" : "none" }}>
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </>
                          )}
                        </button>

                        {showRegDownloadMenu && (
                          <div className="download-dropdown-menu fade-in">
                            <button
                              type="button"
                              className="download-menu-item"
                              onClick={handleDownloadRegCSV}
                            >
                              <div className="download-menu-item-icon" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#059669" }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                  <polyline points="14 2 14 8 20 8"></polyline>
                                  <line x1="8" y1="13" x2="16" y2="13"></line>
                                  <line x1="8" y1="17" x2="16" y2="17"></line>
                                  <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                              </div>
                              <div>
                                <div className="download-menu-item-title">Excel / CSV (.csv)</div>
                                <div className="download-menu-item-desc">Spreadsheet for Excel & Google Sheets</div>
                              </div>
                            </button>

                            <button
                              type="button"
                              className="download-menu-item"
                              onClick={handleDownloadRegPDF}
                            >
                              <div className="download-menu-item-icon" style={{ background: "rgba(220, 38, 38, 0.12)", color: "#dc2626" }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                  <polyline points="14 2 14 8 20 8"></polyline>
                                  <line x1="9" y1="15" x2="15" y2="15"></line>
                                </svg>
                              </div>
                              <div>
                                <div className="download-menu-item-title">PDF Document (.pdf)</div>
                                <div className="download-menu-item-desc">Full landscape A4 PDF document</div>
                              </div>
                            </button>

                            <button
                              type="button"
                              className="download-menu-item"
                              onClick={handleDownloadRegPNG}
                            >
                              <div className="download-menu-item-icon" style={{ background: "rgba(185, 28, 28, 0.12)", color: "#b91c1c" }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                  <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                              </div>
                              <div>
                                <div className="download-menu-item-title">Image (.png)</div>
                                <div className="download-menu-item-desc">High-resolution snapshot for sharing</div>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>

                      {!showRegCustomerForm && (
                        <button
                          className="btn"
                          onClick={handleOpenAddRegCustomer}
                          style={{
                            fontSize: "0.88rem",
                            padding: "0.45rem 1.15rem",
                            fontWeight: 600,
                            background: "linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)"
                          }}
                        >
                          + Add Reg.Customer
                        </button>
                      )}
                    </div>
                  </div>

                  {loadingRegCustomers ? (
                    <div style={{ textAlign: "center", padding: "3rem" }}>
                      <div className="loading-spinner"></div>
                      <p style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>Loading registered customers...</p>
                    </div>
                  ) : regCustomers.length === 0 ? (
                    <div className="empty-state">
                      No registered customers found for <strong>{layouts.find((l) => l._id === selectedLayoutId)?.name || "this layout"}</strong>. Click <strong>+ Add Reg.Customer</strong> to record the first registered customer.
                    </div>
                  ) : (
                    <div className="customer-table-wrapper" style={{ overflowX: "auto" }}>
                      <table className="customer-table">
                        <thead>
                          <tr>
                            <th style={{ width: "80px", textAlign: "center" }}>S.No.</th>
                            <th>Customer Name</th>
                            <th>Sq.yards</th>
                            <th>Facing</th>
                            <th>Reg Date</th>
                            <th>Document No.</th>
                            <th style={{ textAlign: "center", width: "130px" }} data-html2canvas-ignore="true" className="no-print">Edit/Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {regCustomers.map((cust, idx) => (
                            <tr key={cust._id}>
                              <td style={{ textAlign: "center" }}>
                                <span style={{ color: "#64748b", fontWeight: 700, fontSize: "0.85rem" }}>
                                  {cust.sNo || idx + 1}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600, color: "var(--text-main)" }}>
                                {cust.customerName || "—"}
                              </td>
                              <td style={{ fontWeight: 500 }}>
                                {cust.sqYards || "—"}
                              </td>
                              <td>
                                {cust.facing ? (
                                  <span className="badge" style={{ background: "rgba(220, 38, 38, 0.08)", color: "#b91c1c", border: "1px solid rgba(220, 38, 38, 0.2)", textTransform: "uppercase" }}>
                                    {cust.facing}
                                  </span>
                                ) : "—"}
                              </td>
                              <td style={{ color: "#475569", fontWeight: 500 }}>
                                {cust.regDate || "—"}
                              </td>
                              <td style={{ fontWeight: 600, color: "var(--text-main)" }}>
                                {cust.documentNo ? (
                                  <span style={{ background: "#f8fafc", padding: "0.2rem 0.5rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                                    {cust.documentNo}
                                  </span>
                                ) : "—"}
                              </td>
                              <td style={{ textAlign: "center" }} data-html2canvas-ignore="true" className="no-print">
                                <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                                  <button
                                    className="btn-sm btn-edit"
                                    onClick={() => handleOpenEditRegCustomer(cust)}
                                    title="Edit Reg.Customer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn-sm btn-delete"
                                    onClick={() => handleDeleteRegCustomer(cust)}
                                    title="Delete Reg.Customer"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        {regCustomers.length > 0 && (
                          <tfoot>
                            <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                              <td colSpan={2} style={{ textAlign: "right", color: "var(--text-main)", fontWeight: 700, fontSize: "0.9rem" }}>
                                Total Registered Customers ({regCustomers.length}):
                              </td>
                              <td style={{ fontWeight: 800, color: "#b91c1c", fontSize: "0.92rem" }}>
                                {totalRegSqYards > 0 ? `${totalRegSqYards.toLocaleString("en-IN")} Sq.Yds` : "—"}
                              </td>
                              <td colSpan={3}></td>
                              <td data-html2canvas-ignore="true" className="no-print"></td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
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

      {/* Inline customer form is rendered within customer tab view */}

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
