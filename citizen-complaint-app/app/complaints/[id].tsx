import { complaintApiClient } from "@/lib/client/complaint";
import { handleApiError } from "@/utils/general/errorHandler";
import ErrorScreen from "@/screen/general/ErrorScreen";
import {
  formatDate,
  formatTime,
  getCategoryLabel,
} from "@/constants/complaint/complaint";
import { THEME } from "@/constants/theme";
import { Complaint } from "@/types/complaints/complaint";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertTriangle,
  ArrowDownUp,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock,
  FileText,
  Hash,
  ImageIcon,
  Landmark,
  Layers,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Paperclip,
  Phone,
  Play,
  Shield,
  XCircle,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Video, ResizeMode } from "expo-av";

// ─── Local Types for incident_links ──────────────────────────────────────────

interface ResponseAttachment {
  id: number;
  response_id: number;
  file_url: string;
  media_type: "image" | "video";
}

interface IncidentResponse {
  id: number;
  incident_id: number;
  responder_id: number;
  actions_taken: string;
  response_date: string;
  user?: {
    id: number;
    email: string;
    role: string;
    [key: string]: unknown;
  };
  response_attachments?: ResponseAttachment[];
}

interface IncidentDetail {
  id: number;
  responses: IncidentResponse[];
}

interface IncidentLink {
  id: number;
  response_id: number | null;
  incident: IncidentDetail;
}

interface ComplaintWithLinks extends Complaint {
  incident_links?: IncidentLink[];
}

// ─── Complaint Status Types ───────────────────────────────────────────────────

type ComplaintStatus =
  | "submitted"
  | "reviewed_by_barangay"
  | "resolved_by_barangay"
  | "forwarded_to_lgu"
  | "reviewed_by_lgu"
  | "resolved_by_lgu"
  | "forwarded_to_department"
  | "reviewed_by_department"
  | "resolved_by_department"
  | "rejected_by_barangay"
  | "rejected";

type StepState = "completed" | "active" | "pending" | "rejected";

interface TrackerStep {
  id: string;
  label: string;
  sublabel: string;
  state: StepState;
  icon: React.ReactNode;
}

