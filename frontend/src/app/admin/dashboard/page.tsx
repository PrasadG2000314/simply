"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  LogOut,
  RefreshCw,
  Search,
  Activity,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X,
  Coins,
  Check,
  AlertCircle,
  BookOpen,
  Lock,
  Paperclip,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

interface UserRecord {
  id: string;
  username?: string;
  fullName: string;
  email: string;
  credits: number;
  holdCredits?: number;
  createdAt: string;
  hasActiveToken: boolean;
}

interface PaymentSlipRecord {
  _id?: string;
  id?: string;
  userId?: string;
  userName: string;
  userEmail: string;
  packageName: string;
  credits: number;
  amount: number;
  slipImage: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  createdAt: string;
}

interface AssignmentRecord {
  _id?: string;
  id?: string;
  userId?: string;
  userName: string;
  userEmail: string;
  title: string;
  description: string;
  requirements?: string;
  deliverables?: string;
  deadline: string;
  attachment?: string;
  attachmentName?: string;
  resultFile?: string;
  resultFileName?: string;
  similarityScore?: number;
  aiScore?: number;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  newToday: number;
  newThisWeek: number;
  pendingSlips: number;
  pendingAssignments: number;
}

function AdminDashboardContent() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [slips, setSlips] = useState<PaymentSlipRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"assignments" | "slips" | "users">("assignments");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [search, setSearch] = useState("");
  const [adminUser] = useState<{ username: string } | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("adminUser");
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  const [error, setError] = useState("");

  // Modals state
  const [activeSlipModal, setActiveSlipModal] = useState<PaymentSlipRecord | null>(null);
  const [activeAssignmentModal, setActiveAssignmentModal] = useState<AssignmentRecord | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectTargetType, setRejectTargetType] = useState<"slip" | "assignment" | null>(null);
  const [targetRejectSlip, setTargetRejectSlip] = useState<PaymentSlipRecord | null>(null);
  const [targetRejectAssignment, setTargetRejectAssignment] = useState<AssignmentRecord | null>(null);

  // Approve Document & Upload Turnitin Report Modal State
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [targetApproveDocument, setTargetApproveDocument] = useState<AssignmentRecord | null>(null);
  const [approveResultFile, setApproveResultFile] = useState<string | null>(null);
  const [approveResultFileName, setApproveResultFileName] = useState("");
  const [approveSimilarityScore, setApproveSimilarityScore] = useState("");
  const [approveAiScore, setApproveAiScore] = useState("");
  const [approveAdminNote, setApproveAdminNote] = useState("");
  const resultFileInputRef = useRef<HTMLInputElement>(null);

  // ─── Theme-Styled Confirmation & Alert Dialog Popup State ──────────────────
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "primary" | "success" | "danger" | "warning";
    isAlertOnly?: boolean;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  const showConfirm = ({
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "primary",
    onConfirm,
  }: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "primary" | "success" | "danger" | "warning";
    onConfirm: () => void;
  }) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      variant,
      isAlertOnly: false,
      onConfirm,
    });
  };

  const showAlert = ({
    title,
    message,
    variant = "primary",
  }: {
    title: string;
    message: string;
    variant?: "primary" | "success" | "danger" | "warning";
  }) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText: "OK",
      variant,
      isAlertOnly: true,
    });
  };

  const getToken = () => localStorage.getItem("adminToken");

  const fetchData = async (isRefresh = false) => {
    const token = getToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [usersRes, statsRes, slipsRes, assnsRes] = await Promise.all([
        fetch(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/admin/slips`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/admin/documents`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (
        usersRes.status === 401 ||
        statsRes.status === 401 ||
        slipsRes.status === 401 ||
        assnsRes.status === 401
      ) {
        localStorage.removeItem("adminToken");
        router.push("/admin/login");
        return;
      }

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();
      const slipsData = await slipsRes.json();
      const assnsData = await assnsRes.json();

      let fetchedSlips: PaymentSlipRecord[] = [];
      if (slipsData.success) fetchedSlips = slipsData.slips;

      // Merge local storage slips
      const localSlips: PaymentSlipRecord[] = JSON.parse(localStorage.getItem("paymentSlips") || "[]");
      const combinedSlips = [...fetchedSlips];
      localSlips.forEach((ls) => {
        const id = ls._id || ls.id;
        if (!combinedSlips.some((s) => (s._id || s.id) === id)) {
          combinedSlips.push(ls);
        }
      });

      let fetchedAssns: AssignmentRecord[] = [];
      if (assnsData.success) fetchedAssns = assnsData.assignments;

      // Merge local storage assignments
      const localAssns: AssignmentRecord[] = JSON.parse(localStorage.getItem("myAssignments") || "[]");
      const combinedAssns = [...fetchedAssns];
      localAssns.forEach((la) => {
        const id = la._id || la.id;
        if (!combinedAssns.some((a) => (a._id || a.id) === id)) {
          combinedAssns.push(la);
        }
      });

      if (usersData.success) setUsers(usersData.users);
      setSlips(combinedSlips);
      setAssignments(combinedAssns);

      const pendingSlipsCount = combinedSlips.filter((s) => s.status === "pending").length;
      const pendingAssnsCount = combinedAssns.filter((a) => a.status === "pending").length;

      if (statsData.success) {
        setStats({
          ...statsData.stats,
          pendingSlips: pendingSlipsCount,
          pendingAssignments: pendingAssnsCount,
        });
      }
    } catch {
      setError("Failed to fetch admin data. Please check your network connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    router.push("/admin/login");
  };

  // ─── Approve Payment Slip Handler ───────────────────────────────────────────
  const handleApproveSlip = (slip: PaymentSlipRecord) => {
    showConfirm({
      title: "Approve payment slip?",
      message: `This will credit ${slip.credits} coins to ${slip.userName || slip.userEmail}.`,
      confirmText: "Approve & Credit",
      cancelText: "Cancel",
      variant: "success",
      onConfirm: async () => {
        const token = getToken();
        const targetId = slip._id || slip.id;

        if (targetId) setActionLoadingId(targetId);

        // Sync local storage state
        const localSlips: PaymentSlipRecord[] = JSON.parse(localStorage.getItem("paymentSlips") || "[]");
        const updatedLocalSlips = localSlips.map((s) => {
          if ((s._id || s.id) === targetId) {
            return { ...s, status: "approved" as const };
          }
          return s;
        });
        localStorage.setItem("paymentSlips", JSON.stringify(updatedLocalSlips));

        if (slip.userEmail) {
          const allUsers = JSON.parse(localStorage.getItem("registeredUsers") || "{}");
          if (allUsers[slip.userEmail]) {
            allUsers[slip.userEmail].credits = (allUsers[slip.userEmail].credits || 0) + slip.credits;
            localStorage.setItem("registeredUsers", JSON.stringify(allUsers));
          }
        }

        if (token && slip._id) {
          try {
            const res = await fetch(`${API_URL}/admin/slips/${slip._id}/approve`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });
            await res.json();
          } catch (err) {
            console.error("API approve slip error:", err);
          }
        }

        showAlert({
          title: "Payment Slip Approved!",
          message: `${slip.credits} coins credited to ${slip.userName || slip.userEmail}.`,
          variant: "success",
        });

        if (activeSlipModal && (activeSlipModal._id === targetId || activeSlipModal.id === targetId)) {
          setActiveSlipModal(null);
        }
        setActionLoadingId(null);
        fetchData(true);
      },
    });
  };

  // ─── Approve Assignment Handler (Consumes 1 Held Coin) ──────────────────────
  const handleOpenApproveModal = (assn: AssignmentRecord) => {
    setTargetApproveDocument(assn);
    setApproveResultFile(assn.resultFile || null);
    setApproveResultFileName(assn.resultFileName || "");
    setApproveSimilarityScore(assn.similarityScore !== undefined && assn.similarityScore !== null ? String(assn.similarityScore) : "");
    setApproveAiScore(assn.aiScore !== undefined && assn.aiScore !== null ? String(assn.aiScore) : "");
    setApproveAdminNote(assn.adminNote || "");
    setIsApproveModalOpen(true);
  };

  const handleApproveFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setApproveResultFileName(file.name);

      const reader = new FileReader();
      reader.onloadend = () => {
        setApproveResultFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmApproveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetApproveDocument) return;

    if (!approveResultFile && !approveResultFileName) {
      showAlert({
        title: "Turnitin Report Required",
        message: "Please select and upload the checked Turnitin result document.",
        variant: "warning",
      });
      return;
    }

    const token = getToken();
    const targetId = targetApproveDocument._id || targetApproveDocument.id;
    if (targetId) setActionLoadingId(targetId);

    // Sync local storage state
    const localAssns: AssignmentRecord[] = JSON.parse(
      localStorage.getItem("myDocuments") || localStorage.getItem("myAssignments") || "[]"
    );
    const updatedLocalAssns = localAssns.map((a) => {
      if ((a._id || a.id) === targetId) {
        return {
          ...a,
          status: "approved" as const,
          resultFile: approveResultFile || a.resultFile || "",
          resultFileName: approveResultFileName || a.resultFileName || "Turnitin_Checked_Report.pdf",
          similarityScore: approveSimilarityScore ? Number(approveSimilarityScore) : a.similarityScore,
          aiScore: approveAiScore ? Number(approveAiScore) : a.aiScore,
          adminNote: approveAdminNote || a.adminNote,
        };
      }
      return a;
    });
    localStorage.setItem("myDocuments", JSON.stringify(updatedLocalAssns));
    localStorage.setItem("myAssignments", JSON.stringify(updatedLocalAssns));

    // Decrement holdCredits in registeredUsers
    if (targetApproveDocument.userEmail) {
      const allUsers = JSON.parse(localStorage.getItem("registeredUsers") || "{}");
      if (allUsers[targetApproveDocument.userEmail]) {
        const curHold = allUsers[targetApproveDocument.userEmail].holdCredits || 0;
        allUsers[targetApproveDocument.userEmail].holdCredits = Math.max(0, curHold - 1);
        localStorage.setItem("registeredUsers", JSON.stringify(allUsers));
      }
    }

    if (token && targetApproveDocument._id) {
      try {
        await fetch(`${API_URL}/admin/documents/${targetApproveDocument._id}/approve`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            resultFile: approveResultFile,
            resultFileName: approveResultFileName,
            similarityScore: approveSimilarityScore,
            aiScore: approveAiScore,
            adminNote: approveAdminNote,
          }),
        });
      } catch (err) {
        console.error("API approve document error:", err);
      }
    }

    showAlert({
      title: "Document Approved!",
      message: `Document approved & Turnitin report uploaded for ${targetApproveDocument.userName}!`,
      variant: "success",
    });
    setIsApproveModalOpen(false);
    setTargetApproveDocument(null);
    if (activeAssignmentModal && (activeAssignmentModal._id === targetId || activeAssignmentModal.id === targetId)) {
      setActiveAssignmentModal(null);
    }
    setActionLoadingId(null);
    fetchData(true);
  };

  // ─── Reject Modals Setup ───────────────────────────────────────────────────
  const handleOpenRejectSlipModal = (slip: PaymentSlipRecord) => {
    setTargetRejectSlip(slip);
    setRejectTargetType("slip");
    setRejectNote("");
    setIsRejectModalOpen(true);
  };

  const handleOpenRejectAssignmentModal = (assn: AssignmentRecord) => {
    setTargetRejectAssignment(assn);
    setRejectTargetType("assignment");
    setRejectNote("");
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    const token = getToken();

    if (rejectTargetType === "slip" && targetRejectSlip) {
      const targetId = targetRejectSlip._id || targetRejectSlip.id;
      if (targetId) setActionLoadingId(targetId);

      const localSlips: PaymentSlipRecord[] = JSON.parse(localStorage.getItem("paymentSlips") || "[]");
      const updatedLocalSlips = localSlips.map((s) => {
        if ((s._id || s.id) === targetId) {
          return { ...s, status: "rejected" as const, adminNote: rejectNote };
        }
        return s;
      });
      localStorage.setItem("paymentSlips", JSON.stringify(updatedLocalSlips));

      if (token && targetRejectSlip._id) {
        try {
          const res = await fetch(`${API_URL}/admin/slips/${targetRejectSlip._id}/reject`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ adminNote: rejectNote }),
          });
          await res.json();
        } catch (err) {
          console.error("API reject slip error:", err);
        }
      }

      showAlert({
        title: "Payment Slip Rejected",
        message: "Payment slip has been marked as rejected.",
        variant: "danger",
      });
      setIsRejectModalOpen(false);
      setTargetRejectSlip(null);
      if (activeSlipModal && (activeSlipModal._id === targetId || activeSlipModal.id === targetId)) {
        setActiveSlipModal(null);
      }
    } else if (rejectTargetType === "assignment" && targetRejectAssignment) {
      const targetId = targetRejectAssignment._id || targetRejectAssignment.id;
      if (targetId) setActionLoadingId(targetId);

      const localAssns: AssignmentRecord[] = JSON.parse(localStorage.getItem("myAssignments") || "[]");
      const updatedLocalAssns = localAssns.map((a) => {
        if ((a._id || a.id) === targetId) {
          return { ...a, status: "rejected" as const, adminNote: rejectNote };
        }
        return a;
      });
      localStorage.setItem("myAssignments", JSON.stringify(updatedLocalAssns));

      // Refund 1 coin to customer available balance (holdCredits - 1, credits + 1)
      if (targetRejectAssignment.userEmail) {
        const allUsers = JSON.parse(localStorage.getItem("registeredUsers") || "{}");
        if (allUsers[targetRejectAssignment.userEmail]) {
          const curCredits = allUsers[targetRejectAssignment.userEmail].credits || 0;
          const curHold = allUsers[targetRejectAssignment.userEmail].holdCredits || 0;
          allUsers[targetRejectAssignment.userEmail].credits = curCredits + 1;
          allUsers[targetRejectAssignment.userEmail].holdCredits = Math.max(0, curHold - 1);
          localStorage.setItem("registeredUsers", JSON.stringify(allUsers));
        }
      }

      if (token && targetRejectAssignment._id) {
        try {
          const res = await fetch(`${API_URL}/admin/documents/${targetRejectAssignment._id}/reject`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ adminNote: rejectNote }),
          });
          await res.json();
        } catch (err) {
          console.error("API reject assignment error:", err);
        }
      }

      showAlert({
        title: "Assignment Rejected",
        message: `Assignment rejected. 1 coin refunded to ${targetRejectAssignment.userName}'s available balance.`,
        variant: "danger",
      });
      setIsRejectModalOpen(false);
      setTargetRejectAssignment(null);
      if (activeAssignmentModal && (activeAssignmentModal._id === targetId || activeAssignmentModal.id === targetId)) {
        setActiveAssignmentModal(null);
      }
    }

    setActionLoadingId(null);
    fetchData(true);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSlips = slips.filter((s) => {
    const matchStatus = statusFilter === "all" ? true : s.status === statusFilter;
    const matchSearch =
      s.userName.toLowerCase().includes(search.toLowerCase()) ||
      s.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      s.packageName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const filteredAssignments = assignments.filter((a) => {
    const matchStatus = statusFilter === "all" ? true : a.status === statusFilter;
    const matchSearch =
      a.userName.toLowerCase().includes(search.toLowerCase()) ||
      a.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingSlipsCount = slips.filter((s) => s.status === "pending").length;
  const pendingAssnsCount = assignments.filter((a) => a.status === "pending").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="text-xs text-zinc-500 font-semibold">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Topbar */}
      <header className="border-b border-zinc-800 bg-zinc-900 px-3.5 sm:px-6 py-3.5 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link href="/" className="group shrink-0">
              <img
                src="/logo-white.png"
                alt="TurniPass Logo"
                className="h-7 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-black text-white tracking-tight truncate">
                Simply Admin Panel
              </p>
              <p className="text-[10px] text-zinc-500 font-semibold truncate hidden sm:block">
                Control Center · {adminUser?.username}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              id="admin-refresh"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-zinc-300 hover:bg-zinc-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              id="admin-logout"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-8">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-400">
            {error}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div
            onClick={() => {
              setActiveTab("assignments");
              setStatusFilter("pending");
            }}
            className={`rounded-2xl border p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4 cursor-pointer transition-all ${
              pendingAssnsCount > 0
                ? "border-amber-500/40 bg-amber-500/10 shadow-lg shadow-amber-500/5 hover:border-amber-500/60"
                : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
            }`}
          >
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-extrabold text-amber-500 uppercase tracking-widest truncate">
                Pending Docs
              </p>
              <p className="text-lg sm:text-2xl font-black text-amber-400">{pendingAssnsCount}</p>
            </div>
          </div>

          <div
            onClick={() => {
              setActiveTab("slips");
              setStatusFilter("pending");
            }}
            className={`rounded-2xl border p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4 cursor-pointer transition-all ${
              pendingSlipsCount > 0
                ? "border-blue-500/40 bg-blue-500/10 shadow-lg shadow-blue-500/5 hover:border-blue-500/60"
                : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
            }`}
          >
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-extrabold text-blue-400 uppercase tracking-widest truncate">
                Pending Slips
              </p>
              <p className="text-lg sm:text-2xl font-black text-blue-400">{pendingSlipsCount}</p>
            </div>
          </div>

          <div
            onClick={() => setActiveTab("users")}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4 cursor-pointer hover:border-zinc-700 transition-all"
          >
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest truncate">
                Customers
              </p>
              <p className="text-lg sm:text-2xl font-black text-white">{stats?.totalUsers ?? users.length}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4">
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest truncate">
                This Week
              </p>
              <p className="text-lg sm:text-2xl font-black text-white">{stats?.newThisWeek ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full -mx-1 px-1 scrollbar-none">
            <button
              onClick={() => setActiveTab("assignments")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                activeTab === "assignments"
                  ? "bg-amber-500 text-black shadow-md"
                  : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Document Queue</span>
              {pendingAssnsCount > 0 && (
                <span className="rounded-full bg-black px-1.5 py-0.2 text-[10px] font-black text-amber-400">
                  {pendingAssnsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("slips")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                activeTab === "slips"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Bank Slips</span>
              {pendingSlipsCount > 0 && (
                <span className="rounded-full bg-blue-500 px-1.5 py-0.2 text-[10px] font-black text-black">
                  {pendingSlipsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                activeTab === "users"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Users</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              id="admin-search"
              type="text"
              placeholder="Search customer, title, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-9 pr-4 py-2 text-xs text-white font-semibold placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        {/* ─── TAB 1: Assignment Queue ─────────────────────────────────────────── */}
        {activeTab === "assignments" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
                {(["pending", "approved", "rejected", "all"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold capitalize transition-all cursor-pointer shrink-0 ${
                      statusFilter === st
                        ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {st === "all" ? "All Documents" : st}
                  </button>
                ))}
              </div>
              <span className="text-[11px] sm:text-xs text-zinc-500 font-semibold self-end sm:self-auto">
                Showing {filteredAssignments.length} documents
              </span>
            </div>

            {filteredAssignments.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 py-16 text-center">
                <BookOpen className="h-9 w-9 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500 font-semibold">
                  No documents found matching this filter.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredAssignments.map((assn) => (
                  <div
                    key={assn._id || assn.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5 space-y-4 hover:border-zinc-700 transition-all shadow-lg"
                  >
                    {/* Header: Customer & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 font-black text-xs border border-amber-500/20">
                          {assn.userName ? assn.userName.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-black text-white truncate">{assn.userName}</p>
                            <span className="text-[11px] text-zinc-400 font-medium truncate">({assn.userEmail})</span>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                            Submitted: {assn.createdAt ? new Date(assn.createdAt).toLocaleDateString("en-LK") : "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {assn.status === "pending" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[10px] font-black text-amber-400">
                            <Lock className="h-3 w-3" /> Pending Check (1 Coin Held)
                          </span>
                        )}
                        {assn.status === "approved" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 border border-green-500/30 px-3 py-1 text-[10px] font-black text-green-400">
                            <CheckCircle className="h-3 w-3" /> Approved & Delivered
                          </span>
                        )}
                        {assn.status === "rejected" && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/30 px-3 py-1 text-[10px] font-black text-red-400"
                            title={assn.adminNote}
                          >
                            <XCircle className="h-3 w-3" /> Rejected (Refunded)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Document Title & File Download */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                      <div>
                        <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest mb-1">Document Title</p>
                        <h4 className="text-xs sm:text-sm font-bold text-white break-words">{assn.title}</h4>
                      </div>

                      <div className="md:text-right">
                        <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest mb-1">Original Customer File</p>
                        {assn.attachment ? (
                          <a
                            href={assn.attachment}
                            download={assn.attachmentName || "Customer_Document"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-extrabold text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer shadow-sm max-w-full"
                          >
                            <Paperclip className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate max-w-[200px] sm:max-w-[240px]">{assn.attachmentName || "Download File"}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-zinc-600 italic">No File Uploaded</span>
                        )}
                      </div>
                    </div>

                    {/* Footer: Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-zinc-800/80">
                      <button
                        onClick={() => setActiveAssignmentModal(assn)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-700 cursor-pointer transition-all w-full sm:w-auto"
                      >
                        <Eye className="h-3.5 w-3.5 text-zinc-400" />
                        View Document Details
                      </button>

                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
                        {assn.status === "approved" && (
                          <button
                            onClick={() => handleOpenApproveModal(assn)}
                            disabled={actionLoadingId === (assn._id || assn.id)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600/20 border border-blue-500/40 px-4 py-2 text-xs font-black text-blue-400 hover:bg-blue-600/30 cursor-pointer disabled:opacity-50 transition-all w-full sm:w-auto"
                          >
                            <Paperclip className="h-3.5 w-3.5 text-blue-400" />
                            {assn.resultFile ? "Update Turnitin Report" : "Upload Turnitin Report"}
                          </button>
                        )}

                        {assn.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleOpenRejectAssignmentModal(assn)}
                              disabled={actionLoadingId === (assn._id || assn.id)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-black text-red-400 hover:bg-red-500/20 cursor-pointer disabled:opacity-50 transition-all w-full sm:w-auto"
                            >
                              <X className="h-3.5 w-3.5" />
                              Reject & Refund
                            </button>
                            <button
                              onClick={() => handleOpenApproveModal(assn)}
                              disabled={actionLoadingId === (assn._id || assn.id)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#fe9a00] px-4 py-2 text-xs font-black text-black hover:bg-[#e08800] cursor-pointer shadow-md disabled:opacity-50 transition-all w-full sm:w-auto"
                            >
                              {actionLoadingId === (assn._id || assn.id) ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              Approve & Upload Report
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: Bank Slip Approvals ─────────────────────────────────────── */}
        {activeTab === "slips" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
                {(["pending", "approved", "rejected", "all"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold capitalize transition-all cursor-pointer shrink-0 ${
                      statusFilter === st
                        ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {st === "all" ? "All Slips" : st}
                  </button>
                ))}
              </div>
              <span className="text-[11px] sm:text-xs text-zinc-500 font-semibold self-end sm:self-auto">
                Showing {filteredSlips.length} payment slips
              </span>
            </div>

            {filteredSlips.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 py-16 text-center">
                <Building2 className="h-9 w-9 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500 font-semibold">
                  No payment slips found matching this filter.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredSlips.map((slip) => (
                  <div
                    key={slip._id || slip.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5 space-y-4 hover:border-zinc-700 transition-all shadow-lg"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 font-black text-xs border border-blue-500/20">
                          {slip.userName ? slip.userName.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-black text-white truncate">{slip.userName}</p>
                            <span className="text-[11px] text-zinc-400 font-medium truncate">({slip.userEmail})</span>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                            Submitted: {formatDate(slip.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {slip.status === "pending" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-3 py-1 text-[10px] font-black text-blue-400">
                            <Clock className="h-3 w-3" /> Pending Verification
                          </span>
                        )}
                        {slip.status === "approved" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 border border-green-500/30 px-3 py-1 text-[10px] font-black text-green-400">
                            <CheckCircle className="h-3 w-3" /> Approved
                          </span>
                        )}
                        {slip.status === "rejected" && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/30 px-3 py-1 text-[10px] font-black text-red-400"
                            title={slip.adminNote}
                          >
                            <XCircle className="h-3 w-3" /> Rejected
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Package & Slip Thumbnail */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-800/40 p-3.5 rounded-xl border border-zinc-800">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white">{slip.packageName}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-primary">LKR {slip.amount.toLocaleString("en-LK")}</span>
                          <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-black text-primary">
                            <Coins className="h-3.5 w-3.5" /> +{slip.credits} Coins
                          </span>
                        </div>
                      </div>

                      <div
                        onClick={() => setActiveSlipModal(slip)}
                        className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 hover:border-primary px-3 py-1.5 rounded-xl cursor-pointer transition-all self-start sm:self-auto"
                      >
                        {slip.slipImage?.startsWith("data:application/pdf") || slip.slipImage?.endsWith(".pdf") ? (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 font-extrabold text-[10px] border border-red-500/20">
                            PDF
                          </div>
                        ) : (
                          <img
                            src={slip.slipImage}
                            alt="Slip thumbnail"
                            className="h-8 w-8 object-cover rounded-lg"
                          />
                        )}
                        <span className="text-xs font-bold text-primary flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" /> View Slip Receipt
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {slip.status === "pending" && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80">
                        <button
                          onClick={() => handleOpenRejectSlipModal(slip)}
                          disabled={actionLoadingId === (slip._id || slip.id)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-black text-red-400 hover:bg-red-500/20 cursor-pointer disabled:opacity-50 transition-all w-full sm:w-auto"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject Slip
                        </button>
                        <button
                          onClick={() => handleApproveSlip(slip)}
                          disabled={actionLoadingId === (slip._id || slip.id)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-xs font-black text-white hover:bg-green-500 cursor-pointer shadow-md disabled:opacity-50 transition-all w-full sm:w-auto"
                        >
                          {actionLoadingId === (slip._id || slip.id) ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Approve & Credit Coins
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: Registered Users ────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h2 className="text-xs sm:text-sm font-black text-white">Registered Customer Accounts</h2>
              </div>
              <span className="rounded-full bg-primary/15 border border-primary/20 px-2.5 py-0.5 text-xs font-black text-primary">
                {filteredUsers.length} Customers
              </span>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 py-16 text-center">
                <Users className="h-9 w-9 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500 font-semibold">
                  No registered users match your search.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5 space-y-3.5 hover:border-zinc-700 transition-all shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-black text-sm border border-primary/20">
                          {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white truncate">@{user.username || user.fullName}</p>
                          <p className="text-[11px] text-zinc-400 font-medium truncate">{user.email}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-600 shrink-0">#{index + 1}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
                      <p className="text-[10px] text-zinc-500 font-semibold">Joined: {formatDate(user.createdAt)}</p>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-xl">
                          <Coins className="h-3 w-3" />
                          {user.credits || 0} Coins
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
                          <Lock className="h-3 w-3" />
                          {user.holdCredits || 0} Hold
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── Assignment Detail Lightbox Modal ───────────────────────────────── */}
      {activeAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3.5 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-5 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveAssignmentModal(null)}
              className="absolute top-4 right-4 p-1.5 sm:p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </button>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-black text-amber-400">
                <BookOpen className="h-3 w-3" /> Document Review Brief
              </span>
              <h3 className="text-base sm:text-lg font-black text-white">{activeAssignmentModal.title}</h3>
              <p className="text-xs text-zinc-400 truncate">
                Customer: <strong className="text-white">{activeAssignmentModal.userName}</strong> ({activeAssignmentModal.userEmail})
              </p>
            </div>

            <div className="space-y-3 text-xs bg-zinc-800/50 p-3.5 sm:p-4 border border-zinc-700/60 rounded-2xl">
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Target Deadline</p>
                <p className="font-extrabold text-amber-400">
                  {new Date(activeAssignmentModal.deadline).toLocaleString("en-LK", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Description</p>
                <p className="font-semibold text-zinc-200 whitespace-pre-wrap leading-relaxed">{activeAssignmentModal.description}</p>
              </div>

              {activeAssignmentModal.requirements && (
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Requirements / Scope</p>
                  <p className="font-semibold text-zinc-200 whitespace-pre-wrap leading-relaxed">{activeAssignmentModal.requirements}</p>
                </div>
              )}

              {activeAssignmentModal.deliverables && (
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Deliverables</p>
                  <p className="font-semibold text-zinc-200">{activeAssignmentModal.deliverables}</p>
                </div>
              )}

              {activeAssignmentModal.attachment && (
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Attached Document</p>
                  <div className="p-2.5 bg-black/40 border border-zinc-700 rounded-xl flex items-center justify-between gap-2">
                    <span className="truncate max-w-[180px] sm:max-w-xs font-mono text-zinc-300">
                      📎 {activeAssignmentModal.attachmentName || "Attached_Document"}
                    </span>
                    <a
                      href={activeAssignmentModal.attachment}
                      download={activeAssignmentModal.attachmentName || "attachment"}
                      className="px-3 py-1 rounded-lg bg-primary text-black font-extrabold hover:bg-primary/90 text-xs shrink-0"
                    >
                      Download
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Actions inside modal */}
            {activeAssignmentModal.status === "approved" && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800">
                <div className="text-xs">
                  {activeAssignmentModal.resultFile ? (
                    <span className="text-green-400 font-bold flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5 shrink-0" /> Report Uploaded ({activeAssignmentModal.resultFileName || "Report.pdf"})
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Pending Report Upload
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    const target = activeAssignmentModal;
                    setActiveAssignmentModal(null);
                    handleOpenApproveModal(target);
                  }}
                  className="w-full sm:w-auto rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-500 cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
                >
                  <Paperclip className="h-4 w-4" />
                  {activeAssignmentModal.resultFile ? "Update Turnitin Report" : "Upload Turnitin Report"}
                </button>
              </div>
            )}

            {activeAssignmentModal.status === "pending" && (
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => handleOpenRejectAssignmentModal(activeAssignmentModal)}
                  className="w-full sm:w-auto rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-black text-red-400 hover:bg-red-500/20 cursor-pointer text-center"
                >
                  Reject & Refund 1 Coin
                </button>
                <button
                  onClick={() => {
                    const target = activeAssignmentModal;
                    setActiveAssignmentModal(null);
                    handleOpenApproveModal(target);
                  }}
                  className="w-full sm:w-auto rounded-xl bg-green-600 px-5 py-2.5 text-xs font-black text-white hover:bg-green-500 cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve & Upload Report
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Slip Lightbox Modal ────────────────────────────────────────────── */}
      {activeSlipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3.5 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-5 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveSlipModal(null)}
              className="absolute top-4 right-4 p-1.5 sm:p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Building2 className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-primary shrink-0" />
                <span>Payment Slip Verification</span>
              </h3>
              <p className="text-xs text-zinc-400 font-semibold truncate">
                Customer: <span className="text-white font-bold">{activeSlipModal.userName}</span> ({activeSlipModal.userEmail})
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3 bg-zinc-800/60 border border-zinc-700/60 rounded-2xl text-xs">
              <div>
                <p className="text-[9px] sm:text-[10px] text-zinc-500 font-bold uppercase truncate">Plan</p>
                <p className="font-extrabold text-white text-xs truncate">{activeSlipModal.packageName}</p>
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] text-zinc-500 font-bold uppercase truncate">Coins</p>
                <p className="font-black text-primary text-xs truncate">+{activeSlipModal.credits} Coins</p>
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] text-zinc-500 font-bold uppercase truncate">Amount</p>
                <p className="font-bold text-white text-xs truncate">LKR {activeSlipModal.amount.toLocaleString("en-LK")}</p>
              </div>
            </div>

            <div className="max-h-[55vh] overflow-auto rounded-xl border border-zinc-800 bg-black p-2">
              {activeSlipModal.slipImage?.startsWith("data:application/pdf") || activeSlipModal.slipImage?.endsWith(".pdf") ? (
                <div className="space-y-3 p-4 text-center">
                  <iframe
                    src={activeSlipModal.slipImage}
                    title="PDF Bank Slip Receipt"
                    className="w-full h-[45vh] rounded-lg border border-zinc-800"
                  />
                  <a
                    href={activeSlipModal.slipImage}
                    download={`bank_slip_${activeSlipModal.userName}.pdf`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-black font-extrabold text-xs"
                  >
                    Download PDF Slip Receipt 📥
                  </a>
                </div>
              ) : (
                <img
                  src={activeSlipModal.slipImage}
                  alt="Full Slip Receipt"
                  className="max-w-full h-auto mx-auto rounded-lg"
                />
              )}
            </div>

            {activeSlipModal.status === "pending" && (
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => handleOpenRejectSlipModal(activeSlipModal)}
                  className="w-full sm:w-auto rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-black text-red-400 hover:bg-red-500/20 cursor-pointer text-center"
                >
                  Reject Slip
                </button>
                <button
                  onClick={() => handleApproveSlip(activeSlipModal)}
                  disabled={actionLoadingId === (activeSlipModal._id || activeSlipModal.id)}
                  className="w-full sm:w-auto rounded-xl bg-green-600 px-5 py-2.5 text-xs font-black text-white hover:bg-green-500 cursor-pointer shadow-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {actionLoadingId === (activeSlipModal._id || activeSlipModal.id) && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  Approve & Credit Coins
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Reject Reason Modal ────────────────────────────────────────────── */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3.5 sm:p-6">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsRejectModalOpen(false);
                setTargetRejectSlip(null);
                setTargetRejectAssignment(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{rejectTargetType === "assignment" ? "Reject Assignment & Refund 1 Coin" : "Reject Payment Slip"}</span>
            </h4>

            <p className="text-xs text-zinc-400 font-semibold truncate">
              Enter rejection note for{" "}
              <span className="text-white font-bold">
                {rejectTargetType === "assignment" ? targetRejectAssignment?.userName : targetRejectSlip?.userName}
              </span>:
            </p>

            <textarea
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder={
                rejectTargetType === "assignment"
                  ? "e.g. Scope unclear, missing required file..."
                  : "e.g. Reference number not matching..."
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-xs text-white font-semibold placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setTargetRejectSlip(null);
                  setTargetRejectAssignment(null);
                }}
                className="w-full sm:w-auto rounded-xl border border-zinc-700 px-4 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="w-full sm:w-auto rounded-xl bg-red-600 px-4 py-2.5 text-xs font-black text-white hover:bg-red-500 cursor-pointer flex items-center justify-center gap-1.5"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Upload Checked Turnitin Report Modal ────────────────────────────── */}
      {isApproveModalOpen && targetApproveDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3.5 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-8 space-y-5 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsApproveModalOpen(false);
                setTargetApproveDocument(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 border border-green-500/20 px-2.5 py-0.5 text-[10px] font-black text-green-400">
                <CheckCircle className="h-3 w-3" /> Approve Document & Upload Turnitin Report
              </span>
              <h3 className="text-base font-black text-white">{targetApproveDocument.title}</h3>
              <p className="text-xs text-zinc-400 font-medium truncate">
                Customer: <strong className="text-white">{targetApproveDocument.userName}</strong> ({targetApproveDocument.userEmail})
              </p>
            </div>

            {/* Original Uploaded File Download */}
            {targetApproveDocument.attachment && (
              <div className="p-3 bg-zinc-800/80 border border-zinc-700/80 rounded-xl flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-zinc-300 truncate max-w-[180px] sm:max-w-xs">
                  📁 Customer File: {targetApproveDocument.attachmentName || "Uploaded_Document"}
                </span>
                <a
                  href={targetApproveDocument.attachment}
                  download={targetApproveDocument.attachmentName || "customer_document"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded-lg bg-amber-500 text-black font-extrabold hover:bg-amber-400 text-xs shrink-0"
                >
                  Download File
                </a>
              </div>
            )}

            <form onSubmit={handleConfirmApproveDocument} className="space-y-4 pt-2">
              {/* Checked Turnitin Document Upload Box */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-white">
                  Upload Checked Turnitin Report Document <span className="text-red-400">*</span>
                </label>
                <div
                  onClick={() => resultFileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-700 hover:border-primary/60 rounded-xl p-4 text-center cursor-pointer bg-zinc-800/40 transition-all"
                >
                  <input
                    type="file"
                    ref={resultFileInputRef}
                    onChange={handleApproveFileChange}
                    accept=".pdf,.docx,.zip,.png,.jpg"
                    className="hidden"
                  />
                  {approveResultFileName ? (
                    <p className="text-xs font-bold text-primary truncate">
                      📄 {approveResultFileName}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-400 font-semibold flex items-center justify-center gap-1.5">
                      <Paperclip className="h-4 w-4 text-primary" /> Click to upload Checked Turnitin PDF / Report
                    </p>
                  )}
                </div>
              </div>

              {/* Optional Similarity & AI Scores */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-zinc-300">
                    Similarity % (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={approveSimilarityScore}
                    onChange={(e) => setApproveSimilarityScore(e.target.value)}
                    placeholder="e.g. 12"
                    className="w-full text-xs font-semibold text-white bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-zinc-300">
                    AI Detection % (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={approveAiScore}
                    onChange={(e) => setApproveAiScore(e.target.value)}
                    placeholder="e.g. 0"
                    className="w-full text-xs font-semibold text-white bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Optional Admin Note */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-zinc-300">Admin Note / Feedback (Optional)</label>
                <textarea
                  rows={2}
                  value={approveAdminNote}
                  onChange={(e) => setApproveAdminNote(e.target.value)}
                  placeholder="e.g. Verified in No-Repository mode."
                  className="w-full text-xs font-semibold text-white bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!approveResultFileName}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#fe9a00] py-3 text-xs font-extrabold text-black hover:bg-[#e08800] shadow-md shadow-[#fe9a00]/20 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve & Deliver Turnitin Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Theme-Styled Confirmation & Alert Popup Modal ───────────────── */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 space-y-5 relative shadow-2xl scale-100 transition-all">
            <button
              onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                  confirmDialog.variant === "danger"
                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                    : confirmDialog.variant === "success"
                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                    : confirmDialog.variant === "warning"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    : "bg-[#fe9a00]/10 border-[#fe9a00]/20 text-[#fe9a00]"
                }`}
              >
                {confirmDialog.variant === "danger" ? (
                  <AlertCircle className="h-6 w-6" />
                ) : confirmDialog.variant === "success" ? (
                  <CheckCircle className="h-6 w-6" />
                ) : confirmDialog.variant === "warning" ? (
                  <AlertCircle className="h-6 w-6" />
                ) : (
                  <Coins className="h-6 w-6" />
                )}
              </div>

              <div className="space-y-1 pr-6 min-w-0">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight capitalize">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
              {!confirmDialog.isAlertOnly && (
                <button
                  onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                  className="w-full sm:w-auto rounded-xl border border-zinc-700 bg-zinc-800/80 px-4.5 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-700 transition-all cursor-pointer"
                >
                  {confirmDialog.cancelText || "Cancel"}
                </button>
              )}
              <button
                onClick={() => {
                  const cb = confirmDialog.onConfirm;
                  setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                  if (cb) cb();
                }}
                className={`w-full sm:w-auto rounded-xl px-5 py-2.5 text-xs font-black transition-all shadow-lg cursor-pointer ${
                  confirmDialog.variant === "danger"
                    ? "bg-red-600 text-white hover:bg-red-500 shadow-red-600/20"
                    : confirmDialog.variant === "success"
                    ? "bg-green-600 text-white hover:bg-green-500 shadow-green-600/20"
                    : "bg-[#fe9a00] text-black hover:bg-[#e08800] shadow-[#fe9a00]/20"
                }`}
              >
                {confirmDialog.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
