import { complaintApiClient } from "@/lib/client/complaint";
import { handleApiError } from "@/utils/general/errorHandler";
import ErrorScreen from "@/screen/general/ErrorScreen";
import { CategoryIcon } from "@/components/complaint/CategoryIcon";
import { StatusBadge } from "@/components/complaint/StatusBadge";
import { formatDate, formatTime, getCategoryLabel } from "@/constants/complaint/complaint";
import { THEME } from "@/constants/theme";
import { Complaint } from "@/types/complaints/complaint";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Tag,
  XCircle,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Status Pipeline ──────────────────────────────────────────────────────────
//
// The raw statuses from the API are mapped into a simplified 4-step timeline:
//
//   1. Submitted
//   2. Under Review       ← covers reviewed_by_barangay / reviewed_by_department
//   3. Forwarded          ← covers forwarded_to_lgu / forwarded_to_department
//                            (hidden when complaint is resolved at barangay level)
//   4. Resolved           ← covers resolved_by_barangay / resolved_by_department
//
// The timeline auto-collapses: if resolved at barangay level, "Forwarded" is
// never shown. Labels adjust based on who is currently handling the complaint.

type RawStatus =
  | "submitted"
  | "reviewed_by_barangay"
  | "resolved_by_barangay"
  | "forwarded_to_lgu"
  | "forwarded_to_department"
  | "reviewed_by_department"
  | "resolved_by_department"
  | "rejected";

/** Which simplified stage index is active (0-based) */
function getActiveStageIndex(raw: string): number {
  switch (raw) {
    case "submitted":               return 0;
    case "reviewed_by_barangay":    return 1;
    case "forwarded_to_lgu":        return 2;
    case "forwarded_to_department": return 2;
    case "reviewed_by_department":  return 1; // still "Under Review" at dept level
    case "resolved_by_barangay":    return 3;
    case "resolved_by_department":  return 3;
    default:                        return 0;
  }
}

/** Whether to show the "Forwarded" step (hidden for barangay-only flow) */
function showsForwardedStep(raw: string): boolean {
  return [
    "forwarded_to_lgu",
    "forwarded_to_department",
    "reviewed_by_department",
    "resolved_by_department",
  ].includes(raw);
}

/** Context-aware label for the "Under Review" stage */
function getReviewLabel(raw: string, t: (k: string) => string): string {
  if (["reviewed_by_department", "forwarded_to_department", "resolved_by_department"].includes(raw)) {
    return t("complaintDetail.timeline.stages.reviewed_by_department.label");
  }
  return t("complaintDetail.timeline.stages.reviewed_by_barangay.label");
}

/** Context-aware sublabel for the "Under Review" stage */
function getReviewSublabel(raw: string, t: (k: string) => string): string {
  if (["reviewed_by_department", "forwarded_to_department", "resolved_by_department"].includes(raw)) {
    return t("complaintDetail.timeline.stages.reviewed_by_department.sublabel");
  }
  return t("complaintDetail.timeline.stages.reviewed_by_barangay.sublabel");
}

// ─── Status Timeline ──────────────────────────────────────────────────────────