function getTrackerSteps(
  status: ComplaintStatus,
  isRejectedByLgu: boolean,
  isRejectedByDepartment: boolean,
  t: (key: string) => string
): TrackerStep[] {
  const isResolved =
    status === "resolved_by_barangay" ||
    status === "resolved_by_lgu" ||
    status === "resolved_by_department";

  const isRejectedByBarangay = status === "rejected" || status === "rejected_by_barangay";

  const statusOrder: Record<ComplaintStatus, number> = {
    submitted: 0,
    reviewed_by_barangay: 1,
    rejected: 1,
    rejected_by_barangay: 1,
    resolved_by_barangay: 2,
    forwarded_to_lgu: 2,
    reviewed_by_lgu: 3,
    resolved_by_lgu: 4,
    forwarded_to_department: 4,
    reviewed_by_department: 5,
    resolved_by_department: 6,
  };

  const currentOrder = statusOrder[status];
  const ICON = 20;
  const primary = THEME.primary;
  const pendingCol = "#d1d5db";
  const red = "#ef4444";

  const col = (s: StepState) =>
    s === "rejected"
      ? red
      : s === "completed" || s === "active"
      ? primary
      : pendingCol;

  const submittedState: StepState = currentOrder >= 0 ? "completed" : "pending";

  let barangayState: StepState = "pending";
  if (isRejectedByBarangay) barangayState = "rejected";
  else if (currentOrder >= 2) barangayState = "completed";
  else if (currentOrder === 1) barangayState = "active";

  let lguState: StepState = "pending";
  if (isRejectedByLgu && !isResolved) lguState = "rejected";
  else if (currentOrder >= 4) lguState = "completed";
  else if (
    (currentOrder === 2 && status === "forwarded_to_lgu") ||
    (currentOrder === 3 && status === "reviewed_by_lgu")
  )
    lguState = "active";

  let deptState: StepState = "pending";
  if (isRejectedByDepartment && !isResolved) deptState = "rejected";
  else if (currentOrder >= 6) deptState = "completed";
  else if (currentOrder === 4 && status === "forwarded_to_department")
    deptState = "active";
  else if (currentOrder === 5) deptState = "active";

  let resolvedState: StepState = "pending";
  if (isResolved) resolvedState = "completed";

  const resolvedSublabel =
    status === "resolved_by_barangay"
      ? t("complaintDetail.tracker.resolvedByBarangay")
      : status === "resolved_by_lgu"
      ? t("complaintDetail.tracker.resolvedByLgu")
      : status === "resolved_by_department"
      ? t("complaintDetail.tracker.resolvedByDept")
      : t("complaintDetail.tracker.resolvedSub");

  return [
    {
      id: "submitted",
      label: t("complaintDetail.tracker.submitted"),
      sublabel: t("complaintDetail.tracker.submittedSub"),
      state: submittedState,
      icon: (
        <FileText size={ICON} color={col(submittedState)} strokeWidth={2.5} />
      ),
    },
    {
      id: "barangay",
      label: isRejectedByBarangay
        ? t("complaintDetail.tracker.rejectedBarangay")
        : t("complaintDetail.tracker.barangay"),
      sublabel: isRejectedByBarangay
        ? t("complaintDetail.tracker.rejectedSub")
        : t("complaintDetail.tracker.barangaySub"),
      state: barangayState,
      icon: isRejectedByBarangay ? (
        <XCircle size={ICON} color={red} strokeWidth={2.5} />
      ) : (
        <Shield size={ICON} color={col(barangayState)} strokeWidth={2.5} />
      ),
    },
    {
      id: "lgu",
      label:
        isRejectedByLgu && !isResolved
          ? t("complaintDetail.tracker.rejectedLgu")
          : t("complaintDetail.tracker.lgu"),
      sublabel:
        isRejectedByLgu && !isResolved
          ? t("complaintDetail.tracker.rejectedSub")
          : status === "reviewed_by_lgu"
          ? t("complaintDetail.tracker.lguReviewSub")
          : t("complaintDetail.tracker.lguSub"),
      state: lguState,
      icon:
        isRejectedByLgu && !isResolved ? (
          <XCircle size={ICON} color={red} strokeWidth={2.5} />
        ) : (
          <Landmark size={ICON} color={col(lguState)} strokeWidth={2.5} />
        ),
    },
    {
      id: "department",
      label:
        isRejectedByDepartment && !isResolved
          ? t("complaintDetail.tracker.rejectedDept")
          : t("complaintDetail.tracker.department"),
      sublabel:
        isRejectedByDepartment && !isResolved
          ? t("complaintDetail.tracker.rejectedSub")
          : t("complaintDetail.tracker.departmentSub"),
      state: deptState,
      icon:
        isRejectedByDepartment && !isResolved ? (
          <XCircle size={ICON} color={red} strokeWidth={2.5} />
        ) : (
          <Building2 size={ICON} color={col(deptState)} strokeWidth={2.5} />
        ),
    },
    {
      id: "resolved",
      label: t("complaintDetail.tracker.resolved"),
      sublabel: resolvedSublabel,
      state: resolvedState,
      icon: (
        <CheckCircle2
          size={ICON}
          color={col(resolvedState)}
          strokeWidth={2.5}
        />
      ),
    },
  ];
}

