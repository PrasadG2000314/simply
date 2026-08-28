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
  Lock,
  CreditCard,
  Building2,
  Plus,
  RefreshCw,
  X,
  FileCheck,
  Eye,
  Sparkles,
  BookOpen,
  Send,
  Paperclip,
  Check,
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

interface DocumentRecord {
  _id?: string;
  id?: string;
  userName?: string;
  userEmail?: string;
  title: string;
  description?: string;
  requirements?: string;
  deliverables?: string;
  deadline?: string;
  attachment?: string;
  attachmentName?: string;
  resultFile?: string;
  resultFileName?: string;
  similarityScore?: number;
  aiScore?: number;
  status: "pending" | "approved" | "rejected" | "cancelled" | string;
  adminNote?: string;
  createdAt: string;
}

type AssignmentRecord = DocumentRecord;

interface UserData {
  id?: string;
  name: string;
  email: string;
  credits: number;
  holdCredits?: number;
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
This is a simulated PDF file downloaded from your TurniPass workspace.`;

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
  const [myAssignments, setMyAssignments] = useState<AssignmentRecord[]>([]);
  const [pendingCoins, setPendingCoins] = useState(0);

  // Checkout Modal State (Buy Plan)
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

  // Assignment Modal & Form State
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [assignTitle, setAssignTitle] = useState("");
  const [assignDesc, setAssignDesc] = useState("");
  const [assignReqs, setAssignReqs] = useState("");
  const [assignDeliverables, setAssignDeliverables] = useState("");
  const [assignDeadline, setAssignDeadline] = useState("");
  const [assignAttachment, setAssignAttachment] = useState<string | null>(null);
  const [assignAttachmentName, setAssignAttachmentName] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");
  const assignFileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox view for uploaded slip image / assignment attachment
  const [viewSlipUrl, setViewSlipUrl] = useState<string | null>(null);
  const [activeAssignmentModal, setActiveAssignmentModal] = useState<AssignmentRecord | null>(null);

  // Scan Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [scanFile, setScanFile] = useState<string | null>(null);
  const [scanTitle, setScanTitle] = useState("");
  const [scanUploader, setScanUploader] = useState("");
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const fetchMyAssignments = async () => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    let fetched: DocumentRecord[] = [];

    if (token) {
      try {
        const res = await fetch(`${API_URL}/documents/my-documents`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          fetched = data.documents || data.assignments || [];
        }
      } catch (e) {
        console.error("Error fetching my documents:", e);
      }
    }

    // Merge with local storage documents
    const localAssns: DocumentRecord[] = JSON.parse(
      localStorage.getItem("myDocuments") || localStorage.getItem("myAssignments") || "[]"
    );
    const combined = [...fetched];
    localAssns.forEach((la) => {
      const id = la._id || la.id;
      if (!combined.some((a) => (a._id || a.id) === id)) {
        combined.push(la);
      }
    });

    setMyAssignments(combined);
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
          holdCredits: data.user.holdCredits !== undefined ? data.user.holdCredits : userData.holdCredits,
        };
        setUserData(updated);

        // Sync local storage
        const allUsers = JSON.parse(localStorage.getItem("registeredUsers") || "{}");
        if (allUsers[updated.email]) {
          allUsers[updated.email].credits = updated.credits;
          allUsers[updated.email].holdCredits = updated.holdCredits;
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
        holdCredits: 0,
        scans: [],
      };
      allUsers[cur.email] = activeUser;
      localStorage.setItem("registeredUsers", JSON.stringify(allUsers));
    }

    setTimeout(() => {
      setUserData(activeUser);

      // Fetch payment slips, assignments, and user details from backend
      fetchMySlips();
      fetchMyAssignments();
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
        const titleWOExt = pendingFile.substring(0, pendingFile.lastIndexOf(".")) || pendingFile;
        setScanTitle(titleWOExt);
        sessionStorage.removeItem("pendingUploadFile");
      }
      if (activeUser?.name) {
        setScanUploader(activeUser.name);
      }
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Handle Assignment Attachment Selection
  const handleAssignFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAssignAttachmentName(file.name);

      const reader = new FileReader();
      reader.onloadend = () => {
        setAssignAttachment(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Assignment Handler
  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError("");

    if (!userData) return;

    if (!assignTitle) {
      setAssignError("Please enter the document title.");
      return;
    }

    if (!assignAttachmentName) {
      setAssignError("Please upload a document file.");
      return;
    }

    if ((userData.credits || 0) < 1) {
      setAssignError("Insufficient available coins! You need at least 1 coin to submit a document.");
      return;
    }

    setAssignLoading(true);

    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    let apiSuccess = false;

    // Deduct 1 coin to hold position in state immediately
    const updatedUser = {
      ...userData,
      credits: (userData.credits || 0) - 1,
      holdCredits: (userData.holdCredits || 0) + 1,
    };

    const effectiveDesc = assignDesc || assignTitle || "Uploaded document";
    // eslint-disable-next-line react-hooks/purity
    const effectiveDeadline = assignDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    if (token) {
      try {
        const res = await fetch(`${API_URL}/documents/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: assignTitle,
            description: effectiveDesc,
            requirements: assignReqs,
            deliverables: assignDeliverables,
            deadline: effectiveDeadline,
            attachment: assignAttachment || "",
            attachmentName: assignAttachmentName || "",
          }),
        });

        const data = await res.json();

        if (data.success) {
          apiSuccess = true;
          syncUserData({
            ...userData,
            credits: data.availableCredits !== undefined ? data.availableCredits : updatedUser.credits,
            holdCredits: data.holdCredits !== undefined ? data.holdCredits : updatedUser.holdCredits,
          });

          // Sync local storage list
          const localAssns: DocumentRecord[] = JSON.parse(
            localStorage.getItem("myDocuments") || localStorage.getItem("myAssignments") || "[]"
          );
          const docObj = data.document || data.assignment;
          const newLocalAssn: DocumentRecord = {
            _id: docObj?._id,
            // eslint-disable-next-line react-hooks/purity
            id: docObj?._id || Date.now().toString(),
            userName: userData.name,
            userEmail: userData.email,
            title: assignTitle,
            description: effectiveDesc,
            requirements: assignReqs,
            deliverables: assignDeliverables,
            deadline: effectiveDeadline,
            attachment: assignAttachment || "",
            attachmentName: assignAttachmentName || "",
            status: "pending",
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem("myDocuments", JSON.stringify([newLocalAssn, ...localAssns]));
          localStorage.setItem("myAssignments", JSON.stringify([newLocalAssn, ...localAssns]));

          alert("Document submitted successfully! 1 coin placed on hold awaiting admin approval.");
          setIsAssignmentModalOpen(false);
          resetAssignmentForm();
          fetchMyAssignments();
          fetchMe();
          return;
        } else {
          setAssignError(data.message || "Failed to submit document.");
        }
      } catch (err) {
        console.error("Document submit error:", err);
      }
    }

    if (!apiSuccess) {
      // Fallback local storage simulation
      syncUserData(updatedUser);

      const newAssn: AssignmentRecord = {
        // eslint-disable-next-line react-hooks/purity
        id: Date.now().toString(),
        userName: userData.name,
        userEmail: userData.email,
        title: assignTitle,
        description: effectiveDesc,
        requirements: assignReqs,
        deliverables: assignDeliverables,
        deadline: effectiveDeadline,
        attachment: assignAttachment || "",
        attachmentName: assignAttachmentName || "",
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      const localAssns: AssignmentRecord[] = JSON.parse(localStorage.getItem("myAssignments") || "[]");
      const updatedLocalAssns = [newAssn, ...localAssns];
      localStorage.setItem("myAssignments", JSON.stringify(updatedLocalAssns));
      setMyAssignments(updatedLocalAssns);

      setAssignLoading(false);
      setIsAssignmentModalOpen(false);
      resetAssignmentForm();
      alert("Document submitted successfully! 1 coin placed on hold awaiting admin approval.");
    }
  };

  const resetAssignmentForm = () => {
    setAssignTitle("");
    setAssignDesc("");
    setAssignReqs("");
    setAssignDeliverables("");
    setAssignDeadline("");
    setAssignAttachment(null);
    setAssignAttachmentName("");
    setAssignError("");
    setAssignLoading(false);
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
    const allowed = ["pdf", "docx", "doc", "zip", "png", "jpg", "jpeg"];
    if (!ext || !allowed.includes(ext)) {
      alert("Unsupported file format. Please upload PDF, DOCX, ZIP, or Image files.");
      return;
    }
    setScanFile(fileName);
  };

  // Submit Document & Hold 1 Coin (Calls POST /api/documents/submit)
  const startScan = async () => {
    if (!userData || !scanFile) return;

    if ((userData.credits || 0) < 1) {
      alert("Insufficient available coins! You need at least 1 coin to scan a document.");
      setIsCheckoutOpen(true);
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setScanStatusText("Submitting document to Turnitin & placing 1 coin on hold...");

    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    let apiSuccess = false;

    // Deduct 1 coin from available credits and move to holdCredits
    const updatedUser = {
      ...userData,
      credits: (userData.credits || 0) - 1,
      holdCredits: (userData.holdCredits || 0) + 1,
    };

    if (token) {
      try {
        const res = await fetch(`${API_URL}/documents/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: scanFile, // Use filename as title directly!
            description: `Turnitin No-Repository Scan for ${scanFile}`,
            attachmentName: scanFile,
            deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }),
        });

        const data = await res.json();

        if (data.success) {
          apiSuccess = true;
          syncUserData({
            ...userData,
            credits: data.availableCredits !== undefined ? data.availableCredits : updatedUser.credits,
            holdCredits: data.holdCredits !== undefined ? data.holdCredits : updatedUser.holdCredits,
          });
          fetchMyAssignments();
        }
      } catch (e) {
        console.error("Backend submit document error:", e);
      }
    }

    if (!apiSuccess) {
      // Local fallback submission
      const newDoc: DocumentRecord = {
        id: Date.now().toString(),
        title: scanFile,
        description: `Turnitin No-Repository Scan for ${scanFile}`,
        attachmentName: scanFile,
        userName: userData.name || "User",
        userEmail: userData.email,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      const localAssns: DocumentRecord[] = JSON.parse(
        localStorage.getItem("myDocuments") || localStorage.getItem("myAssignments") || "[]"
      );
      const updatedLocal = [newDoc, ...localAssns];
      localStorage.setItem("myDocuments", JSON.stringify(updatedLocal));
      localStorage.setItem("myAssignments", JSON.stringify(updatedLocal));
      setMyAssignments(updatedLocal);
      syncUserData(updatedUser);
    }

    // Animation progress simulation
    const intervals = [
      { prg: 25, text: "Extracting document text...", delay: 1500 },
      { prg: 55, text: "Submitting to Turnitin Feedback Studio (No-Repository Mode)...", delay: 3000 },
      { prg: 80, text: "Analyzing matching document databases...", delay: 4500 },
      { prg: 95, text: "Verifying AI writing patterns...", delay: 6000 },
      { prg: 100, text: "Generating originality report...", delay: 7500 },
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
              credits: Math.max(0, (userData.credits || 1) - 1),
              holdCredits: (userData.holdCredits || 0) + 1,
              scans: [newScan, ...(userData.scans || [])],
            };

            syncUserData(finalizedUser);
            setIsScanning(false);
            setScanFile(null);
            alert(`Document "${scanFile}" submitted successfully! 1 coin placed on hold.`);
          }, 600);
        }
      }, step.delay);
    });
  };

  // Cancel Document Case (Refunds 1 coin back to total available coins)
  const handleCancelDocument = async (docId: string) => {
    if (!userData) return;
    if (!confirm("Are you sure you want to cancel this submission? 1 held coin will be returned to your total available coins.")) {
      return;
    }

    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    let apiSuccess = false;

    if (token) {
      try {
        const res = await fetch(`${API_URL}/documents/${docId}/cancel`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          apiSuccess = true;
          syncUserData({
            ...userData,
            credits: data.availableCredits !== undefined ? data.availableCredits : (userData.credits || 0) + 1,
            holdCredits: data.holdCredits !== undefined ? data.holdCredits : Math.max(0, (userData.holdCredits || 0) - 1),
          });
          fetchMyAssignments();
          fetchMe();
          alert("Document case cancelled! 1 coin returned to your total available coins.");
          return;
        }
      } catch (err) {
        console.error("Error cancelling document:", err);
      }
    }

    if (!apiSuccess) {
      const localAssns: DocumentRecord[] = JSON.parse(
        localStorage.getItem("myDocuments") || localStorage.getItem("myAssignments") || "[]"
      );
      const updatedLocal: DocumentRecord[] = localAssns.map((d) => {
        if ((d._id || d.id) === docId) {
          return { ...d, status: "cancelled" };
        }
        return d;
      });
      localStorage.setItem("myDocuments", JSON.stringify(updatedLocal));
      localStorage.setItem("myAssignments", JSON.stringify(updatedLocal));
      setMyAssignments(updatedLocal);

      const updatedUser = {
        ...userData,
        credits: (userData.credits || 0) + 1,
        holdCredits: Math.max(0, (userData.holdCredits || 0) - 1),
      };
      syncUserData(updatedUser);
      alert("Document case cancelled! 1 coin returned to your total available coins.");
    }
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

  const holdCoins = userData.holdCredits || 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 bg-muted/15 py-6 sm:py-10 text-left">
        <div className="mx-auto max-w-5xl px-3.5 sm:px-6 space-y-6 sm:space-y-8">
          {/* Welcome row & Stats Cards */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-card border border-border p-4 sm:p-6 rounded-2xl shadow-sm">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Welcome, {userData.name}!
              </h1>
              <p className="text-xs text-muted-foreground font-semibold truncate max-w-xs sm:max-w-md">
                Workspace Dashboard · {userData.email}
              </p>
            </div>

            {/* Credit count & Hold Coins */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3">
              {/* Available Coins */}
              <div className="flex items-center gap-2.5 sm:gap-3 bg-muted/30 border border-border/80 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl">
                <Coins className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-primary shrink-0 animate-pulse" />
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                    Available
                  </p>
                  <p className="text-base sm:text-lg font-black text-foreground tracking-tight">
                    {userData.credits} <span className="text-xs font-bold text-muted-foreground hidden sm:inline">Coins</span>
                  </p>
                </div>
              </div>

              {/* Hold Coins */}
              <div className="flex items-center gap-2.5 sm:gap-3 bg-amber-500/10 border border-amber-500/20 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl">
                <Lock className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] font-extrabold text-amber-600 uppercase tracking-wider truncate">
                    Hold Position
                  </p>
                  <p className="text-base sm:text-lg font-black text-amber-600 tracking-tight">
                    {holdCoins} <span className="text-xs font-bold text-amber-600/80 hidden sm:inline">Coins</span>
                  </p>
                </div>
              </div>

              {/* Pending Balance Top-up */}
              {pendingCoins > 0 && (
                <div className="col-span-2 sm:col-span-1 flex items-center gap-2.5 sm:gap-3 bg-blue-500/10 border border-blue-500/20 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl">
                  <Clock className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-blue-500 shrink-0 animate-spin" />
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] font-extrabold text-blue-600 uppercase tracking-wider truncate">
                      Pending Top-up
                    </p>
                    <p className="text-base sm:text-lg font-black text-blue-600 tracking-tight">
                      +{pendingCoins} Coins
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="col-span-2 sm:col-span-1 flex items-center">
                <button
                  onClick={() => router.push("/packages")}
                  className="w-full sm:w-auto inline-flex h-10 sm:h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Buy Plan</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pending Coin Notification Banner */}
          {pendingCoins > 0 && (
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-600 shrink-0 mt-0.5 sm:mt-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-blue-700 dark:text-blue-400">
                    Bank Top-up Slip Under Admin Verification
                  </h4>
                  <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-300">
                    You have <span className="font-bold">{pendingCoins} coins</span> waiting for slip approval. Once verified, coins will be added to your available balance.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  fetchMySlips();
                  fetchMe();
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:underline shrink-0 self-end sm:self-center"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Check Status
              </button>
            </div>
          )}

          {/* Upload Document Scan Panel */}
          <div id="scan-document-panel" className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                  <FileCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                  <span>Submit New Document</span>
                </h2>
                <p className="text-xs text-muted-foreground font-semibold mt-1">
                  Upload your document for review. Submitting places 1 coin on Hold.
                </p>
              </div>

              {/* 1 Coin Hold Rule & Available Coins Banner */}
              {/* <div className="flex items-center gap-2.5 sm:gap-3 bg-primary/10 border border-primary/25 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-extrabold text-foreground shrink-0 self-start sm:self-auto">
                <div className="flex items-center gap-1.5 text-primary">
                  <Coins className="h-4 w-4 shrink-0" />
                  <span className="hidden xs:inline">1 Coin Hold Rule:</span>
                </div>
                <div className="bg-primary text-primary-foreground px-2.5 py-0.5 rounded-lg text-xs font-black">
                  Available: {userData.credits || 0} Coins
                </div>
              </div> */}
            </div>

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
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Upload drag & drop zone */}
                <div className="md:col-span-7">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 sm:p-6 text-center cursor-pointer transition-all duration-200 ${isDragging
                      ? "border-primary bg-primary/5 scale-[1.01]"
                      : "border-border hover:border-primary/40 bg-background hover:bg-muted/10"
                      }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.docx,.doc,.zip,.png,.jpg,.jpeg"
                      className="hidden"
                    />

                    {scanFile ? (
                      <div className="space-y-3 py-3 w-full">
                        <div className="flex items-center justify-between bg-card border border-border/80 p-3 sm:p-4 rounded-xl shadow-sm text-left">
                          <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden min-w-0">
                            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <FileText className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-extrabold text-foreground truncate">
                                {scanFile}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-semibold">
                                1 Coin Hold rule applied
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setScanFile(null);
                            }}
                            className="text-xs text-red-500 font-bold hover:underline shrink-0 ml-2"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5 py-4 sm:py-6">
                        <Upload className="h-7 w-7 sm:h-8 sm:w-8 text-primary mx-auto" />
                        <div>
                          <p className="text-xs sm:text-sm font-extrabold text-foreground">
                            Click to upload document (PDF, DOCX, ZIP, images)
                          </p>
                          <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-0.5">
                            or drag & drop file here
                          </p>
                        </div>
                        <span className="inline-block text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase bg-muted px-2.5 py-1 rounded-lg border border-border/60">
                          PDF, DOCX, ZIP, Images up to 50MB
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scan Policy Summary & CTA */}
                <div className="md:col-span-5 space-y-4 text-left">
                  <div className="p-4 bg-muted/30 border border-border/80 rounded-2xl space-y-2.5 text-xs font-semibold text-muted-foreground leading-relaxed">
                    <p className="flex items-center gap-1.5 text-foreground font-extrabold text-xs">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      Scan Policy Summary:
                    </p>
                    <p className="text-xs">• Deducts exactly <strong className="text-foreground">{"1 coin / credit"}</strong>.</p>
                    <p className="text-xs">• Strict No-Repository analysis activated.</p>
                    <p className="text-xs">• Data auto-delete executes in exactly 24 hours.</p>
                  </div>

                  <button
                    onClick={startScan}
                    disabled={!scanFile}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#fe9a00] to-[#ff7700] py-3.5 text-sm font-extrabold text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 disabled:opacity-40 disabled:pointer-events-none transition-all duration-300 hover:scale-[1.01] cursor-pointer"
                  >
                    <FileCheck className="h-4.5 w-4.5" />
                    <span>Analyze Document</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Customer Assignments Table / Section */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <BookOpen className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-amber-500 shrink-0" />
                <span>Scan Turnitin Document</span>
              </h2>
              <div className="flex items-center gap-2">
                {/* <button
                  onClick={() => setIsAssignmentModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 text-xs font-extrabold text-amber-600 hover:bg-amber-500/25 transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Document</span>
                </button> */}
                <button
                  onClick={() => {
                    fetchMyAssignments();
                    fetchMe();
                  }}
                  className="text-xs font-extrabold text-primary hover:underline flex items-center gap-1 p-1"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {myAssignments.length === 0 ? (
              <div className="text-center py-8 sm:py-10 px-4 space-y-3 border border-dashed border-border rounded-2xl bg-muted/5">
                <BookOpen className="h-8 w-8 text-muted-foreground/60 mx-auto" />
                <div>
                  <p className="text-sm font-bold text-foreground">No documents submitted yet</p>
                  <p className="text-xs text-muted-foreground font-semibold max-w-sm mx-auto mt-1">
                    Upload your document. 1 coin is placed on hold until admin approves the submission.
                  </p>
                </div>
                <button
                  onClick={() => setIsAssignmentModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-black hover:bg-amber-400 cursor-pointer shadow-md"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Upload First Document
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="border-b border-border/80 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                      <th className="py-3 text-left font-bold">Document Title</th>
                      <th className="py-3 text-center font-bold">Document File</th>
                      <th className="py-3 text-center font-bold">Status</th>
                      <th className="py-3 text-center font-bold">Turnitin Document / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-semibold text-muted-foreground">
                    {myAssignments.map((assn, i) => (
                      <tr key={assn._id || assn.id || i} className="hover:bg-muted/10 transition-colors">
                        {/* 1. Document Title */}
                        <td className="py-3.5 text-left text-foreground font-bold max-w-xs truncate">
                          <div>
                            <p className="truncate text-xs font-extrabold">{assn.title || assn.attachmentName}</p>
                            <p className="text-[10px] text-muted-foreground font-semibold">
                              Submitted: {assn.createdAt ? new Date(assn.createdAt).toLocaleDateString("en-LK") : "N/A"}
                            </p>
                          </div>
                        </td>

                        {/* 2. Document File */}
                        <td className="py-3.5 text-center">
                          {assn.attachment || assn.attachmentName ? (
                            <a
                              href={assn.attachment || "#"}
                              download={assn.attachmentName || assn.title || "Uploaded_Document"}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-bold text-foreground hover:bg-secondary transition-colors cursor-pointer"
                            >
                              <Paperclip className="h-3.5 w-3.5 text-primary" />
                              <span className="truncate max-w-[120px]">{assn.attachmentName || assn.title || "View File"}</span>
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No File</span>
                          )}
                        </td>

                        {/* 3. Status */}
                        <td className="py-3.5 text-center">
                          {assn.status === "rejected" ? (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[10px] font-black text-red-600 border border-red-500/20"
                              title={assn.adminNote || "1 coin refunded"}
                            >
                              <XCircle className="h-3 w-3" />
                              Rejected (1 Coin Refunded)
                            </span>
                          ) : assn.status === "cancelled" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/15 px-2.5 py-0.5 text-[10px] font-black text-gray-400 border border-gray-500/20">
                              <XCircle className="h-3 w-3" />
                              Cancelled (1 Coin Returned)
                            </span>
                          ) : assn.status === "approved" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-0.5 text-[10px] font-black text-green-600 border border-green-500/20">
                              <CheckCircle className="h-3 w-3" />
                              Completed Scan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-black text-amber-600 border border-amber-500/20">
                              <Clock className="h-3 w-3" />
                              1 Coin On Hold
                            </span>
                          )}
                        </td>

                        {/* 4. Action / Turnitin Document */}
                        <td className="py-3.5 text-center">
                          {assn.status === "approved" ? (
                            <div className="flex flex-col items-center gap-1">
                              <a
                                href={assn.resultFile || assn.attachment}
                                download={assn.resultFileName || `${assn.title}_Turnitin_Report.pdf`}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#fe9a00] px-3 py-1.5 text-xs font-black text-black hover:bg-[#e08800] shadow-md shadow-[#fe9a00]/20 cursor-pointer"
                              >
                                <Download className="h-3.5 w-3.5" />
                                Download Report 📥
                              </a>
                              {assn.similarityScore !== undefined && assn.similarityScore !== null && (
                                <span className="text-[10px] font-extrabold text-[#fe9a00]">
                                  Similarity: {assn.similarityScore}% {assn.aiScore !== undefined && assn.aiScore !== null ? `| AI: ${assn.aiScore}%` : ""}
                                </span>
                              )}
                            </div>
                          ) : assn.status === "cancelled" || assn.status === "rejected" ? (
                            <span className="text-xs text-muted-foreground italic">N/A</span>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleCancelDocument(assn._id || assn.id || "")}
                                className="inline-flex items-center gap-1 rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-1.5 text-xs font-extrabold text-red-500 hover:bg-red-500/20 transition-all cursor-pointer"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Cancel Case
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment Slips History Section */}
          {mySlips.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight flex items-center gap-2">
                  <Building2 className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-primary shrink-0" />
                  <span>Bank Slip Top-up Requests</span>
                </h2>
                <button
                  onClick={() => {
                    fetchMySlips();
                    fetchMe();
                  }}
                  className="text-xs font-extrabold text-primary hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>

              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="w-full text-sm min-w-[540px]">
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
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-black text-blue-600 border border-blue-500/20">
                              <Clock className="h-3 w-3" />
                              Pending Approval
                            </span>
                          )}
                          {slip.status === "approved" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-0.5 text-[10px] font-black text-green-600 border border-green-500/20">
                              <CheckCircle className="h-3 w-3" />
                              Approved
                            </span>
                          )}
                          {slip.status === "rejected" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[10px] font-black text-red-600 border border-red-500/20" title={slip.adminNote}>
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
        </div>
      </main>

      {/* ─── Submit Assignment Modal ────────────────────────────────────────── */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3.5 sm:p-6 text-left overflow-y-auto">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-5 sm:p-8 space-y-5 relative shadow-2xl animate-in scale-in duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsAssignmentModalOpen(false);
                resetAssignmentForm();
              }}
              className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-amber-500" />
                Submit New Document
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">
                Upload your document for review. Submitting places <strong>1 coin on Hold</strong>.
              </p>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-600" />
                <span className="font-extrabold text-amber-700 dark:text-amber-400">1 Coin Hold Rule:</span>
              </div>
              <span className="font-bold text-amber-700 dark:text-amber-300">Available: {userData.credits} Coins</span>
            </div>

            {assignError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-500 rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {assignError}
              </div>
            )}

            <form onSubmit={handleAssignmentSubmit} className="space-y-4">
              {/* Document Title */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-foreground">
                  Document Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms Essay"
                  className="w-full text-xs font-semibold text-foreground bg-background border border-border rounded-xl px-3 py-2.5 focus:border-primary focus:outline-none"
                />
              </div>

              {/* Document Uploader */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-foreground">
                  Document Uploader <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => assignFileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-primary/40 rounded-xl p-4 text-center cursor-pointer bg-background transition-all"
                >
                  <input
                    type="file"
                    ref={assignFileInputRef}
                    onChange={handleAssignFileChange}
                    accept=".pdf,.docx,.doc,.zip,.png,.jpg"
                    className="hidden"
                  />
                  {assignAttachmentName ? (
                    <p className="text-xs font-bold text-primary truncate">
                      📎 {assignAttachmentName}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground font-semibold flex items-center justify-center gap-1.5">
                      <Paperclip className="h-4 w-4" /> Click to upload document (PDF, DOCX, ZIP, images)
                    </p>
                  )}
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-extrabold text-black hover:bg-amber-400 shadow-md shadow-amber-500/20 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                >
                  {assignLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Submitting Document...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Document (Hold 1 Coin)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Assignment Details Modal ────────────────────────────────────────── */}
      {activeAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3.5 sm:p-6 text-left overflow-y-auto">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-5 sm:p-8 space-y-5 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveAssignmentModal(null)}
              className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-black text-amber-600">
                <BookOpen className="h-3 w-3" /> Document Details
              </span>
              <h3 className="text-base font-black text-foreground tracking-tight">
                {activeAssignmentModal.title}
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Deadline</p>
                <p className="font-extrabold text-foreground">
                  {activeAssignmentModal.deadline ? new Date(activeAssignmentModal.deadline).toLocaleString("en-LK", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }) : "N/A"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Description</p>
                <p className="font-semibold text-foreground whitespace-pre-wrap leading-relaxed">
                  {activeAssignmentModal.description}
                </p>
              </div>

              {activeAssignmentModal.requirements && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Requirements / Scope</p>
                  <p className="font-semibold text-foreground whitespace-pre-wrap leading-relaxed">
                    {activeAssignmentModal.requirements}
                  </p>
                </div>
              )}

              {activeAssignmentModal.deliverables && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Deliverables</p>
                  <p className="font-semibold text-foreground">
                    {activeAssignmentModal.deliverables}
                  </p>
                </div>
              )}

              {activeAssignmentModal.status === "approved" && (
                <div className="p-4 bg-[#fe9a00]/10 border border-[#fe9a00]/20 rounded-2xl space-y-2">
                  <p className="text-xs font-extrabold text-[#fe9a00] flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4" /> Turnitin Check Completed!
                  </p>
                  <p className="text-[11px] text-muted-foreground font-semibold">
                    Admin has processed your document in No-Repository mode and uploaded your checked Turnitin report.
                  </p>
                  {activeAssignmentModal.similarityScore !== undefined && activeAssignmentModal.similarityScore !== null && (
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold pt-1">
                      <span className="px-2.5 py-1 rounded-lg bg-[#fe9a00]/20 text-[#fe9a00]">
                        Similarity: {activeAssignmentModal.similarityScore}%
                      </span>
                      {activeAssignmentModal.aiScore !== undefined && activeAssignmentModal.aiScore !== null && (
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-700 dark:text-blue-300">
                          AI: {activeAssignmentModal.aiScore}%
                        </span>
                      )}
                    </div>
                  )}
                  <div className="pt-2">
                    <a
                      href={activeAssignmentModal.resultFile || activeAssignmentModal.attachment}
                      download={activeAssignmentModal.resultFileName || `${activeAssignmentModal.title}_Turnitin_Report.pdf`}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#fe9a00] px-4 py-2 text-xs font-black text-black hover:bg-[#e08800] shadow-md shadow-[#fe9a00]/20 cursor-pointer"
                    >
                      <Paperclip className="h-4 w-4" />
                      Download Checked Turnitin Report 📥
                    </a>
                  </div>
                </div>
              )}

              {activeAssignmentModal.adminNote && (
                <div className="p-3 bg-muted/40 border border-border rounded-xl text-foreground font-semibold text-xs">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Admin Note</p>
                  <p className="mt-0.5">{activeAssignmentModal.adminNote}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveAssignmentModal(null)}
                className="w-full sm:w-auto rounded-xl border border-border px-5 py-2.5 text-xs font-bold text-foreground hover:bg-secondary cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal (Buy Plan) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3.5 sm:p-6 text-left overflow-y-auto">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-5 sm:p-8 space-y-6 relative shadow-2xl animate-in scale-in duration-200 max-h-[90vh] overflow-y-auto">
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

            <div className="space-y-1">
              <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                Buy Coins / Plan Checkout
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">
                Select your preferred payment method to complete the package purchase.
              </p>
            </div>

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

            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setPaymentTab("card")}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${paymentTab === "card"
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
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${paymentTab === "bank"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                Bank Transfer & Slip
              </button>
            </div>

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
              </div>
            )}

            {paymentTab === "bank" && (
              <form onSubmit={handleBankSlipSubmit} className="space-y-4 text-xs font-semibold">
                {checkoutError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                {/* Bank Details Card */}
                <div className="p-4 bg-muted/40 border border-border rounded-2xl space-y-2.5">
                  <p className="font-extrabold text-foreground text-xs flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-primary" />
                    Commercial Bank of Ceylon
                  </p>
                  <div className="space-y-1 text-muted-foreground text-[11px]">
                    <p>Account Name: <strong className="text-foreground">TurniPass Lanka (Pvt) Ltd</strong></p>
                    <p>Account Number: <strong className="text-foreground font-mono text-xs">8012 3456 7890</strong></p>
                    <p>Branch: <strong className="text-foreground">Kollupitiya Branch (Code: 045)</strong></p>
                    <p>Reference: <strong className="text-primary font-mono">{userData.email.split("@")[0]}</strong></p>
                  </div>
                </div>

                {/* File Upload for Bank Slip */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">
                    Upload Bank Transfer Receipt / Slip <span className="text-red-500">*</span>
                  </label>
                  <div
                    onClick={() => slipInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-4 text-center cursor-pointer bg-background hover:bg-muted/10 transition-colors"
                  >
                    <input
                      type="file"
                      ref={slipInputRef}
                      onChange={handleSlipFileChange}
                      accept="image/*,.pdf"
                      className="hidden"
                    />
                    {slipPreview ? (
                      <div className="space-y-2">
                        <img
                          src={slipPreview}
                          alt="Slip Preview"
                          className="max-h-36 mx-auto rounded-lg object-contain border border-border"
                        />
                        <p className="text-[11px] text-green-600 font-bold flex items-center justify-center gap-1">
                          <Check className="h-3.5 w-3.5" />
                          Slip Selected: {slipFile?.name}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            slipInputRef.current?.click();
                          }}
                          className="text-[11px] text-primary underline"
                        >
                          Change Slip Image
                        </button>
                      </div>
                    ) : (
                      <div className="py-4 space-y-2">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-xs font-bold">Click to upload transfer receipt</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={paymentLoading || !slipPreview}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/20 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3.5 sm:p-4">
          <div className="relative max-w-2xl w-full bg-card border border-border rounded-3xl p-4 sm:p-6 space-y-4 text-center max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewSlipUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h4 className="text-sm font-black text-foreground">Uploaded Slip / Attachment Document</h4>
            <div className="max-h-[65vh] overflow-auto rounded-xl border border-border bg-black/20 p-2">
              <img src={viewSlipUrl} alt="Slip / Attachment" className="max-w-full h-auto mx-auto rounded-lg" />
            </div>
            <button
              onClick={() => setViewSlipUrl(null)}
              className="w-full sm:w-auto rounded-xl border border-border px-5 py-2.5 text-xs font-bold hover:bg-secondary cursor-pointer"
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
