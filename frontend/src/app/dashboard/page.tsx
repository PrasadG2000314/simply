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
  AlertCircle,
  XCircle,
  Download,
  Trash2,
  Lock,
  CreditCard,
  Building2,
  Plus,
  RefreshCw,
  X,
  FileCheck,
  Eye,
  Sparkles,
  Info,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

interface ScanRecord {
  id: string;
  filename: string;
  date: string;
  similarity: number;
  ai: number;
  status: "Processing" | "Completed" | "Failed";
}

interface PaymentSlipRecord {
  _id?: string;
  id?: string;
  userName?: string;
  userEmail?: string;
  packageName: string;
  credits: number;
  amount: number;
  slipImage: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  createdAt: string;
}

interface UserData {
  id?: string;
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
  const [mySlips, setMySlips] = useState<PaymentSlipRecord[]>([]);
  const [pendingCoins, setPendingCoins] = useState(0);

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentTab, setPaymentTab] = useState<"card" | "bank">("bank");
  const [selectedPack, setSelectedPack] = useState<{ slots: number; price: string; name: string }>({
    slots: 5,
    price: "4750",
    name: "5 Credits",
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // Bank Slip Upload State inside modal
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const slipInputRef = useRef<HTMLInputElement>(null);

  // Scan Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [scanFile, setScanFile] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox view for uploaded slip image
  const [viewSlipUrl, setViewSlipUrl] = useState<string | null>(null);

  const fetchMySlips = async () => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/payments/my-slips`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMySlips(data.slips);
        setPendingCoins(data.pendingCredits);
      }
    } catch (e) {
      console.error("Error fetching my slips:", e);
    }
  };

  const fetchMe = async () => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && userData) {
        const updated = {
          ...userData,
          credits: data.user.credits !== undefined ? data.user.credits : userData.credits,
        };
        setUserData(updated);

        // Sync local storage
        const allUsers = JSON.parse(localStorage.getItem("registeredUsers") || "{}");
        if (allUsers[updated.email]) {
          allUsers[updated.email].credits = updated.credits;
          localStorage.setItem("registeredUsers", JSON.stringify(allUsers));
        }
      }
    } catch (e) {
      console.error("Error fetching user details:", e);
    }
  };

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

      // Fetch payment slips from backend if user is logged in
      fetchMySlips();
      fetchMe();

      // Check if redirecting from pricing with purchase intent
      const buyParam = searchParams.get("buy");
      const priceParam = searchParams.get("price");
      const nameParam = searchParams.get("name");
      if (buyParam && priceParam) {
        setSelectedPack({
          slots: parseInt(buyParam),
          price: priceParam,
          name: nameParam || `${buyParam} Credits`,
        });
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

  // Handle Slip Image Selection with Canvas Compression
  const handleSlipFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSlipFile(file);
      setCheckoutError("");

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_SIZE = 1000;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
            setSlipPreview(compressedBase64);
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSlipPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Submit Payment Slip
  const handleBankSlipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError("");

    if (!slipPreview) {
      setCheckoutError("Please upload your bank transfer payment slip image.");
      return;
    }

    setPaymentLoading(true);

    const token = localStorage.getItem("authToken") || localStorage.getItem("token");

    let apiSuccess = false;

    if (token) {
      try {
        const res = await fetch(`${API_URL}/payments/upload-slip`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            packageName: selectedPack.name,
            credits: selectedPack.slots,
            amount: parseFloat(selectedPack.price),
            slipImage: slipPreview,
          }),
        });

        const data = await res.json();

        if (data.success) {
          apiSuccess = true;
          const localSlips: PaymentSlipRecord[] = JSON.parse(localStorage.getItem("paymentSlips") || "[]");
          const newLocalSlip: PaymentSlipRecord = {
            _id: data.slip?._id,
            id: data.slip?._id || Date.now().toString(),
            userName: userData?.name || "Customer",
            userEmail: userData?.email || "user@example.com",
            packageName: selectedPack.name,
            credits: selectedPack.slots,
            amount: parseFloat(selectedPack.price),
            slipImage: slipPreview,
            status: "pending",
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem("paymentSlips", JSON.stringify([newLocalSlip, ...localSlips]));

          alert(`Payment slip uploaded successfully! ${selectedPack.slots} coins are now pending admin approval.`);
          setIsCheckoutOpen(false);
          setSlipFile(null);
          setSlipPreview(null);
          setPaymentLoading(false);
          fetchMySlips();
          router.replace("/dashboard");
          return;
        } else {
          setCheckoutError(data.message || "Failed to submit payment slip.");
        }
      } catch (err) {
        console.error("Payment slip upload error:", err);
      }
    }

    if (!apiSuccess) {
      const newSlip: PaymentSlipRecord = {
        id: Date.now().toString(),
        userName: userData?.name || "Customer",
        userEmail: userData?.email || "user@example.com",
        packageName: selectedPack.name,
        credits: selectedPack.slots,
        amount: parseFloat(selectedPack.price),
        slipImage: slipPreview,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      const localSlips: PaymentSlipRecord[] = JSON.parse(localStorage.getItem("paymentSlips") || "[]");
      const updatedLocalSlips = [newSlip, ...localSlips];
      localStorage.setItem("paymentSlips", JSON.stringify(updatedLocalSlips));

      const updatedSlips = [newSlip, ...mySlips];
      setMySlips(updatedSlips);

      const newPending = updatedSlips
        .filter((s) => s.status === "pending")
        .reduce((sum, s) => sum + s.credits, 0);
      setPendingCoins(newPending);

      setPaymentLoading(false);
      setIsCheckoutOpen(false);
      setSlipFile(null);
      setSlipPreview(null);
      alert(`Payment slip uploaded successfully! ${selectedPack.slots} coins are now pending admin approval.`);
      router.replace("/dashboard");
    }
  };

  // Drag and Drop handlers for scan documents
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
          setTimeout(() => {
            const similarityScore = Math.floor(Math.random() * 20) + 3;
            const aiScore = Math.random() > 0.35 ? Math.floor(Math.random() * 80) + 5 : 0;

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
              credits: userData.credits - 1,
              scans: [newScan, ...userData.scans],
            };

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

            {/* Credit count & Pending coins */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Available Balance */}
              <div className="flex items-center gap-3 bg-muted/30 border border-border/80 px-4 py-2.5 rounded-xl">
                <Coins className="h-5 w-5 text-primary shrink-0 animate-pulse" />
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Available Coins
                  </p>
                  <p className="text-lg font-black text-foreground tracking-tight">
                    {userData.credits} Coins
                  </p>
                </div>
              </div>

              {/* Pending Balance */}
              {pendingCoins > 0 && (
                <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 rounded-xl">
                  <Clock className="h-5 w-5 text-amber-500 shrink-0 animate-spin" />
                  <div>
                    <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">
                      Pending Approval
                    </p>
                    <p className="text-lg font-black text-amber-600 tracking-tight">
                      +{pendingCoins} Coins
                    </p>
                  </div>
                </div>
              )}

              {/* Buy Plan Button */}
              <button
                onClick={() => router.push("/packages")}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Buy Plan
              </button>
            </div>
          </div>

          {/* Pending Coin Notification Banner */}
          {pendingCoins > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-700 dark:text-amber-400">
                    Payment Slip Under Admin Verification
                  </h4>
                  <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-300">
                    You have <span className="font-bold">{pendingCoins} coins</span> waiting for approval. Once verified by our admin team, your coins will be automatically added to your available balance.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  fetchMySlips();
                  fetchMe();
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline shrink-0"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Check Status
              </button>
            </div>
          )}

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
                    <p>• Deducts exactly **1 coin / credit**.</p>
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

          {/* Payment Slips History Section */}
          {mySlips.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-foreground tracking-tight flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Bank Slip Top-up Requests
                </h2>
                <button
                  onClick={() => {
                    fetchMySlips();
                    fetchMe();
                  }}
                  className="text-xs font-extrabold text-primary hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/80 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                      <th className="py-3 text-left font-bold">Package</th>
                      <th className="py-3 text-center font-bold">Coins</th>
                      <th className="py-3 text-center font-bold">Amount</th>
                      <th className="py-3 text-center font-bold">Slip Image</th>
                      <th className="py-3 text-center font-bold">Status</th>
                      <th className="py-3 text-right font-bold">Submitted Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-semibold text-muted-foreground">
                    {mySlips.map((slip, i) => (
                      <tr key={slip._id || slip.id || i} className="hover:bg-muted/10 transition-colors">
                        <td className="py-3.5 text-left text-foreground font-bold">
                          {slip.packageName}
                        </td>
                        <td className="py-3.5 text-center font-black text-foreground">
                          +{slip.credits} Coins
                        </td>
                        <td className="py-3.5 text-center font-bold text-foreground">
                          LKR {slip.amount.toLocaleString("en-LK")}
                        </td>
                        <td className="py-3.5 text-center">
                          <button
                            onClick={() => setViewSlipUrl(slip.slipImage)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/10 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Slip
                          </button>
                        </td>
                        <td className="py-3.5 text-center">
                          {slip.status === "pending" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-black text-amber-600">
                              <Clock className="h-3 w-3" />
                              Pending Approval
                            </span>
                          )}
                          {slip.status === "approved" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-0.5 text-[10px] font-black text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Approved
                            </span>
                          )}
                          {slip.status === "rejected" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[10px] font-black text-red-600" title={slip.adminNote}>
                              <XCircle className="h-3 w-3" />
                              Rejected
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-right text-xs font-medium">
                          {new Date(slip.createdAt).toLocaleDateString("en-LK")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                        <td className="py-3.5 text-left text-foreground font-bold max-w-xs truncate">
                          {scan.filename}
                        </td>
                        <td className="py-3.5 text-left text-xs font-medium">
                          {scan.date}
                        </td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 text-left overflow-y-auto">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 relative shadow-2xl animate-in scale-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* Close */}
            <button
              onClick={() => {
                setIsCheckoutOpen(false);
                setSlipFile(null);
                setSlipPreview(null);
                router.replace("/dashboard");
              }}
              className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                Buy Coins / Plan Checkout
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">
                Select your preferred payment method to complete the package purchase.
              </p>
            </div>

            {/* Pack details summary */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Selected Package</p>
                <p className="text-sm font-extrabold text-foreground">{selectedPack.name} ({selectedPack.slots} Coins)</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Payable</p>
                <p className="text-base font-black text-primary">LKR {parseFloat(selectedPack.price).toLocaleString("en-LK")}</p>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setPaymentTab("card")}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentTab === "card"
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                Card Payment
              </button>
              <button
                type="button"
                onClick={() => setPaymentTab("bank")}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentTab === "bank"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                Bank Transfer & Slip
              </button>
            </div>

            {/* Tab 1: Card Payment (Disabled / Future) */}
            {paymentTab === "card" && (
              <div className="space-y-4 border border-dashed border-border rounded-2xl p-6 text-center bg-muted/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mx-auto">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-0.5 text-[10px] font-black text-amber-600 uppercase tracking-wider">
                    <Sparkles className="h-3 w-3" /> Coming Soon
                  </span>
                  <h4 className="text-sm font-extrabold text-foreground pt-1">
                    Card Payment Unavailable
                  </h4>
                  <p className="text-xs text-muted-foreground font-semibold max-w-xs mx-auto leading-relaxed">
                    Direct Credit/Debit card payment integration is coming in a future update.
                    Please switch to **Bank Transfer & Upload Slip** to complete your order now.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentTab("bank")}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground hover:bg-primary/95 cursor-pointer shadow-md"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  Use Bank Transfer & Upload Slip
                </button>
              </div>
            )}

            {/* Tab 2: Bank Transfer & Slip Upload */}
            {paymentTab === "bank" && (
              <form onSubmit={handleBankSlipSubmit} className="space-y-5">
                {/* Bank Account Info Box */}
                <div className="p-4 bg-muted/40 border border-border rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-primary" />
                      Company Bank Details:
                    </p>
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      LKR Account
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Bank Name</p>
                      <p className="font-extrabold text-foreground">Commercial Bank</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Account Name</p>
                      <p className="font-extrabold text-foreground">Simply Academic Solutions</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Account Number</p>
                      <p className="font-mono font-black text-foreground">8009123456</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Branch</p>
                      <p className="font-extrabold text-foreground">Colombo Main Branch</p>
                    </div>
                  </div>
                </div>

                {checkoutError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-500 rounded-xl">
                    {checkoutError}
                  </div>
                )}

                {/* Slip File Upload Field */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-foreground flex items-center justify-between">
                    <span>Upload Payment Slip / Receipt Image</span>
                    <span className="text-[10px] font-normal text-muted-foreground">JPG, PNG, PDF</span>
                  </label>

                  <div
                    onClick={() => slipInputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center cursor-pointer transition-all duration-200 ${
                      slipPreview
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30 bg-background"
                    }`}
                  >
                    <input
                      type="file"
                      ref={slipInputRef}
                      onChange={handleSlipFileChange}
                      accept="image/*,.pdf"
                      className="hidden"
                    />

                    {slipPreview ? (
                      <div className="space-y-2 py-2">
                        <img
                          src={slipPreview}
                          alt="Payment Slip Preview"
                          className="h-32 object-contain mx-auto rounded-lg border border-border shadow-sm"
                        />
                        <p className="text-xs font-bold text-primary truncate max-w-xs mx-auto">
                          {slipFile ? slipFile.name : "Payment Slip Selected"}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSlipFile(null);
                            setSlipPreview(null);
                          }}
                          className="text-[11px] text-red-500 font-bold hover:underline"
                        >
                          Change Slip Image
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 py-4">
                        <Upload className="h-7 w-7 text-muted-foreground mx-auto" />
                        <div>
                          <p className="text-xs font-bold text-foreground">Click to browse slip receipt image</p>
                          <p className="text-[11px] text-muted-foreground">Make sure reference number and amount are visible</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Approval notice info */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300 font-semibold">
                  <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    After uploading, your payment will be marked as **Pending**. Once approved by admin, **{selectedPack.slots} coins** will be added to your account balance.
                  </p>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={paymentLoading || !slipPreview}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-extrabold text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/20 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
                >
                  {paymentLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Submitting Slip for Approval...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Submit Payment Slip for Approval</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Slip View Modal */}
      {viewSlipUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-w-2xl w-full bg-card border border-border rounded-3xl p-6 space-y-4 text-center">
            <button
              onClick={() => setViewSlipUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h4 className="text-sm font-black text-foreground">Uploaded Payment Slip</h4>
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-border bg-black/20 p-2">
              <img src={viewSlipUrl} alt="Payment Slip" className="max-w-full h-auto mx-auto rounded-lg" />
            </div>
            <button
              onClick={() => setViewSlipUrl(null)}
              className="rounded-xl border border-border px-5 py-2 text-xs font-bold hover:bg-secondary cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-muted/20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