function getStatusDisplay(
  status: ComplaintStatus,
  isRejectedByLgu: boolean,
  isRejectedByDepartment: boolean,
  t: (key: string) => string
): { label: string; color: string; bg: string } {
  if (status === "rejected")
    return {
      label: t("complaintDetail.status.rejectedBarangay"),
      color: "#ef4444",
      bg: "#fef2f2",
    };
  if (isRejectedByLgu)
    return {
      label: t("complaintDetail.status.rejectedLgu"),
      color: "#ef4444",
      bg: "#fef2f2",
    };
  if (isRejectedByDepartment)
    return {
      label: t("complaintDetail.status.rejectedDept"),
      color: "#ef4444",
      bg: "#fef2f2",
    };

  const map: Record<
    Exclude<ComplaintStatus, "rejected" | "rejected_by_barangay">,
    { label: string; color: string; bg: string }
  > = {
    submitted: {
      label: t("complaintDetail.status.submitted"),
      color: "#6366f1",
      bg: "#eef2ff",
    },
    reviewed_by_barangay: {
      label: t("complaintDetail.status.underReview"),
      color: "#f59e0b",
      bg: "#fffbeb",
    },
    forwarded_to_lgu: {
      label: t("complaintDetail.status.forwardedLgu"),
      color: THEME.primary,
      bg: "#eff6ff",
    },
    reviewed_by_lgu: {
      label: t("complaintDetail.status.underReviewLgu"),
      color: "#f59e0b",
      bg: "#fffbeb",
    },
    forwarded_to_department: {
      label: t("complaintDetail.status.forwardedDept"),
      color: "#8b5cf6",
      bg: "#f5f3ff",
    },
    reviewed_by_department: {
      label: t("complaintDetail.status.deptReview"),
      color: "#f59e0b",
      bg: "#fffbeb",
    },
    resolved_by_barangay: {
      label: t("complaintDetail.status.resolvedBarangay"),
      color: "#10b981",
      bg: "#ecfdf5",
    },
    resolved_by_lgu: {
      label: t("complaintDetail.status.resolvedLgu"),
      color: "#10b981",
      bg: "#ecfdf5",
    },
    resolved_by_department: {
      label: t("complaintDetail.status.resolvedDept"),
      color: "#10b981",
      bg: "#ecfdf5",
    },
  };

  return map[status as Exclude<ComplaintStatus, "rejected" | "rejected_by_barangay">];
}

// ─── Loading State ────────────────────────────────────────────────────────────