function StatusTimeline({ status }: { status: string | null }) {
  const { t } = useTranslation();
  const raw = (status ?? "").toLowerCase() as RawStatus;
  const isRejected = raw === "rejected";
  const activeIndex = getActiveStageIndex(raw);
  const hasForwarded = showsForwardedStep(raw);

  if (isRejected) {
    return (
      <View
        style={{
          backgroundColor: "#fff1f2",
          borderWidth: 1.5,
          borderColor: "#fecdd3",
          borderRadius: 20,
          padding: 20,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: "#ffe4e6",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <XCircle size={26} color="#e11d48" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: "800", color: "#9f1239", marginBottom: 4 }}>
              {t("complaintDetail.timeline.rejected.title")}
            </Text>
            <Text style={{ fontSize: 14, color: "#be123c", lineHeight: 20, fontWeight: "500" }}>
              {t("complaintDetail.timeline.rejected.description")}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Build dynamic stage list
  const stages: { label: string; sublabel: string }[] = [
    {
      label: t("complaintDetail.timeline.stages.submitted.label"),
      sublabel: t("complaintDetail.timeline.stages.submitted.sublabel"),
    },
    {
      label: getReviewLabel(raw, t),
      sublabel: getReviewSublabel(raw, t),
    },
    ...(hasForwarded
      ? [
          {
            label: t("complaintDetail.timeline.stages.forwarded_to_department.label"),
            sublabel: t("complaintDetail.timeline.stages.forwarded_to_department.sublabel"),
          },
        ]
      : []),
    {
      label: t("complaintDetail.timeline.stages.resolved_by_barangay.label"),
      sublabel: t("complaintDetail.timeline.stages.resolved_by_barangay.sublabel"),
    },
  ];

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      {/* Section header */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 10 }}>
        <View
          style={{
            width: 6,
            height: 22,
            borderRadius: 3,
            backgroundColor: THEME.primary,
          }}
        />
        <Text
          style={{
            fontSize: 13,
            fontWeight: "800",
            color: "#374151",
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          {t("complaintDetail.timeline.sectionTitle")}
        </Text>
      </View>

      {stages.map((stage, i) => {
        const isCompleted = activeIndex > i;
        const isActive = activeIndex === i;
        const isLast = i === stages.length - 1;
        const isResolved = isLast; // last stage is always "Resolved"

        const dotColor = isCompleted || isActive ? THEME.primary : "#e5e7eb";
        const lineColor = isCompleted ? `${THEME.primary}80` : "#e5e7eb";
        const activeBadgeBg = `${THEME.primary}15`;
        const activeBadgeBorder = `${THEME.primary}40`;

        return (
          <View key={i} style={{ flexDirection: "row" }}>
            {/* Dot + connector */}
            <View style={{ alignItems: "center", marginRight: 14, width: 36 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: dotColor,
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                  ...(isActive && {
                    shadowColor: THEME.primary,
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 0 },
                  }),
                }}
              >
                {isCompleted ? (
                  <CheckCircle2 size={18} color="#fff" />
                ) : isActive ? (
                  isResolved ? (
                    <CheckCircle2 size={18} color="#fff" />
                  ) : (
                    <Clock size={17} color="#fff" />
                  )
                ) : (
                  <Circle size={13} color="#9ca3af" />
                )}
              </View>

              {!isLast && (
                <View
                  style={{
                    width: 3,
                    borderRadius: 2,
                    flex: 1,
                    minHeight: 28,
                    marginVertical: 3,
                    backgroundColor: lineColor,
                  }}
                />
              )}
            </View>

            {/* Text */}
            <View style={{ flex: 1, paddingBottom: 18, justifyContent: "flex-start" }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 5,
                }}
              >
                <Text
                  style={{
                    fontSize: isActive ? 16 : 15,
                    fontWeight: isActive ? "800" : isCompleted ? "700" : "600",
                    color: isActive
                      ? THEME.primary
                      : isCompleted
                      ? "#374151"
                      : "#9ca3af",
                  }}
                >
                  {stage.label}
                </Text>

                {isActive && !isResolved && (
                  <View
                    style={{
                      backgroundColor: activeBadgeBg,
                      borderRadius: 20,
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderWidth: 1,
                      borderColor: activeBadgeBorder,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: THEME.primary,
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                      }}
                    >
                      {t("complaintDetail.timeline.badge.current")}
                    </Text>
                  </View>
                )}

                {(isCompleted || (isActive && isResolved)) && (
                  <View
                    style={{
                      backgroundColor: isResolved && isActive ? "#f0fdf4" : "#f0fdf4",
                      borderRadius: 20,
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: "#16a34a",
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                      }}
                    >
                      {isActive && isResolved
                        ? t("complaintDetail.timeline.badge.resolved")
                        : t("complaintDetail.timeline.badge.done")}
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={{
                  fontSize: 13,
                  marginTop: 3,
                  lineHeight: 18,
                  fontWeight: isActive ? "600" : "400",
                  color: isActive
                    ? THEME.primary
                    : isCompleted
                    ? "#6b7280"
                    : "#d1d5db",
                }}
              >
                {stage.sublabel}
              </Text>
            </View>
          </View>
        );
      })}
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
        gap: 12,
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: "#f9fafb",
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: "#f3f4f6",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: "#9ca3af",
            textTransform: "uppercase",
            letterSpacing: 0.8,
            marginBottom: 3,
          }}
        >
          {label}
        </Text>
        <Text style={{ fontSize: 15, fontWeight: "600", color: "#1f2937", lineHeight: 21 }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

// ─── Contact Row ──────────────────────────────────────────────────────────────

function ContactRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: `${THEME.primary}20`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <Text style={{ fontSize: 15, fontWeight: "700", color: THEME.primary }}>{value}</Text>
    </View>
  );
}

// ─── Loading State ────────────────────────────────────────────────────────────

function LoadingState() {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb" }}>
      <ActivityIndicator size="large" color={THEME.primary} />
      <Text style={{ fontSize: 14, color: "#9ca3af", marginTop: 12, fontWeight: "500" }}>
        {t("complaintDetail.loading")}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ComplaintDetail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, error, isLoading, refetch } = useQuery<Complaint>({
    queryKey: ["complaintDetail", id],
    queryFn: async () => {
      const response = await complaintApiClient.get(`/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  if (error) {
    const appError = handleApiError(new Error(t("complaintDetail.error.message")));
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

  const catKey = data.category?.category_name ?? "";
  const catLabel = getCategoryLabel(catKey, data.title);

  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: "#fff",
          paddingHorizontal: 20,
          paddingTop: 56,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: "#f3f4f6",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={22} color={THEME.primary} />
            <Text style={{ fontSize: 16, fontWeight: "700", color: THEME.primary }}>
              {t("complaintDetail.header.back")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => refetch()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: `${THEME.primary}15`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RefreshCw size={17} color={THEME.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      >
        {/* ── Hero Card ── */}
        <View
          style={{
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 20,
            padding: 20,
            marginBottom: 12,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: `${THEME.primary}15`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CategoryIcon categoryKey={catKey} size={28} />
            </View>
          </View>

          <Text
            style={{
              fontSize: 12,
              fontWeight: "800",
              color: THEME.primary,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            {catLabel}
          </Text>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: "#111827",
              marginBottom: 8,
              lineHeight: 30,
            }}
          >
            {data.title}
          </Text>
          {data.description && (
            <Text
              style={{
                fontSize: 14,
                color: "#6b7280",
                lineHeight: 22,
                marginBottom: 12,
                fontWeight: "400",
              }}
            >
              {data.description}
            </Text>
          )}
          <View
            style={{
              backgroundColor: "#f9fafb",
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 5,
              alignSelf: "flex-start",
            }}
          >
            <Text style={{ fontSize: 12, color: "#6b7280", fontWeight: "600" }}>
              {t("complaintDetail.hero.complaintId", {
                id: String(data.id).padStart(5, "0"),
              })}
            </Text>
          </View>
        </View>

        {/* ── Status Timeline ── */}
        <View style={{ marginBottom: 12 }}>
          <StatusTimeline status={data.status} />
        </View>

        {/* ── Details Card ── */}
        <View
          style={{
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 20,
            paddingHorizontal: 16,
            marginBottom: 12,
            shadowColor: "#000",
            shadowOpacity: 0.04,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "800",
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: 1,
              paddingTop: 16,
              paddingBottom: 8,
            }}
          >
            {t("complaintDetail.details.sectionTitle")}
          </Text>

          <InfoRow
            icon={<Calendar size={17} color="#4b5563" />}
            label={t("complaintDetail.details.dateFiled")}
            value={t("complaintDetail.details.dateFiled_value", {
              date: formatDate(data.created_at),
              time: formatTime(data.created_at),
            })}
          />

          {data.barangay && (
            <InfoRow
              icon={<MapPin size={17} color="#4b5563" />}
              label={t("complaintDetail.details.barangay")}
              value={t("complaintDetail.details.barangay_value", {
                name: data.barangay.barangay_name,
                address: data.barangay.barangay_address,
              })}
            />
          )}

          {data.location_details && (
            <InfoRow
              icon={<MapPin size={17} color="#4b5563" />}
              label={t("complaintDetail.details.locationDetails")}
              value={data.location_details}
            />
          )}

          {data.department && (
            <InfoRow
              icon={<Building2 size={17} color="#4b5563" />}
              label={t("complaintDetail.details.assignedDepartment")}
              value={data.department.department_name}
            />
          )}

          {data.priority_level && (
            <InfoRow
              icon={<Tag size={17} color="#4b5563" />}
              label={t("complaintDetail.details.priorityLevel")}
              value={data.priority_level.label}
            />
          )}

          {data.sector && (
            <InfoRow
              icon={<Tag size={17} color="#4b5563" />}
              label={t("complaintDetail.details.sector")}
              value={data.sector.name}
            />
          )}

          <View style={{ paddingBottom: 4 }} />
        </View>

        {/* ── Barangay Contact Card ── */}
        {data.barangay &&
          (data.barangay.barangay_contact_number || data.barangay.barangay_email) && (
            <View
              style={{
                backgroundColor: `${THEME.primary}10`,
                borderWidth: 1,
                borderColor: `${THEME.primary}30`,
                borderRadius: 20,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "800",
                  color: THEME.primary,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 12,
                }}
              >
                {t("complaintDetail.barangayContact.sectionTitle")}
              </Text>

              {data.barangay.barangay_contact_number && (
                <ContactRow
                  icon={<Phone size={16} color={THEME.primary} />}
                  value={data.barangay.barangay_contact_number}
                />
              )}

              {data.barangay.barangay_email && (
                <ContactRow
                  icon={<Mail size={16} color={THEME.primary} />}
                  value={data.barangay.barangay_email}
                />
              )}
            </View>
          )}
      </ScrollView>
    </View>
  );
}