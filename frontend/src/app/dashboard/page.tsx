"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Upload,
  Coins,
  FileText,
  Clock,
  CheckCircle,
  Download,
  Trash2,
  Lock,
  CreditCard,
  Plus,
  RefreshCw,
  X,
  FileCheck,
} from "lucide-react";

interface ScanRecord {
  id: string;
  filename: string;
  date: string;
  similarity: number;
  ai: number;
  status: "Processing" | "Completed" | "Failed";
}

interface UserData {
  name: string;
  email: string;
  credits: number;
  scans: ScanRecord[];
}

// Mock PDF download trigger
const triggerPdfDownload = (filename: string, score: number, type: "similarity" | "ai") => {
  const reportType = type === "similarity" ? "Similarity" : "AI Detection";
  const content = `--- TURNITIN FEEDBACK STUDIO ---
Document: ${filename}
Report Type: Official Turnitin ${reportType} Report (No-Repository Mode)
Scan Date: ${new Date().toLocaleDateString("en-LK")}
Security Status: Secure Auto-Delete Active

VERDICT METRICS:
==================================
Score Percentage: ${score}%
Verification ID: SF-${Math.floor(Math.random() * 900000) + 100000}
Instructor Node: LK-CMB-NODE-03
==================================
This is a simulated PDF file downloaded from your Similarfy workspace.`;

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename.split(".")[0]}_turnitin_${type}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // App States
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<{ slots: number; price: string }>({ slots: 5, price: "4750" });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [checkoutError, setCheckoutError] = useState("");

  // Scan Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [scanFile, setScanFile] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => setIsMounted(true), 0);
    
    // Auth guard
    const userSession = localStorage.getItem("currentUser");
    if (!userSession) {
      router.push("/auth/login");
      return;
    }

    const cur = JSON.parse(userSession);

    // Get registered user data
    const allUsers = JSON.parse(localStorage.getItem("registeredUsers") || "{}");
    let activeUser = allUsers[cur.email];

    if (!activeUser) {
      // Fallback fallback if user session was active but user entry missing
      activeUser = {
        name: cur.name,
        email: cur.email,
        credits: 0,
        scans: [],
      };
      allUsers[cur.email] = activeUser;
      localStorage.setItem("registeredUsers", JSON.stringify(allUsers));
    }

    setTimeout(() => {
      setUserData(activeUser);

      // Check if redirecting from pricing with purchase intent
      const buyParam = searchParams.get("buy");
      const priceParam = searchParams.get("price");
      if (buyParam && priceParam) {
        setSelectedPack({ slots: parseInt(buyParam), price: priceParam });
        setIsCheckoutOpen(true);
      }

      // Check if there's a pending upload file from homepage
      const pendingFile = sessionStorage.getItem("pendingUploadFile");
      if (pendingFile) {
        setScanFile(pendingFile);
        sessionStorage.removeItem("pendingUploadFile");
      }
    }, 0);
  }, [router, searchParams]);

  // Sync state back to local storage
  const syncUserData = (updated: UserData) => {
    setUserData(updated);
    const allUsers = JSON.parse(localStorage.getItem("registeredUsers") || "{}");
    allUsers[updated.email] = updated;
    localStorage.setItem("registeredUsers", JSON.stringify(allUsers));
  };

  // Card formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 16);
    const matches = val.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(" "));
    } else {
      setCardNumber(val);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 2) {
      setExpiry(`${val.slice(0, 2)}/${val.slice(2, 4)}`);
    } else {
      setExpiry(val);
    }
  };

  // Handle Checkout submission
  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError("");

    if (!cardNumber || !cardName || !expiry || !cvv) {
      setCheckoutError("Please fill in all payment details.");
      return;
    }

    if (cardNumber.replace(/\s/g, "").length < 16) {
      setCheckoutError("Card number must be 16 digits.");
      return;
    }

    if (expiry.length < 5) {
      setCheckoutError("Expiry date is invalid.");
      return;
    }

    if (cvv.length < 3) {
      setCheckoutError("CVV must be 3 or 4 digits.");
      return;
    }

    setPaymentLoading(true);

    // Simulate Payment processing
    setTimeout(() => {
      if (!userData) return;

      const updated = {
        ...userData,
        credits: userData.credits + selectedPack.slots,
      };

      syncUserData(updated);
      setPaymentLoading(false);
      setIsCheckoutOpen(false);
      setCardNumber("");
      setCardName("");
      setExpiry("");
      setCvv("");
      alert(`Success! ${selectedPack.slots} credits added to your balance.`);
      
      // Clean query params
      router.replace("/dashboard");
    }, 1800);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file.name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0].name);
    }
  };

  const validateAndSetFile = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx" && ext !== "doc") {
      alert("Unsupported file format. Please upload PDF, DOCX, or DOC.");
      return;
    }
    setScanFile(fileName);
  };

  // Trigger Mock Turnitin Scan
  const startScan = () => {
    if (!userData || !scanFile) return;

    if (userData.credits <= 0) {
      alert("Insufficient scan credits. Please buy credits to scan this document.");
      setIsCheckoutOpen(true);
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setScanStatusText("Preparing file upload...");

    // Deduct 1 credit immediately
    const updatedUser = {
      ...userData,
      credits: userData.credits - 1,
    };
    syncUserData(updatedUser);

    // Animation progress simulation
    const intervals = [
      { prg: 25, text: "Extracting document sentences...", delay: 2000 },
      { prg: 55, text: "Submitting to Turnitin Feedback Studio (No-Repository Mode)...", delay: 4000 },
      { prg: 80, text: "Analyzing matching document databases...", delay: 6000 },
      { prg: 95, text: "Verifying AI writing patterns...", delay: 8000 },
      { prg: 100, text: "Generating originality report sheets...", delay: 9500 },
    ];

    intervals.forEach((step) => {
      setTimeout(() => {
        setScanProgress(step.prg);
        setScanStatusText(step.text);

        if (step.prg === 100) {
          // Finish scanning and save record
          setTimeout(() => {
            const similarityScore = Math.floor(Math.random() * 20) + 3; // 3% to 22%
            const aiScore = Math.random() > 0.35 ? Math.floor(Math.random() * 80) + 5 : 0; // 0% or 5% to 85%

            const newScan: ScanRecord = {
              id: Date.now().toString(),
              filename: scanFile,
              date: new Date().toLocaleDateString("en-LK", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }),
              similarity: similarityScore,
              ai: aiScore,
              status: "Completed",
            };

            const finalizedUser = {
              ...userData,
              credits: userData.credits - 1, // Already deducted above, keep current sync
              scans: [newScan, ...userData.scans],
            };
            // Set correct credits
            finalizedUser.credits = userData.credits - 1;

            syncUserData(finalizedUser);
            setIsScanning(false);
            setScanFile(null);
            alert("Scan completed! Check originality metrics in the history list below.");
          }, 1000);
        }
      }, step.delay);
    });
  };

  const deleteScan = (scanId: string) => {
    if (!userData) return;
    if (!confirm("Are you sure you want to permanently delete this report scan record?")) return;

    const updated = {
      ...userData,
      scans: userData.scans.filter((s) => s.id !== scanId),
    };
    syncUserData(updated);
  };
  if (!isMounted || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 bg-muted/15 py-10 text-left">
        <div className="mx-auto max-w-5xl px-6 space-y-8">
          {/* Welcome row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl">
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">
                Welcome, {userData.name}!
              </h1>
              <p className="text-xs text-muted-foreground font-semibold">
                Workspace Dashboard · {userData.email}
              </p>
            </div>

            {/* Credit count */}
            <div className="flex items-center gap-4 bg-muted/30 border border-border/80 px-4 py-3 rounded-xl self-start md:self-auto">
              <Coins className="h-5 w-5 text-primary shrink-0 animate-pulse" />
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Available Credits
                </p>
                <p className="text-xl font-black text-foreground tracking-tight">
                  {userData.credits} Scan Slots
                </p>
              </div>
              <button
                onClick={() => router.push("/packages")}
                className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer"
                title="View Packages"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Upload Panel */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Scan Document
            </h2>

            {isScanning ? (
              <div className="py-10 text-center space-y-6 max-w-md mx-auto">
                <div className="relative flex items-center justify-center">
                  <RefreshCw className="h-10 w-10 text-primary animate-spin" />
                  <span className="absolute text-xs font-black text-primary font-mono">{scanProgress}%</span>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-foreground">Turnitin scan processing...</h4>
                  <p className="text-xs text-muted-foreground font-semibold leading-relaxed animate-pulse">
                    {scanStatusText}
                  </p>
                </div>
                {/* Bar */}
                <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-2.5 transition-all duration-300 ease-out"
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Upload drag drop */}
                <div className="md:col-span-7">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ${
                      isDragging
                        ? "border-primary bg-primary/5 scale-[1.01]"
                        : "border-border hover:border-primary/20 bg-background"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.docx,.doc"
                      className="hidden"
                    />

                    {scanFile ? (
                      <div className="space-y-3 py-6">
                        <FileText className="h-10 w-10 text-primary mx-auto" />
                        <div>
                          <p className="text-sm font-extrabold text-foreground max-w-xs truncate mx-auto">
                            {scanFile}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setScanFile(null);
                            }}
                            className="text-xs text-red-500 font-bold hover:underline mt-1"
                          >
                            Remove File
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 py-6">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                        <div>
                          <p className="text-sm font-bold text-foreground">Drag & drop report file here</p>
                          <p className="text-xs text-muted-foreground">or click to browse documents</p>
                        </div>
                        <span className="inline-block text-[10px] font-bold text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded">
                          PDF, DOCX up to 50MB
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Confirm upload col */}
                <div className="md:col-span-5 space-y-4">
                  <div className="p-4 bg-muted/30 border border-border/80 rounded-xl space-y-2.5 text-xs font-semibold text-muted-foreground leading-relaxed">
                    <p className="flex items-center gap-1.5 text-foreground font-bold">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      Scan Policy Summary:
                    </p>
                    <p>• Deducts exactly **1 scan slot** credit.</p>
                    <p>• Strict No-Repository analysis activated.</p>
                    <p>• Data auto-delete executes in exactly 24 hours.</p>
                  </div>

                  <button
                    onClick={startScan}
                    disabled={!scanFile}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-extrabold text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/20 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 hover:scale-[1.01] cursor-pointer"
                  >
                    <span>Analyze Document</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Scan history logs */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Scan History
            </h2>

            {userData.scans.length === 0 ? (
              <div className="text-center py-12 space-y-2 border border-dashed border-border rounded-xl bg-muted/5">
                <FileText className="h-8 w-8 text-muted-foreground/60 mx-auto" />
                <p className="text-sm font-bold text-muted-foreground">No scans found</p>
                <p className="text-xs text-muted-foreground/80">Upload your first draft above to see results.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/80 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                      <th className="py-3 text-left font-bold">File Checked</th>
                      <th className="py-3 text-left font-bold">Date Scanned</th>
                      <th className="py-3 text-center font-bold">Similarity Index</th>
                      <th className="py-3 text-center font-bold">AI Writing</th>
                      <th className="py-3 text-right font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-semibold text-muted-foreground">
                    {userData.scans.map((scan) => (
                      <tr key={scan.id} className="hover:bg-muted/10 transition-colors">
                        {/* Filename */}
                        <td className="py-3.5 text-left text-foreground font-bold max-w-xs truncate">
                          {scan.filename}
                        </td>
                        {/* Date */}
                        <td className="py-3.5 text-left text-xs font-medium">
                          {scan.date}
                        </td>
                        {/* Similarity Score */}
                        <td className="py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-black rounded-lg ${
                              scan.similarity > 15
                                ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                : "bg-primary/10 text-primary border border-primary/20"
                            }`}
                          >
                            {scan.similarity}%
                          </span>
                        </td>
                        {/* AI Detection Score */}
                        <td className="py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-black rounded-lg ${
                              scan.ai > 30
                                ? "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20"
                                : "bg-primary/10 text-primary border border-primary/20"
                            }`}
                          >
                            {scan.ai}%
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="py-3.5 text-right space-x-1">
                          <button
                            onClick={() => triggerPdfDownload(scan.filename, scan.similarity, "similarity")}
                            className="inline-flex h-8 items-center gap-1 px-2.5 rounded-lg border border-border bg-background text-xs font-bold text-foreground hover:bg-secondary cursor-pointer"
                            title="Download Similarity Report"
                          >
                            <Download className="h-3.5 w-3.5 text-primary" />
                            <span className="hidden sm:inline">Similarity</span>
                          </button>
                          <button
                            onClick={() => triggerPdfDownload(scan.filename, scan.ai, "ai")}
                            className="inline-flex h-8 items-center gap-1 px-2.5 rounded-lg border border-border bg-background text-xs font-bold text-foreground hover:bg-secondary cursor-pointer"
                            title="Download AI Report"
                          >
                            <Download className="h-3.5 w-3.5 text-cyan-500" />
                            <span className="hidden sm:inline">AI</span>
                          </button>
                          <button
                            onClick={() => deleteScan(scan.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/15 bg-background text-red-500 hover:bg-red-500/10 cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 text-left">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 relative shadow-2xl animate-in scale-in duration-200">
            {/* Close */}
            <button
              onClick={() => {
                setIsCheckoutOpen(false);
                router.replace("/dashboard"); // Clear query params on modal close
              }}
              className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Credit Top-up checkout
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">
                Secure payment gateway sandbox simulation
              </p>
            </div>

            {/* Pack details */}
            <div className="p-4 bg-muted/40 border border-border rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Order Plan</p>
                <p className="text-sm font-extrabold text-foreground">{selectedPack.slots} Scan Credits</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-muted-foreground uppercase">Price</p>
                <p className="text-base font-black text-foreground">LKR {parseFloat(selectedPack.price).toLocaleString("en-LK")}</p>
              </div>
            </div>

            {checkoutError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-500 rounded-xl">
                {checkoutError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handlePayment} className="space-y-4">
              {/* Cardholder */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cardholder Name</label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Kasun Perera"
                  className="w-full text-sm font-semibold text-foreground bg-background border border-border rounded-xl px-3 py-2 focus:border-primary focus:outline-none"
                />
              </div>

              {/* Card Number */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Card Number</label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="w-full text-sm font-semibold text-foreground bg-background border border-border rounded-xl px-3 py-2 focus:border-primary focus:outline-none"
                />
              </div>

              {/* Exp & CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    required
                    value={expiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    className="w-full text-sm font-semibold text-foreground bg-background border border-border rounded-xl px-3 py-2 focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">CVV</label>
                  <input
                    type="password"
                    required
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="•••"
                    className="w-full text-sm font-semibold text-foreground bg-background border border-border rounded-xl px-3 py-2 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-extrabold text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/20 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
                >
                  {paymentLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Authorizing transaction...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Pay LKR {parseFloat(selectedPack.price).toLocaleString("en-LK")}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-muted/20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
