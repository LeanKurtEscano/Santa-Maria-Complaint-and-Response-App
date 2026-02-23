import { complaintApiClient } from "@/lib/client/complaint";
import { handleApiError } from "@/utils/general/errorHandler";
import ErrorScreen from "@/screen/general/ErrorScreen";
import { CategoryIcon } from "@/components/complaint/CategoryIcon";
import { StatusBadge } from "@/components/complaint/StatusBadge";
import {
  formatDate,
  formatTime,
  getCategoryLabel,
  getStatusConfig,
} from "@/constants/complaint/complaint";
import { Complaint } from "@/types/complaints/complaint";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Tag,
} from "lucide-react-native";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";



const STATUS_STEPS = ["submitted", "forwarded", "resolved"] as const;

function StatusTimeline({ status }: { status: string | null }) {
  const current = status?.toLowerCase() ?? "";
  const isRejected = current === "rejected";

  if (isRejected) {
    return (
      <View className="bg-red-50 border border-red-100 rounded-2xl p-4">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-full bg-red-100 items-center justify-center">
            <AlertCircle size={16} color="#ef4444" />
          </View>
          <View>
            <Text className="text-sm font-bold text-red-700">Complaint Rejected</Text>
            <Text className="text-xs text-red-400 mt-0.5">
              This complaint has been reviewed and rejected.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white border border-gray-100 rounded-2xl p-4">
      <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
        Progress
      </Text>
      <View className="flex-row items-center justify-between">
        {STATUS_STEPS.map((step, i) => {
          const stepIndex = STATUS_STEPS.indexOf(step);
          const currentIndex = STATUS_STEPS.indexOf(current as typeof STATUS_STEPS[number]);
          const isCompleted = currentIndex >= stepIndex;
          const isActive = current === step;
          const cfg = getStatusConfig(step);

          return (
            <View key={step} className="flex-1 items-center">
              {/* Connector line */}
              {i > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: 14,
                    right: "50%",
                    left: "-50%",
                    height: 2,
                  }}
                  className={isCompleted ? "bg-blue-500" : "bg-gray-200"}
                />
              )}

              {/* Step dot */}
              <View
                className={`w-7 h-7 rounded-full items-center justify-center z-10 ${
                  isCompleted ? "bg-blue-500" : "bg-gray-100"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 size={14} color="#fff" />
                ) : (
                  <View className="w-2 h-2 rounded-full bg-gray-300" />
                )}
              </View>

              {/* Label */}
              <Text
                className={`text-xs font-semibold mt-1.5 text-center ${
                  isActive ? "text-blue-600" : isCompleted ? "text-gray-700" : "text-gray-400"
                }`}
              >
                {cfg.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

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
    <View className="flex-row items-start gap-3 py-3 border-b border-gray-50">
      <View className="w-8 h-8 rounded-lg bg-gray-50 items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
          {label}
        </Text>
        <Text className="text-sm font-medium text-gray-800 leading-5">{value}</Text>
      </View>
    </View>
  );
}

// ─── Loading State ────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <ActivityIndicator size="large" color="#2563eb" />
      <Text className="text-sm text-gray-400 mt-3">Loading complaint details...</Text>
    </View>
  );
}


export default function ComplaintDetail() {
  const router = useRouter();
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
    const appError = handleApiError(new Error("Failed to fetch complaint details"));
    return (
      <ErrorScreen
        type={appError.type}
        title="Unable to Retrieve Complaint Details"
        onRetry={refetch}
      />
    );
  }

  if (isLoading) return <LoadingState />;
  if (!data) return null;

  const catKey = data.category?.category_name ?? "";
  const catLabel = getCategoryLabel(catKey, data.title);
  const statusCfg = getStatusConfig(data.status);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center gap-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={22} color="#2563eb" />
            <Text className="text-base font-bold text-blue-600">Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => refetch()}
            className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center"
          >
            <RefreshCw size={16} color="#2563eb" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Hero Card */}
        <View className="bg-white border border-gray-100 rounded-2xl p-5 mb-3 shadow-sm">
          {/* Icon + Status */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="w-14 h-14 rounded-2xl bg-blue-50 items-center justify-center">
              <CategoryIcon categoryKey={catKey} size={26} />
            </View>
            <StatusBadge status={data.status} withBorder />
          </View>

          {/* Category label */}
          <Text className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">
            {catLabel}
          </Text>

          {/* Title */}
          <Text className="text-xl font-bold text-gray-900 mb-2 leading-7">
            {data.title}
          </Text>

          {/* Description */}
          {data.description && (
            <Text className="text-sm text-gray-500 leading-5 mb-3">{data.description}</Text>
          )}

          {/* Complaint ID */}
          <Text className="text-xs text-gray-300 font-medium">
            Complaint #{String(data.id).padStart(5, "0")}
          </Text>
        </View>

        {/* Status Timeline */}
        <View className="mb-3">
          <StatusTimeline status={data.status} />
        </View>

        {/* Details Card */}
        <View className="bg-white border border-gray-100 rounded-2xl px-4 mb-3 shadow-sm">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-4 pb-2">
            Details
          </Text>

          <InfoRow
            icon={<Calendar size={15} color="#6b7280" />}
            label="Date Filed"
            value={`${formatDate(data.created_at)} at ${formatTime(data.created_at)}`}
          />

          {data.barangay && (
            <InfoRow
              icon={<MapPin size={15} color="#6b7280" />}
              label="Barangay"
              value={`${data.barangay.barangay_name} — ${data.barangay.barangay_address}`}
            />
          )}

          {data.location_details && (
            <InfoRow
              icon={<MapPin size={15} color="#6b7280" />}
              label="Location Details"
              value={data.location_details}
            />
          )}

          {data.department && (
            <InfoRow
              icon={<Building2 size={15} color="#6b7280" />}
              label="Assigned Department"
              value={data.department.department_name}
            />
          )}

          {data.priority_level && (
            <InfoRow
              icon={<Tag size={15} color="#6b7280" />}
              label="Priority Level"
              value={data.priority_level.label}
            />
          )}

          {data.sector && (
            <InfoRow
              icon={<Tag size={15} color="#6b7280" />}
              label="Sector"
              value={data.sector.name}
            />
          )}

          <View className="pb-1" />
        </View>

        {/* Barangay Contact Card */}
        {data.barangay &&
          (data.barangay.barangay_contact_number || data.barangay.barangay_email) && (
            <View className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-3">
              <Text className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">
                Barangay Contact
              </Text>
              {data.barangay.barangay_contact_number && (
                <Text className="text-sm font-semibold text-blue-800 mb-1">
                  📞 {data.barangay.barangay_contact_number}
                </Text>
              )}
              {data.barangay.barangay_email && (
                <Text className="text-sm font-semibold text-blue-800">
                  ✉️ {data.barangay.barangay_email}
                </Text>
              )}
            </View>
          )}
      </ScrollView>
    </View>
  );
}