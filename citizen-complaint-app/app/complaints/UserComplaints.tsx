import { complaintApiClient } from "@/lib/client/complaint";
import { ErrorScreen } from "@/screen/general/ErrorScreen";
import { handleApiError } from "@/utils/general/errorHandler";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Droplets,
  Filter,
  Flame,
  MapPin,
  Megaphone,
  PawPrint,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
  Waves,
  Wine,
  Wrench,
  XCircle,
  Zap,
  HardHat,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BarangayInfo {
  id: number;
  barangay_name: string;
  barangay_address: string;
}

interface CategoryInfo {
  id: number;
  category_name: string;
}

interface DepartmentInfo {
  id: number;
  department_name: string;
  description: string | null;
}

interface Complaint {
  id: number;
  title: string;
  description: string | null;
  location_details: string | null;
  status: string | null;
  created_at: string;
  barangay: BarangayInfo | null;
  category: CategoryInfo | null;
  department?: DepartmentInfo | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; badge: string; text: string; dot: string }> = {
  submitted: { label: "Submitted", badge: "bg-blue-50",    text: "text-blue-700",   dot: "bg-blue-500"    },
  forwarded: { label: "Forwarded", badge: "bg-amber-50",   text: "text-amber-700",  dot: "bg-amber-500"   },
  resolved:  { label: "Resolved",  badge: "bg-emerald-50", text: "text-emerald-700",dot: "bg-emerald-500" },
  rejected:  { label: "Rejected",  badge: "bg-red-50",     text: "text-red-700",    dot: "bg-red-500"     },
  pending:   { label: "Pending",   badge: "bg-purple-50",  text: "text-purple-700", dot: "bg-purple-500"  },
};

const CATEGORY_LABELS: Record<string, string> = {
  noise_disturbance:    "Noise Disturbance",
  illegal_dumping:      "Illegal Dumping",
  road_damage:          "Road Damage",
  street_light_outage:  "Street Light Outage",
  flooding:             "Flooding",
  illegal_construction: "Illegal Construction",
  stray_animals:        "Stray Animals",
  public_intoxication:  "Public Intoxication",
  illegal_vending:      "Illegal Vending",
  water_supply_issue:   "Water Supply Issue",
  garbage_collection:   "Garbage Collection",
  vandalism:            "Vandalism",
  other:                "Other",
};

const ALL_STATUSES = ["submitted", "forwarded", "resolved", "rejected", "pending"];

// ─── Category Icon ────────────────────────────────────────────────────────────

function CategoryIcon({ categoryKey, size = 18, color = "#2563eb" }: {
  categoryKey: string;
  size?: number;
  color?: string;
}) {
  const props = { size, color, strokeWidth: 2 };
  switch (categoryKey) {
    case "noise_disturbance":    return <Megaphone {...props} />;
    case "illegal_dumping":      return <Trash2 {...props} />;
    case "road_damage":          return <Wrench {...props} />;
    case "street_light_outage":  return <Zap {...props} />;
    case "flooding":             return <Waves {...props} />;
    case "illegal_construction": return <HardHat {...props} />;
    case "stray_animals":        return <PawPrint {...props} />;
    case "public_intoxication":  return <Wine {...props} />;
    case "illegal_vending":      return <ShoppingCart {...props} />;
    case "water_supply_issue":   return <Droplets {...props} />;
    case "garbage_collection":   return <Truck {...props} />;
    case "vandalism":            return <Flame {...props} />;
    default:                     return <AlertCircle {...props} />;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PH", {
    hour: "2-digit", minute: "2-digit",
  });
}

