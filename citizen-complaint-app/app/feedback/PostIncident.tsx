import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Star,
  Send,
  CheckCircle2,
  ListChecks,
  PartyPopper,
} from "lucide-react-native";
import { THEME } from "@/constants/theme";
import { feedbackApiClient } from "@/lib/client/feedback";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STAR_ON = "#f59e0b";
const STAR_OFF = "#e5e7eb";

function getRatingLabel(rating: number, t: (k: string) => string) {
  if (rating === 0) return "";
  const keys = ["", "terrible", "bad", "okay", "good", "excellent"];
  return t(`postIncidentFeedback.ratingLabels.${keys[rating]}`);
}

function getRatingColor(rating: number) {
  if (rating <= 1) return "#ef4444";
  if (rating === 2) return "#f97316";
  if (rating === 3) return "#f59e0b";
  if (rating === 4) return "#10b981";
  return "#059669";
}

function Stars({
  value,
  onChange,
  size = 44,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  return (
    <View style={s.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => {
        const icon = (
          <Star
            size={size}
            color={star <= value ? STAR_ON : STAR_OFF}
            fill={star <= value ? STAR_ON : "transparent"}
            strokeWidth={1.8}
          />
        );
        return onChange ? (
          <TouchableOpacity
            key={star}
            onPress={() => onChange(star)}
            activeOpacity={0.7}
          >
            {icon}
          </TouchableOpacity>
        ) : (
          <View key={star}>{icon}</View>
        );
      })}
    </View>
  );
}

// ─── Success State ────────────────────────────────────────────────────────────

function SuccessState({
  rating,
  onGoBack,
  onViewComplaints,
  t,
}: {
  rating: number;
  onGoBack: () => void;
  onViewComplaints: () => void;
  t: (k: string) => string;
}) {
  return (
    <ScrollView
      contentContainerStyle={s.successContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[s.card, { alignItems: "center", padding: 32 }]}>
        <View style={s.successCircle}>
          <PartyPopper size={40} color="#10b981" strokeWidth={2} />
        </View>
        <Text style={s.successTitle}>
          {t("postIncidentFeedback.success.title")}
        </Text>
        <Text style={s.successMessage}>
          {t("postIncidentFeedback.success.message")}
        </Text>
        <Stars value={rating} size={28} />
        <Text
          style={[
            s.ratingLabel,
            { color: getRatingColor(rating), marginTop: 10 },
          ]}
        >
          {getRatingLabel(rating, t)}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onViewComplaints}
        style={[s.primaryBtn, { marginBottom: 12 }]}
        activeOpacity={0.85}
      >
        <ListChecks size={20} color="#fff" strokeWidth={2.5} />
        <Text style={s.primaryBtnText}>
          {t("postIncidentFeedback.success.viewComplaints")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onGoBack}
        style={s.secondaryBtn}
        activeOpacity={0.7}
      >
        <Text style={s.secondaryBtnText}>
          {t("postIncidentFeedback.success.goBack")}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PostIncidentFeedbackScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { incidentId, complaintTitle } = useLocalSearchParams<{
    incidentId: string;
    complaintTitle: string;
  }>();

  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedRating, setSubmittedRating] = useState(0);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      await feedbackApiClient.post(`/post-incident`, {
        ratings: rating,
        message: message || null,
        complaint_id: Number(incidentId),
      });
    },
    onSuccess: () => {
      setSubmittedRating(rating);
      setSubmitted(true);
      queryClient.invalidateQueries({
        queryKey: ["complaintDetail", incidentId],
      });
    },
    onError: () => {
      Alert.alert(
        t("postIncidentFeedback.errorTitle"),
        t("postIncidentFeedback.errorMessage")
      );
    },
  });

  const canSubmit = rating > 0 && !isPending;

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backBtn}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color="#374151" strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>
            {submitted
              ? t("postIncidentFeedback.success.headerTitle")
              : t("postIncidentFeedback.title")}
          </Text>
          {!submitted && complaintTitle ? (
            <Text style={s.headerSub} numberOfLines={1}>
              {complaintTitle}
            </Text>
          ) : null}
        </View>
      </View>

      {submitted ? (
        <SuccessState
          rating={submittedRating}
          onGoBack={() => router.back()}
          onViewComplaints={() => router.replace("/complaints/UserComplaints")}
          t={t}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Resolved banner */}
          <View style={s.resolvedCard}>
            <View style={s.resolvedBadge}>
              <CheckCircle2 size={16} color="#fff" strokeWidth={2.5} />
              <Text style={s.resolvedBadgeText}>
                {t("postIncidentFeedback.resolvedBadge")}
              </Text>
            </View>
            <Text style={s.resolvedHeading}>
              {t("postIncidentFeedback.heading")}
            </Text>
            <Text style={s.resolvedSub}>
              {t("postIncidentFeedback.subheading")}
            </Text>
          </View>

          {/* Rating */}
          <View style={[s.card, { padding: 24 }]}>
            <Text style={s.cardLabel}>
              {t("postIncidentFeedback.ratingPrompt")}
            </Text>
            <Stars value={rating} onChange={setRating} />
            <Text
              style={[
                s.ratingLabel,
                { color: getRatingColor(rating), minHeight: 22 },
              ]}
            >
              {getRatingLabel(rating, t)}
            </Text>
          </View>

          {/* Comment */}
          <View style={[s.card, { padding: 18, marginBottom: 24 }]}>
            <Text style={[s.cardLabel, { textAlign: "left" }]}>
              {t("postIncidentFeedback.commentLabel")}
            </Text>
            <TextInput
              value={message}
              onChangeText={(v) => setMessage(v.slice(0, 500))}
              placeholder={t("postIncidentFeedback.commentPlaceholder")}
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={500}
              style={s.input}
            />
            <Text
              style={[
                s.counter,
                { color: message.length >= 450 ? "#f97316" : "#9ca3af" },
              ]}
            >
              {message.length}/500
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={() => canSubmit && mutate()}
            disabled={!canSubmit}
            style={[
              s.primaryBtn,
              !canSubmit && { backgroundColor: "#e5e7eb" },
            ]}
            activeOpacity={0.85}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Send
                  size={18}
                  color={canSubmit ? "#fff" : "#9ca3af"}
                  strokeWidth={2.5}
                />
                <Text
                  style={[
                    s.primaryBtnText,
                    !canSubmit && { color: "#9ca3af" },
                  ]}
                >
                  {t("postIncidentFeedback.submit")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f9fafb" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },
  headerSub: { fontSize: 13, color: "#9ca3af", marginTop: 2 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
    marginBottom: 18,
  },

  resolvedCard: {
    backgroundColor: "#ecfdf5",
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    alignItems: "center",
  },
  resolvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 14,
  },
  resolvedBadgeText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  resolvedHeading: {
    fontSize: 20,
    fontWeight: "800",
    color: "#065f46",
    textAlign: "center",
    marginBottom: 8,
  },
  resolvedSub: {
    fontSize: 15,
    color: "#047857",
    textAlign: "center",
    lineHeight: 22,
  },

  starsRow: { flexDirection: "row", gap: 10, justifyContent: "center" },
  ratingLabel: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 14,
  },

  input: {
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: "#1f2937",
    lineHeight: 22,
    minHeight: 120,
  },
  counter: { fontSize: 13, textAlign: "right", marginTop: 6 },

  primaryBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  secondaryBtnText: { fontSize: 16, fontWeight: "700", color: "#374151" },

  successContent: {
    padding: 16,
    paddingBottom: 48,
    flexGrow: 1,
    justifyContent: "center",
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 23,
    marginBottom: 24,
  },
});