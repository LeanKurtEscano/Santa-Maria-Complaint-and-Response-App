import { complaintApiClient } from "@/lib/client/complaint";
import { handleApiError } from "@/utils/general/errorHandler";
import ErrorScreen from "@/screen/general/ErrorScreen";
import { CategoryIcon } from "@/components/complaint/CategoryIcon";
import { StatusBadge } from "@/components/complaint/StatusBadge";
import { formatDate, formatTime, getCategoryLabel } from "@/constants/complaint/complaint";
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
//  0  submitted
//  1  reviewed_by_barangay
//  2  resolved_by_barangay
//  3  forwarded_to_lgu
//  4  forwarded_to_department
//  5  reviewed_by_department
//  6  resolved_by_department

interface DisplayStage {
  key: string;
  labelKey: string;
  sublabelKey: string;
  group?: "barangay" | "lgu" | "department";
  groupLabelKey?: string;
}

const DISPLAY_STAGES: DisplayStage[] = [
  {
    key: "submitted",
    labelKey: "complaintDetail.timeline.stages.submitted.label",
    sublabelKey: "complaintDetail.timeline.stages.submitted.sublabel",
  },
  {
    key: "reviewed_by_barangay",
    labelKey: "complaintDetail.timeline.stages.reviewed_by_barangay.label",
    sublabelKey: "complaintDetail.timeline.stages.reviewed_by_barangay.sublabel",
    group: "barangay",
    groupLabelKey: "complaintDetail.timeline.groups.barangay",
  },
  {
    key: "resolved_by_barangay",
    labelKey: "complaintDetail.timeline.stages.resolved_by_barangay.label",
    sublabelKey: "complaintDetail.timeline.stages.resolved_by_barangay.sublabel",
    group: "barangay",
  },
  {
    key: "forwarded_to_lgu",
    labelKey: "complaintDetail.timeline.stages.forwarded_to_lgu.label",
    sublabelKey: "complaintDetail.timeline.stages.forwarded_to_lgu.sublabel",
    group: "lgu",
    groupLabelKey: "complaintDetail.timeline.groups.lgu",
  },
  {
    key: "forwarded_to_department",
    labelKey: "complaintDetail.timeline.stages.forwarded_to_department.label",
    sublabelKey: "complaintDetail.timeline.stages.forwarded_to_department.sublabel",
    group: "department",
    groupLabelKey: "complaintDetail.timeline.groups.department",
  },
  {
    key: "reviewed_by_department",
    labelKey: "complaintDetail.timeline.stages.reviewed_by_department.label",
    sublabelKey: "complaintDetail.timeline.stages.reviewed_by_department.sublabel",
    group: "department",
  },
  {
    key: "resolved_by_department",
    labelKey: "complaintDetail.timeline.stages.resolved_by_department.label",
    sublabelKey: "complaintDetail.timeline.stages.resolved_by_department.sublabel",
    group: "department",
  },
];

function statusToStageIndex(status: string): number {
  return DISPLAY_STAGES.findIndex((s) => s.key === status);
}




const GROUP_STYLE = {
  barangay: {
    dotBg:       "#0284c7", // sky-600  — blue family, distinct from "done" green
    dotBgLight:  "#e0f2fe", // sky-100
    lineBg:      "#7dd3fc", // sky-300
    labelColor:  "#0c4a6e", // sky-900
    sublabel:    "#0369a1", // sky-700
    badgeBg:     "#f0f9ff", // sky-50
    badgeText:   "#0284c7",
    headerColor: "#0284c7",
    headerBg:    "#f0f9ff",
  },
  lgu: {
    dotBg:       "#7c3aed", // violet-600
    dotBgLight:  "#ede9fe",
    lineBg:      "#c4b5fd",
    labelColor:  "#4c1d95",
    sublabel:    "#6d28d9",
    badgeBg:     "#f5f3ff",
    badgeText:   "#7c3aed",
    headerColor: "#7c3aed",
    headerBg:    "#f5f3ff",
  },
  department: {
    dotBg:       "#d97706", // amber-600
    dotBgLight:  "#fef3c7",
    lineBg:      "#fcd34d",
    labelColor:  "#78350f",
    sublabel:    "#b45309",
    badgeBg:     "#fffbeb",
    badgeText:   "#d97706",
    headerColor: "#d97706",
    headerBg:    "#fffbeb",
  },
  default: {
    dotBg:       "#2563eb",
    dotBgLight:  "#dbeafe",
    lineBg:      "#93c5fd",
    labelColor:  "#1e3a8a",
    sublabel:    "#2563eb",
    badgeBg:     "#eff6ff",
    badgeText:   "#2563eb",
    headerColor: "#2563eb",
    headerBg:    "#eff6ff",
  },
};
// ─── Status Timeline ──────────────────────────────────────────────────────────