function LoadingState() {
  const { t } = useTranslation();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb",
      }}
    >
      <ActivityIndicator size="large" color={THEME.primary} />
      <Text
        style={{
          fontSize: 17,
          color: "#9ca3af",
          marginTop: 14,
          fontWeight: "500",
        }}
      >
        {t("complaintDetail.loading")}
      </Text>
    </View>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 20,
        marginHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#f3f4f6",
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: "#f3f4f6",
        }}
      >
        {icon}
        <Text
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: "#374151",
            letterSpacing: 0.3,
          }}
        >
          {title}
        </Text>
      </View>
      <View style={{ padding: 18 }}>{children}</View>
    </View>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 14,
        marginBottom: 16,
      }}
    >
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          backgroundColor: "#f0f4ff",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1, paddingTop: 2 }}>
        <Text
          style={{
            fontSize: 13,
            color: "#9ca3af",
            fontWeight: "600",
            marginBottom: 3,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "#1f2937",
            fontWeight: "500",
            lineHeight: 23,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

// ─── Progress Tracker ─────────────────────────────────────────────────────────

function ProgressTracker({
  steps,
  title,
}: {
  steps: TrackerStep[];
  title: string;
}) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 20,
        marginHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#f3f4f6",
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: "#f3f4f6",
        }}
      >
        <Clock size={18} color={THEME.primary} strokeWidth={2.5} />
        <Text
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: "#374151",
            letterSpacing: 0.3,
          }}
        >
          {title}
        </Text>
      </View>

      <View style={{ padding: 18 }}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isCompleted = step.state === "completed";
          const isActive = step.state === "active";
          const isRejected = step.state === "rejected";

          const dotBg = isRejected
            ? "#fef2f2"
            : isCompleted || isActive
            ? "#eff6ff"
            : "#f9fafb";

          const dotBorder = isRejected
            ? "#ef4444"
            : isCompleted || isActive
            ? THEME.primary
            : "#e5e7eb";

          return (
            <View key={step.id} style={{ flexDirection: "row" }}>
              <View style={{ alignItems: "center", width: 48 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: dotBg,
                    borderWidth: 2,
                    borderColor: dotBorder,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {step.icon}
                </View>
                {!isLast && (
                  <View
                    style={{
                      width: 2,
                      flex: 1,
                      minHeight: 24,
                      backgroundColor: isCompleted ? THEME.primary : "#e5e7eb",
                      marginTop: 3,
                      marginBottom: 3,
                    }}
                  />
                )}
              </View>

              <View
                style={{
                  flex: 1,
                  paddingLeft: 14,
                  paddingTop: 10,
                  paddingBottom: isLast ? 0 : 22,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: isActive ? "800" : "600",
                      color: isRejected
                        ? "#ef4444"
                        : isActive
                        ? THEME.primary
                        : isCompleted
                        ? "#1f2937"
                        : "#9ca3af",
                    }}
                  >
                    {step.label}
                  </Text>

                  {isActive && (
                    <View
                      style={{
                        backgroundColor: "#eff6ff",
                        borderRadius: 20,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: THEME.primary,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Current
                      </Text>
                    </View>
                  )}

                  {isRejected && (
                    <View
                      style={{
                        backgroundColor: "#fef2f2",
                        borderRadius: 20,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: "#ef4444",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Rejected
                      </Text>
                    </View>
                  )}
                </View>

                <Text
                  style={{
                    fontSize: 14,
                    color: isRejected ? "#fca5a5" : "#9ca3af",
                    marginTop: 4,
                    lineHeight: 20,
                  }}
                >
                  {step.sublabel}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Rejection Banner ─────────────────────────────────────────────────────────

function RejectionBanner({ by }: { by: "barangay" | "lgu" | "department" }) {
  const { t } = useTranslation();
  const label =
    by === "barangay"
      ? t("complaintDetail.rejection.byBarangay")
      : by === "lgu"
      ? t("complaintDetail.rejection.byLgu")
      : t("complaintDetail.rejection.byDept");

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: "#fecaca",
        backgroundColor: "#fef2f2",
        overflow: "hidden",
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 18 }}
      >
        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 16,
            backgroundColor: "#fee2e2",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AlertTriangle size={26} color="#ef4444" strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 17,
              fontWeight: "800",
              color: "#dc2626",
              marginBottom: 4,
            }}
          >
            {t("complaintDetail.rejection.title")}
          </Text>
          <Text style={{ fontSize: 15, color: "#f87171", lineHeight: 21 }}>
            {label}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Media Viewer Modal (Image + Video) ──────────────────────────────────────

function MediaViewer({
  item,
  visible,
  onClose,
}: {
  item: { uri: string; type: "image" | "video" } | null;
  visible: boolean;
  onClose: () => void;
}) {
  const videoRef = React.useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const screenW = Dimensions.get("window").width;

  React.useEffect(() => {
    if (!visible) {
      videoRef.current?.pauseAsync();
      setIsPlaying(false);
    }
  }, [visible]);

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.95)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Close button */}
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: "absolute",
            top: 52,
            right: 20,
            zIndex: 10,
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 22,
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
          activeOpacity={0.8}
        >
          <XCircle size={22} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Type badge */}
        <View
          style={{
            position: "absolute",
            top: 58,
            left: 20,
            zIndex: 10,
            backgroundColor: "rgba(255,255,255,0.12)",
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          {item.type === "image" ? (
            <ImageIcon size={13} color="#fff" strokeWidth={2} />
          ) : (
            <Play size={13} color="#fff" strokeWidth={2} fill="#fff" />
          )}
          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 0.5 }}>
            {item.type === "image" ? "PHOTO" : "VIDEO"}
          </Text>
        </View>

        {/* ── Image ── */}
        {item.type === "image" && (
          <TouchableOpacity activeOpacity={1} onPress={onClose}>
            <Image
              source={{ uri: item.uri }}
              style={{ width: screenW, height: screenW * 1.2 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}

        {/* ── Video ── */}
        {item.type === "video" && (
          <View style={{ width: screenW, height: screenW * (9 / 16) }}>
            <Video
              ref={videoRef}
              source={{ uri: item.uri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              isLooping
              isMuted={isMuted}
              onPlaybackStatusUpdate={(status) => {
                if (status.isLoaded) setIsPlaying(status.isPlaying);
              }}
            />

            {/* Video controls overlay */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "rgba(0,0,0,0.45)",
              }}
            >
              {/* Play / Pause */}
              <TouchableOpacity
                onPress={() => {
                  if (isPlaying) {
                    videoRef.current?.pauseAsync();
                  } else {
                    videoRef.current?.playAsync();
                  }
                }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                activeOpacity={0.8}
              >
                {isPlaying ? (
                  <View style={{ flexDirection: "row", gap: 4 }}>
                    <View style={{ width: 4, height: 18, backgroundColor: "#fff", borderRadius: 2 }} />
                    <View style={{ width: 4, height: 18, backgroundColor: "#fff", borderRadius: 2 }} />
                  </View>
                ) : (
                  <Play size={20} color="#fff" strokeWidth={2.5} fill="#fff" />
                )}
              </TouchableOpacity>

              {/* Mute toggle */}
              <TouchableOpacity
                onPress={() => setIsMuted((m) => !m)}
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
                  {isMuted ? "🔇 Unmute" : "🔊 Mute"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

// ─── Attachment Grid ──────────────────────────────────────────────────────────

function AttachmentGrid({ attachments }: { attachments: ResponseAttachment[] }) {
  const [activeItem, setActiveItem] = useState<{
    uri: string;
    type: "image" | "video";
  } | null>(null);

  if (attachments.length === 0) return null;

  const THUMB = (Dimensions.get("window").width - 32 - 18 * 2 - 8) / 3;

  return (
    <>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, marginBottom: 10 }}>
        <Paperclip size={14} color="#9ca3af" strokeWidth={2} />
        <Text style={{ fontSize: 13, color: "#9ca3af", fontWeight: "600" }}>
          Attachments ({attachments.length})
        </Text>
      </View>

      {/* Grid */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {attachments.map((att) => (
          <TouchableOpacity
            key={att.id}
            activeOpacity={0.8}
            onPress={() => setActiveItem({ uri: att.file_url, type: att.media_type })}
            style={{
              width: THUMB,
              height: THUMB,
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: "#f3f4f6",
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            {att.media_type === "image" ? (
              <>
                <Image source={{ uri: att.file_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                <View style={{ position: "absolute", bottom: 6, right: 6, backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 8, padding: 4 }}>
                  <ImageIcon size={11} color="#fff" strokeWidth={2} />
                </View>
              </>
            ) : (
              <View style={{ flex: 1, backgroundColor: "#111827", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" }}>
                  <Play size={17} color="#fff" strokeWidth={2.5} fill="#fff" />
                </View>
                <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>
                  Video
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Unified Media Viewer */}
      <MediaViewer item={activeItem} visible={!!activeItem} onClose={() => setActiveItem(null)} />
    </>
  );
}

// ─── Responses / Remarks Section ─────────────────────────────────────────────

const PREVIEW_COUNT = 2;

function ResponsesSection({
  incidentLinks,
}: {
  incidentLinks: IncidentLink[];
}) {
  const { t } = useTranslation();
  const [sortDesc, setSortDesc] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const allResponses = useMemo(() => {
    const flat = incidentLinks.flatMap(
      (link) => link.incident?.responses ?? []
    );
    return flat.slice().sort((a, b) => {
      const diff =
        new Date(a.response_date).getTime() -
        new Date(b.response_date).getTime();
      return sortDesc ? -diff : diff;
    });
  }, [incidentLinks, sortDesc]);

  if (allResponses.length === 0) return null;

  const visible = showAll
    ? allResponses
    : allResponses.slice(0, PREVIEW_COUNT);

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 20,
        marginHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#f3f4f6",
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: "#f3f4f6",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <MessageCircle size={18} color={THEME.primary} strokeWidth={2.5} />
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: "#374151",
              letterSpacing: 0.3,
            }}
          >
            {t("complaintDetail.remarks.title")}
          </Text>
          <View
            style={{
              backgroundColor: "#eff6ff",
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 3,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: THEME.primary }}>
              {allResponses.length}
            </Text>
          </View>
        </View>

        {/* Sort toggle */}
        <TouchableOpacity
          onPress={() => setSortDesc((p) => !p)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: "#f3f4f6",
            borderRadius: 20,
            paddingHorizontal: 13,
            paddingVertical: 8,
          }}
          activeOpacity={0.7}
        >
          <ArrowDownUp size={15} color="#6b7280" strokeWidth={2.5} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#6b7280" }}>
            {sortDesc
              ? t("complaintDetail.remarks.newest")
              : t("complaintDetail.remarks.oldest")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Remark cards */}
      <View style={{ padding: 18, gap: 14 }}>
        {visible.map((resp, i) => {
          const remarkNumber = sortDesc ? allResponses.length - i : i + 1;
          const attachments = resp.response_attachments ?? [];
          const hasText = !!resp.actions_taken?.trim();
          const hasAttachments = attachments.length > 0;

          return (
            <View
              key={resp.id}
              style={{
                borderRadius: 16,
                backgroundColor: "#f9fafb",
                borderWidth: 1,
                borderColor: "#f3f4f6",
                overflow: "hidden",
              }}
            >
              {/* Top bar */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingHorizontal: 16,
                  paddingTop: 14,
                  paddingBottom: 10,
                }}
              >
                <View
                  style={{
                    width: 5,
                    height: 40,
                    borderRadius: 4,
                    backgroundColor: THEME.primary,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: THEME.primary,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 4,
                    }}
                  >
                    {t("complaintDetail.remarks.remarkLabel", {
                      number: remarkNumber,
                    })}
                  </Text>
                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                  >
                    <Clock size={13} color="#9ca3af" strokeWidth={2} />
                    <Text style={{ fontSize: 13, color: "#9ca3af" }}>
                      {formatDate(resp.response_date)} at{" "}
                      {formatTime(resp.response_date)}
                    </Text>
                  </View>
                </View>

                {/* Badge: attachment count */}
                {hasAttachments && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      backgroundColor: "#f0f4ff",
                      borderRadius: 20,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                    }}
                  >
                    <Paperclip size={12} color={THEME.primary} strokeWidth={2.5} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: THEME.primary,
                      }}
                    >
                      {attachments.length}
                    </Text>
                  </View>
                )}
              </View>

              {/* Body */}
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                {/* Actions taken text — or placeholder if empty */}
                {hasText ? (
                  <Text style={{ fontSize: 16, color: "#1f2937", lineHeight: 24 }}>
                    {resp.actions_taken}
                  </Text>
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      backgroundColor: "#f3f4f6",
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                    }}
                  >
                    <MessageSquare size={15} color="#d1d5db" strokeWidth={2} />
                    <Text style={{ fontSize: 14, color: "#d1d5db", fontStyle: "italic" }}>
                      No remarks provided
                    </Text>
                  </View>
                )}

                {/* Attachment grid */}
                {hasAttachments && (
                  <AttachmentGrid attachments={attachments} />
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* View All / Show Less */}
      {allResponses.length > PREVIEW_COUNT && (
        <TouchableOpacity
          onPress={() => setShowAll((p) => !p)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginHorizontal: 18,
            marginBottom: 18,
            paddingVertical: 15,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: "#e5e7eb",
            backgroundColor: "#f9fafb",
          }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: THEME.primary }}>
            {showAll
              ? t("complaintDetail.remarks.showLess")
              : t("complaintDetail.remarks.viewAll", {
                  count: allResponses.length,
                })}
          </Text>
          <ChevronDown
            size={16}
            color={THEME.primary}
            strokeWidth={2.5}
            style={{ transform: [{ rotate: showAll ? "180deg" : "0deg" }] }}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ComplaintDetail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, error, isLoading, isFetching, refetch } =
    useQuery<ComplaintWithLinks>({
      queryKey: ["complaintDetail", id],
      queryFn: async () => {
        const response = await complaintApiClient.get(`/${id}`);
        return response.data;
      },
      enabled: !!id,
    });

  if (error) {
    const appError = handleApiError(
      new Error(t("complaintDetail.error.message"))
    );
    return (
      <ErrorScreen
        type={appError.type}
        title={t("complaintDetail.error.title")}
        onRetry={refetch}
      />
    );
  }

  if (isLoading) return <LoadingState />;
  if (!data) return null;

  const status = (data.status ?? "submitted") as ComplaintStatus;

  const isResolved =
    status === "resolved_by_barangay" ||
    status === "resolved_by_lgu" ||
    status === "resolved_by_department";

  const isRejectedByBarangay = status === "rejected";
  const isRejectedByLgu = !!data.is_rejected_by_lgu && !isResolved;
  const isRejectedByDepartment = !!data.is_rejected_by_department && !isResolved;

  const steps = getTrackerSteps(
    status,
    isRejectedByLgu,
    isRejectedByDepartment,
    t
  );
  const statusDisplay = getStatusDisplay(
    status,
    isRejectedByLgu,
    isRejectedByDepartment,
    t
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#f3f4f6",
          paddingTop: 52,
          paddingBottom: 16,
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              backgroundColor: "#f3f4f6",
              alignItems: "center",
              justifyContent: "center",
            }}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color="#374151" strokeWidth={2.5} />
          </TouchableOpacity>

          <Text style={{ fontSize: 13, color: "#9ca3af", fontWeight: "600" }}>
            {t("complaintDetail.header.complaintId", { id: data.id })}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text
            style={{
              flex: 1,
              fontSize: 17,
              fontWeight: "800",
              color: "#111827",
              lineHeight: 24,
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {data.title}
          </Text>

          <View
            style={{
              backgroundColor: statusDisplay.bg,
              borderRadius: 22,
              paddingHorizontal: 13,
              paddingVertical: 8,
              flexShrink: 0,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "800",
                color: statusDisplay.color,
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              {statusDisplay.label}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 18, paddingBottom: 48 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            colors={[THEME.primary]}
            tintColor={THEME.primary}
          />
        }
      >
        {/* ── Rejection Banners ── */}
        {isRejectedByBarangay && <RejectionBanner by="barangay" />}
        {isRejectedByLgu && <RejectionBanner by="lgu" />}
        {isRejectedByDepartment && <RejectionBanner by="department" />}

        {/* ── Progress Tracker ── */}
        <ProgressTracker
          steps={steps}
          title={t("complaintDetail.tracker.title")}
        />

        {/* ── Complaint Info ── */}
        <SectionCard
          title={t("complaintDetail.sections.complaintInfo")}
          icon={<FileText size={18} color={THEME.primary} strokeWidth={2.5} />}
        >
          <InfoRow
            icon={<Layers size={18} color={THEME.primary} strokeWidth={2} />}
            label={t("complaintDetail.fields.category")}
            value={getCategoryLabel(data.category?.category_name ?? "")}
          />
          {data.description && (
            <InfoRow
              icon={
                <MessageSquare size={18} color={THEME.primary} strokeWidth={2} />
              }
              label={t("complaintDetail.fields.description")}
              value={data.description}
            />
          )}
          {data.location_details && (
            <InfoRow
              icon={<MapPin size={18} color={THEME.primary} strokeWidth={2} />}
              label={t("complaintDetail.fields.location")}
              value={data.location_details}
            />
          )}
          <InfoRow
            icon={<Calendar size={18} color={THEME.primary} strokeWidth={2} />}
            label={t("complaintDetail.fields.dateSubmitted")}
            value={`${formatDate(data.created_at)}  •  ${formatTime(data.created_at)}`}
          />
        </SectionCard>

        {/* ── Barangay ── */}
        {data.barangay && (
          <SectionCard
            title={t("complaintDetail.sections.barangay")}
            icon={<Shield size={18} color={THEME.primary} strokeWidth={2.5} />}
          >
            <InfoRow
              icon={<Shield size={18} color={THEME.primary} strokeWidth={2} />}
              label={t("complaintDetail.fields.barangayName")}
              value={data.barangay.barangay_name}
            />
            <InfoRow
              icon={<MapPin size={18} color={THEME.primary} strokeWidth={2} />}
              label={t("complaintDetail.fields.address")}
              value={data.barangay.barangay_address}
            />
            <InfoRow
              icon={<Phone size={18} color={THEME.primary} strokeWidth={2} />}
              label={t("complaintDetail.fields.contactNumber")}
              value={data.barangay.barangay_contact_number}
            />
            <InfoRow
              icon={<Mail size={18} color={THEME.primary} strokeWidth={2} />}
              label={t("complaintDetail.fields.email")}
              value={data.barangay.barangay_email}
            />
          </SectionCard>
        )}

        {/* ── Department ── */}
        {data.department && (
          <SectionCard
            title={t("complaintDetail.sections.department")}
            icon={<Building2 size={18} color={THEME.primary} strokeWidth={2.5} />}
          >
            <InfoRow
              icon={<Building2 size={18} color={THEME.primary} strokeWidth={2} />}
              label={t("complaintDetail.fields.departmentName")}
              value={data.department.department_name}
            />
            {data.department.department_address && (
              <InfoRow
                icon={<MapPin size={18} color={THEME.primary} strokeWidth={2} />}
                label={t("complaintDetail.fields.address")}
                value={data.department.department_address}
              />
            )}
            {data.department.department_contact_number && (
              <InfoRow
                icon={<Phone size={18} color={THEME.primary} strokeWidth={2} />}
                label={t("complaintDetail.fields.contactNumber")}
                value={data.department.department_contact_number}
              />
            )}
            {data.department.department_email && (
              <InfoRow
                icon={<Mail size={18} color={THEME.primary} strokeWidth={2} />}
                label={t("complaintDetail.fields.email")}
                value={data.department.department_email}
              />
            )}
          </SectionCard>
        )}

        {/* ── Remarks ── */}
        {(data.incident_links ?? []).length > 0 && (
          <ResponsesSection incidentLinks={data.incident_links!} />
        )}
      </ScrollView>

      {/* ── Floating Feedback Button (resolved only) ── */}
      {isResolved && (
        <View
          style={{
            position: "absolute",
            bottom: 32,
            left: 16,
            right: 16,
            zIndex: 10,
          }}
        >
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/feedback/PostIncident",
                params: { incidentId: data.id, complaintTitle: data.title },
              })
            }
            style={{
              backgroundColor: THEME.primary,
              borderRadius: 18,
              paddingVertical: 17,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 10,
              shadowColor: THEME.primary,
              shadowOpacity: 0.35,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            }}
            activeOpacity={0.85}
          >
            <MessageCircle size={20} color="#fff" strokeWidth={2.5} />
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              {t("complaintDetail.feedbackButton")}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}