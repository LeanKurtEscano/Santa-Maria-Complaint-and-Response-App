import { complaintApiClient } from "@/lib/client/complaint";
import { ErrorScreen } from "@/screen/general/ErrorScreen";
import { handleApiError } from "@/utils/general/errorHandler";
import { CategoryIcon } from "@/components/complaint/CategoryIcon";
import { StatusBadge } from "@/components/complaint/StatusBadge";
import {
  ALL_STATUSES,
  CATEGORY_LABELS,
  formatDate,
  formatTime,
  getCategoryLabel,
  getStatusConfig,
} from "@/constants/complaint/complaint";
import { THEME } from '@/constants/theme';
import { Complaint } from "@/types/complaints/complaint";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


function ComplaintCard({ complaint, onPress }: { complaint: Complaint; onPress: () => void }) {
  const { t } = useTranslation();
  const catKey = complaint.category?.category_name ?? "";
  const catLabel = getCategoryLabel(catKey, complaint.title);
 
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white border border-gray-100 rounded-2xl p-4 mb-3 shadow-sm"
    >
      <View className="flex-row items-start gap-3">
        {/* Icon */}
        <View
          className="w-11 h-11 rounded-xl items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${THEME.primary}15` }}
        >
          <CategoryIcon categoryKey={catKey} size={20} />
        </View>

        {/* Content */}
        <View className="flex-1">
          {/* Category + Status */}
          <View className="flex-row items-center justify-between mb-1 gap-2">
            <Text
              className="text-xs font-semibold uppercase tracking-wide flex-1"
              style={{ color: THEME.primary }}
              numberOfLines={1}
            >
              {catLabel}
            </Text>
            <StatusBadge 
  status={complaint.status} 
  is_rejected_by_lgu={complaint.is_rejected_by_lgu}
  is_rejected_by_department={complaint.is_rejected_by_department}
/>
          </View>

          {/* Title */}
          <Text className="text-sm font-bold text-gray-900 mb-1" numberOfLines={1}>
            {complaint.title}
          </Text>

          {/* Description */}
          {complaint.description && (
            <Text className="text-xs text-gray-500 mb-2 leading-4" numberOfLines={2}>
              {complaint.description}
            </Text>
          )}

          {/* Meta */}
          <View className="flex-row items-center gap-3 flex-wrap">
            {complaint.barangay && (
              <View className="flex-row items-center gap-1">
                <MapPin size={11} color="#9ca3af" />
                <Text className="text-xs text-gray-400">{complaint.barangay.barangay_name}</Text>
              </View>
            )}
            <View className="flex-row items-center gap-1">
              <Clock size={11} color="#9ca3af" />
              <Text className="text-xs text-gray-400">
                {formatDate(complaint.created_at)} · {formatTime(complaint.created_at)}
              </Text>
            </View>
            {complaint.department && (
              <View className="flex-row items-center gap-1">
                <Building2 size={11} color="#9ca3af" />
                <Text className="text-xs text-gray-400" numberOfLines={1}>
                  {complaint.department.department_name}
                </Text>
              </View>
            )}
          </View>

          {/* ID */}
          <Text className="text-xs text-gray-300 mt-1.5">
            {t("complaints.card.id", { id: String(complaint.id).padStart(5, "0") })}
          </Text>
        </View>

        <ChevronRight size={16} color="#d1d5db" style={{ marginTop: 2 }} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center py-20">
      <View
        className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
        style={{ backgroundColor: `${THEME.primary}15` }}
      >
        <AlertCircle size={28} color={THEME.primary} />
      </View>
      <Text className="text-base font-bold text-gray-800 mb-1">
        {filtered
          ? t("complaints.empty.noResults.title")
          : t("complaints.empty.noComplaints.title")}
      </Text>
      <Text className="text-sm text-gray-400 text-center px-8">
        {filtered
          ? t("complaints.empty.noResults.description")
          : t("complaints.empty.noComplaints.description")}
      </Text>
    </View>
  );
}

// ─── Loading State ────────────────────────────────────────────────────────────

function LoadingState() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color={THEME.primary} />
      <Text className="text-sm text-gray-400 mt-3">{t("complaints.loading")}</Text>
    </View>
  );
}

// ─── Filter Modal ─────────────────────────────────────────────────────────────