function StatusTimeline({ status }: { status: string | null }) {
  const { t } = useTranslation();
  const raw = status?.toLowerCase() ?? "";
  const isRejected = raw === "rejected";
  const activeIndex = statusToStageIndex(raw);

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
            <Text
              style={{
                fontSize: 17,
                fontWeight: "800",
                color: "#9f1239",
                marginBottom: 4,
              }}
            >
              {t("complaintDetail.timeline.rejected.title")}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#be123c",
                lineHeight: 20,
                fontWeight: "500",
              }}
            >
              {t("complaintDetail.timeline.rejected.description")}
            </Text>
          </View>
        </View>
      </View>
    );
  }

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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 20,
          gap: 10,
        }}
      >
        <View
          style={{
            width: 6,
            height: 22,
            borderRadius: 3,
            backgroundColor: "#2563eb",
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

      {DISPLAY_STAGES.map((stage, i) => {
        const isCompleted = activeIndex > i;
        const isActive = activeIndex === i;
        const grp = stage.group ? GROUP_STYLE[stage.group] : GROUP_STYLE.default;

        const dotBg = isCompleted || isActive ? grp.dotBg : "#e5e7eb";
        const lineBg = isCompleted ? grp.lineBg : "#e5e7eb";

        return (
          <View key={stage.key}>
            {/* ── Group header ── */}
            {stage.groupLabelKey && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginLeft: 44,
                  marginBottom: 10,
                  marginTop: 6,
                  gap: 8,
                }}
              >
                <View
                  style={{
                    backgroundColor: grp.headerBg,
                    borderRadius: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "800",
                      color: grp.headerColor,
                      letterSpacing: 1.1,
                      textTransform: "uppercase",
                    }}
                  >
                    {t(stage.groupLabelKey)}
                  </Text>
                </View>
                <View style={{ flex: 1, height: 1, backgroundColor: "#f3f4f6" }} />
              </View>
            )}

            <View style={{ flexDirection: "row" }}>
              {/* ── Dot + connector ── */}
              <View
                style={{ alignItems: "center", marginRight: 14, width: 36 }}
              >
                {/* Dot */}
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: dotBg,
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                    // Active ring
                    ...(isActive && {
                      shadowColor: grp.dotBg,
                      shadowOpacity: 0.45,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 0 },
                    }),
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={18} color="#fff" />
                  ) : isActive ? (
                    <Clock size={17} color="#fff" />
                  ) : (
                    <Circle size={13} color="#9ca3af" />
                  )}
                </View>

                {/* Connector line */}
                {i < DISPLAY_STAGES.length - 1 && (
                  <View
                    style={{
                      width: 3,
                      borderRadius: 2,
                      flex: 1,
                      minHeight: 28,
                      marginVertical: 3,
                      backgroundColor: lineBg,
                    }}
                  />
                )}
              </View>

              {/* ── Text ── */}
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
                        ? grp.labelColor
                        : isCompleted
                        ? "#374151"
                        : "#9ca3af",
                    }}
                  >
                    {t(stage.labelKey)}
                  </Text>

                  {isActive && (
                    <View
                      style={{
                        backgroundColor: grp.badgeBg,
                        borderRadius: 20,
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                        borderWidth: 1,
                        borderColor: grp.dotBg + "40",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: grp.badgeText,
                          textTransform: "uppercase",
                          letterSpacing: 0.8,
                        }}
                      >
                        {t("complaintDetail.timeline.badge.current")}
                      </Text>
                    </View>
                  )}

                  {isCompleted && (
                    <View
                      style={{
                        backgroundColor: "#f0fdf4",
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
                        {t("complaintDetail.timeline.badge.done")}
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
                      ? grp.sublabel
                      : isCompleted
                      ? "#6b7280"
                      : "#d1d5db",
                  }}
                >
                  {t(stage.sublabelKey)}
                </Text>
              </View>
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
        <Text
          style={{ fontSize: 15, fontWeight: "600", color: "#1f2937", lineHeight: 21 }}
        >
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
          backgroundColor: "#dbeafe",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <Text style={{ fontSize: 15, fontWeight: "700", color: "#1e40af" }}>{value}</Text>
    </View>
  );
}

// ─── Loading State ────────────────────────────────────────────────────────────

function LoadingState() {
  const { t } = useTranslation();
  return (
    <View
      style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb" }}
    >
      <ActivityIndicator size="large" color="#2563eb" />
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
            <ArrowLeft size={22} color="#2563eb" />
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#2563eb" }}>
              {t("complaintDetail.header.back")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => refetch()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: "#eff6ff",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RefreshCw size={17} color="#2563eb" />
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
                backgroundColor: "#eff6ff",
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
              color: "#2563eb",
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
                backgroundColor: "#eff6ff",
                borderWidth: 1,
                borderColor: "#bfdbfe",
                borderRadius: 20,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "800",
                  color: "#3b82f6",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 12,
                }}
              >
                {t("complaintDetail.barangayContact.sectionTitle")}
              </Text>

              {data.barangay.barangay_contact_number && (
                <ContactRow
                  icon={<Phone size={16} color="#2563eb" />}
                  value={data.barangay.barangay_contact_number}
                />
              )}

              {data.barangay.barangay_email && (
                <ContactRow
                  icon={<Mail size={16} color="#2563eb" />}
                  value={data.barangay.barangay_email}
                />
              )}
            </View>
          )}
      </ScrollView>
    </View>
  );
}