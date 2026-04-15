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
  Landmark,
  Layers,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  Shield,
  XCircle,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";

// ─── Local Types for incident_links ──────────────────────────────────────────

interface IncidentResponse {
  id: number;
  incident_id: number;
  responder_id: number;
  actions_taken: string;
  response_date: string;
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

  // Barangay step
  let barangayState: StepState = "pending";
  if (isRejectedByBarangay) barangayState = "rejected";
  else if (currentOrder >= 2) barangayState = "completed";
  else if (currentOrder === 1) barangayState = "active";

  // LGU step
  let lguState: StepState = "pending";
  if (isRejectedByLgu && !isResolved) lguState = "rejected";
  else if (currentOrder >= 4) lguState = "completed";
  else if (
    (currentOrder === 2 && status === "forwarded_to_lgu") ||
    (currentOrder === 3 && status === "reviewed_by_lgu")
  )
    lguState = "active";

  // Department step
  let deptState: StepState = "pending";
  if (isRejectedByDepartment && !isResolved) deptState = "rejected";
  else if (currentOrder >= 6) deptState = "completed";
  else if (currentOrder === 4 && status === "forwarded_to_department")
    deptState = "active";
  else if (currentOrder === 5) deptState = "active";

  // Resolved step
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
    Exclude<ComplaintStatus, "rejected">,
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

  return map[status as Exclude<ComplaintStatus, "rejected">];
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
              {/* Left column: dot + line */}
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

              {/* Right column: label + sublabel */}
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
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
        >
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
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: THEME.primary,
              }}
            >
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
          <Text
            style={{ fontSize: 14, fontWeight: "600", color: "#6b7280" }}
          >
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
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Clock size={13} color="#9ca3af" strokeWidth={2} />
                    <Text style={{ fontSize: 13, color: "#9ca3af" }}>
                      {new Date(resp.response_date).toLocaleString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Actions taken text */}
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <Text
                  style={{ fontSize: 16, color: "#1f2937", lineHeight: 24 }}
                >
                  {resp.actions_taken}
                </Text>
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
          <Text
            style={{ fontSize: 15, fontWeight: "700", color: THEME.primary }}
          >
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
        {/* Row 1: back button + complaint ID */}
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

          <Text
            style={{ fontSize: 13, color: "#9ca3af", fontWeight: "600" }}
          >
            {t("complaintDetail.header.complaintId", { id: data.id })}
          </Text>
        </View>

        {/* Row 2: title + status chip */}
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
        >
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
                <MessageSquare
                  size={18}
                  color={THEME.primary}
                  strokeWidth={2}
                />
              }
              label={t("complaintDetail.fields.description")}
              value={data.description}
            />
          )}
          {data.location_details && (
            <InfoRow
              icon={
                <MapPin size={18} color={THEME.primary} strokeWidth={2} />
              }
              label={t("complaintDetail.fields.location")}
              value={data.location_details}
            />
          )}
          <InfoRow
            icon={
              <Calendar size={18} color={THEME.primary} strokeWidth={2} />
            }
            label={t("complaintDetail.fields.dateSubmitted")}
            value={`${formatDate(data.created_at)}  •  ${formatTime(
              data.created_at
            )}`}
          />
        </SectionCard>

        {/* ── Barangay ── */}
        {data.barangay && (
          <SectionCard
            title={t("complaintDetail.sections.barangay")}
            icon={
              <Shield size={18} color={THEME.primary} strokeWidth={2.5} />
            }
          >
            <InfoRow
              icon={
                <Shield size={18} color={THEME.primary} strokeWidth={2} />
              }
              label={t("complaintDetail.fields.barangayName")}
              value={data.barangay.barangay_name}
            />
            <InfoRow
              icon={
                <MapPin size={18} color={THEME.primary} strokeWidth={2} />
              }
              label={t("complaintDetail.fields.address")}
              value={data.barangay.barangay_address}
            />
            <InfoRow
              icon={
                <Phone size={18} color={THEME.primary} strokeWidth={2} />
              }
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
            icon={
              <Building2
                size={18}
                color={THEME.primary}
                strokeWidth={2.5}
              />
            }
          >
            <InfoRow
              icon={
                <Building2
                  size={18}
                  color={THEME.primary}
                  strokeWidth={2}
                />
              }
              label={t("complaintDetail.fields.departmentName")}
              value={data.department.department_name}
            />
            {data.department.department_address && (
              <InfoRow
                icon={
                  <MapPin size={18} color={THEME.primary} strokeWidth={2} />
                }
                label={t("complaintDetail.fields.address")}
                value={data.department.department_address}
              />
            )}
            {data.department.department_contact_number && (
              <InfoRow
                icon={
                  <Phone size={18} color={THEME.primary} strokeWidth={2} />
                }
                label={t("complaintDetail.fields.contactNumber")}
                value={data.department.department_contact_number}
              />
            )}
            {data.department.department_email && (
              <InfoRow
                icon={
                  <Mail size={18} color={THEME.primary} strokeWidth={2} />
                }
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
    </View>
  );
}