function FilterModal({
  visible,
  onClose,
  selectedStatuses,
  onToggleStatus,
  onClear,
}: {
  visible: boolean;
  onClose: () => void;
  selectedStatuses: string[];
  onToggleStatus: (s: string) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable className="flex-1 bg-black/30" onPress={onClose} />
      <View className="bg-white rounded-t-3xl px-5 pt-5 pb-10">
        <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-5" />

        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-lg font-bold text-gray-900">
            {t("complaints.filter.title")}
          </Text>
          <TouchableOpacity onPress={onClear}>
            <Text className="text-sm font-semibold" style={{ color: THEME.primary }}>
              {t("complaints.filter.clearAll")}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row flex-wrap gap-2 mb-6">
          {ALL_STATUSES.map((s) => {
            const cfg = getStatusConfig(s);
            const active = selectedStatuses.includes(s);
            return (
              <TouchableOpacity
                key={s}
                onPress={() => onToggleStatus(s)}
                className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl border bg-white"
                style={{ borderColor: active ? THEME.primary : "#e5e7eb" }}
              >
                <View className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <Text
                  className="text-sm font-semibold"
                  style={{ color: active ? "#111827" : "#4b5563" }}
                >
                  {cfg.label}
                </Text>
                {active && <CheckCircle2 size={14} color={THEME.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={onClose}
          className="py-3.5 rounded-xl items-center"
          style={{ backgroundColor: THEME.primary }}
        >
          <Text className="font-bold text-base" style={{ color: "#ffffff" }}>
            {t("complaints.filter.apply")}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function UserComplaints() {
  const router = useRouter();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);

  const { data, isPending, error, refetch } = useQuery<Complaint[]>({
    queryKey: ["my-complaints"],
    queryFn: async () => {
      const response = await complaintApiClient.get("/my-complaints");
      return response.data;
    },
  });

  console.log("Fetched complaints:", data);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const toggleStatus = (s: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((c) => {
      const matchSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase()) ||
        c.category?.category_name.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        selectedStatuses.length === 0 ||
        selectedStatuses.includes(c.status?.toLowerCase() ?? "");
      return matchSearch && matchStatus;
    });
  }, [data, search, selectedStatuses]);

  const activeFilterCount = selectedStatuses.length;
  const isFiltered = search.length > 0 || activeFilterCount > 0;

  if (error) {
    const appError = handleApiError(new Error(t("complaints.error.message")));
    return (
      <ErrorScreen
        type={appError.type}
        title={t("complaints.error.title")}
        onRetry={refetch}
      />
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        {/* Back + Refresh */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center gap-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={24} color={THEME.primary} />
            <Text className="text-base font-bold" style={{ color: THEME.primary }}>
              {t("complaints.header.back")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRefresh}
            className="w-9 h-9 rounded-xl items-center justify-center"
            style={{ backgroundColor: `${THEME.primary}15` }}
          >
            <RefreshCw size={16} color={THEME.primary} />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View className="mb-4">
          <Text
            className="text-xs font-semibold uppercase tracking-widest mb-0.5"
            style={{ color: THEME.primary }}
          >
            {t("complaints.header.location")}
          </Text>
          <Text className="text-2xl font-bold text-gray-900">
            {t("complaints.header.title")}
          </Text>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100 mb-3">
          <Search size={16} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-sm text-gray-800"
            placeholder={t("complaints.search.placeholder")}
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <XCircle size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Row */}
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity
            onPress={() => setFilterVisible(true)}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg border"
            style={{
              borderColor: activeFilterCount > 0 ? THEME.primary : "#e5e7eb",
              backgroundColor: activeFilterCount > 0 ? `${THEME.primary}15` : "#ffffff",
            }}
          >
            <Filter size={13} color={activeFilterCount > 0 ? THEME.primary : "#6b7280"} />
            <Text
              className="text-xs font-semibold"
              style={{ color: activeFilterCount > 0 ? THEME.primary : "#4b5563" }}
            >
              {activeFilterCount > 0 ? `Filter (${activeFilterCount})` : "Filter"}
            </Text>
          </TouchableOpacity>

          {data && (
            <Text className="text-xs text-gray-400">
              {t(
                data.length !== 1
                  ? "complaints.count_plural"
                  : "complaints.count",
                { filtered: filtered.length, total: data.length }
              )}
            </Text>
          )}
        </View>

        {/* Active Filter Pills */}
        {selectedStatuses.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
            {selectedStatuses.map((s) => {
              const cfg = getStatusConfig(s);
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => toggleStatus(s)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 20,
                    alignSelf: "flex-start",
                  }}
                  className={cfg.badge}
                >
                  <View className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  <Text className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</Text>
                  <XCircle size={10} color="#9ca3af" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Content */}
      {isPending ? (
        <LoadingState />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={<EmptyState filtered={isFiltered} />}
          renderItem={({ item }) => (
            <ComplaintCard
              complaint={item}
              onPress={() => router.push(`/complaints/${item.id}`)}
            />
          )}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        selectedStatuses={selectedStatuses}
        onToggleStatus={toggleStatus}
        onClear={() => setSelectedStatuses([])}
      />
    </View>
  );
}