function getStatusConfig(status: string | null) {
  return STATUS_CONFIG[status?.toLowerCase() ?? ""] ?? {
    label: status ?? "Unknown",
    badge: "bg-gray-50",
    text: "text-gray-700",
    dot: "bg-gray-400",
  };
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
  const cfg = getStatusConfig(status);
  return (
    <View className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-full ${cfg.badge}`}>
      <View className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      <Text className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</Text>
    </View>
  );
}

// ─── Complaint Card ───────────────────────────────────────────────────────────

function ComplaintCard({ complaint, onPress }: { complaint: Complaint; onPress: () => void }) {
  const catKey = complaint.category?.category_name ?? "";
  const catLabel = CATEGORY_LABELS[catKey] ?? complaint.title;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white border border-gray-100 rounded-2xl p-4 mb-3 shadow-sm"
    >
      <View className="flex-row items-start gap-3">
        {/* Icon */}
        <View className="w-11 h-11 rounded-xl bg-blue-50 items-center justify-center flex-shrink-0">
          <CategoryIcon categoryKey={catKey} size={20} color="#2563eb" />
        </View>

        {/* Content */}
        <View className="flex-1">
          {/* Category + Status */}
          <View className="flex-row items-center justify-between mb-1 gap-2">
            <Text className="text-xs font-semibold text-blue-600 uppercase tracking-wide flex-1" numberOfLines={1}>
              {catLabel}
            </Text>
            <StatusBadge status={complaint.status} />
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
            #{String(complaint.id).padStart(5, "0")}
          </Text>
        </View>

        <ChevronRight size={16} color="#d1d5db" style={{ marginTop: 2 }} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <View className="w-16 h-16 rounded-2xl bg-blue-50 items-center justify-center mb-4">
        <AlertCircle size={28} color="#3b82f6" />
      </View>
      <Text className="text-base font-bold text-gray-800 mb-1">
        {filtered ? "No results found" : "No complaints yet"}
      </Text>
      <Text className="text-sm text-gray-400 text-center px-8">
        {filtered
          ? "Try adjusting your filters or search terms."
          : "You haven't submitted any complaints yet."}
      </Text>
    </View>
  );
}

// ─── Loading State ────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color="#2563eb" />
      <Text className="text-sm text-gray-400 mt-3">Loading your complaints...</Text>
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
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable className="flex-1 bg-black/30" onPress={onClose} />
      <View className="bg-white rounded-t-3xl px-5 pt-5 pb-10">
        <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-5" />

        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-lg font-bold text-gray-900">Filter by Status</Text>
          <TouchableOpacity onPress={onClear}>
            <Text className="text-sm font-semibold text-blue-600">Clear all</Text>
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
                className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${
                  active ? "border-blue-500 bg-white" : "border-gray-200 bg-white"
                }`}
              >
                <View className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <Text className={`text-sm font-semibold ${active ? "text-gray-900" : "text-gray-600"}`}>
                  {cfg.label}
                </Text>
                {active && <CheckCircle2 size={14} color="#2563eb" />}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={onClose}
          className="bg-blue-600 py-3.5 rounded-xl items-center"
        >
          <Text className="text-white font-bold text-base">Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function UserComplaints() {
  const router = useRouter();
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
    const appError = handleApiError(new Error("Failed to load complaints"));
    return (
      <ErrorScreen
        type={appError.type}
        title="Unable to Retrieve Complaints"
        onRetry={refetch}
      />
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        {/* Back button row */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center gap-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={24} color="#2563eb" />
            <Text className="text-base font-bold text-blue-600">Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRefresh}
            className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center"
          >
            <RefreshCw size={16} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View className="mb-4">
          <Text className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-0.5">
            Santa Maria, Laguna
          </Text>
          <Text className="text-2xl font-bold text-gray-900">My Complaints</Text>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100 mb-3">
          <Search size={16} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-sm text-gray-800"
            placeholder="Search complaints..."
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
            className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
              activeFilterCount > 0 ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
            }`}
          >
            <Filter size={13} color={activeFilterCount > 0 ? "#2563eb" : "#6b7280"} />
            <Text className={`text-xs font-semibold ${activeFilterCount > 0 ? "text-blue-700" : "text-gray-600"}`}>
              Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Text>
          </TouchableOpacity>

          {data && (
            <Text className="text-xs text-gray-400">
              {filtered.length} of {data.length} complaint{data.length !== 1 ? "s" : ""}
            </Text>
          )}
        </View>

        {/* Active Filter Pills — shown below filter row */}
        {selectedStatuses.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
            {selectedStatuses.map((s) => {
              const cfg = getStatusConfig(s);
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => toggleStatus(s)}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 4,
                    paddingHorizontal: 8, paddingVertical: 3,
                    borderRadius: 20, alignSelf: "flex-start",
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
              onPress={() => {
                // router.push(`/complaint/${item.id}`)
              }}
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