import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import {
  ChevronLeft,
  Star,
  MessageSquare,
  Send,
  CheckCircle2,
  ListChecks,
} from "lucide-react-native";
import { THEME } from "@/constants/theme";
import { feedbackApiClient } from "@/lib/client/feedback";

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 10, justifyContent: "center" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onChange(star)}
          activeOpacity={0.7}
        >
          <Star
            size={44}
            color={star <= value ? "#f59e0b" : "#e5e7eb"}
            fill={star <= value ? "#f59e0b" : "transparent"}
            strokeWidth={1.8}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Rating helpers ───────────────────────────────────────────────────────────

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
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 48,
        flexGrow: 1,
        justifyContent: "center",
      }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 24,
          padding: 32,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: "#f3f4f6",
          alignItems: "center",
        }}
      >
        {/* Checkmark circle */}
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: "#ecfdf5",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <CheckCircle2 size={44} color="#10b981" strokeWidth={2} />
        </View>

        <Text
          style={{
            fontSize: 22,
            fontWeight: "800",
            color: "#111827",
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          {t("postIncidentFeedback.success.title")}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: "#6b7280",
            textAlign: "center",
            lineHeight: 23,
            marginBottom: 24,
          }}
        >
          {t("postIncidentFeedback.success.message")}
        </Text>

        {/* Stars recap */}
        <View
          style={{
            flexDirection: "row",
            gap: 6,
            marginBottom: 8,
          }}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={28}
              color={star <= rating ? "#f59e0b" : "#e5e7eb"}
              fill={star <= rating ? "#f59e0b" : "transparent"}
              strokeWidth={1.8}
            />
          ))}
        </View>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: getRatingColor(rating),
          }}
        >
          {getRatingLabel(rating, t)}
        </Text>
      </View>

      {/* Actions */}
      <TouchableOpacity
        onPress={onViewComplaints}
        style={{
          backgroundColor: THEME.primary,
          borderRadius: 18,
          paddingVertical: 17,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 10,
          marginBottom: 12,
        }}
        activeOpacity={0.85}
      >
        <ListChecks size={20} color="#fff" strokeWidth={2.5} />
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
          {t("postIncidentFeedback.success.viewComplaints")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onGoBack}
        style={{
          borderRadius: 18,
          paddingVertical: 17,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1.5,
          borderColor: "#e5e7eb",
          backgroundColor: "#f9fafb",
        }}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#374151" }}>
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
      await feedbackApiClient.post(
        `/post-incident`,
        { ratings: rating, message: message || null , incident_id: Number(incidentId) }
      );
    },
    onSuccess: () => {
      setSubmittedRating(rating);
      setSubmitted(true);
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
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
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 17, fontWeight: "800", color: "#111827" }}
            >
              {submitted
                ? t("postIncidentFeedback.success.headerTitle")
                : t("postIncidentFeedback.title")}
            </Text>
            {!submitted && complaintTitle ? (
              <Text
                style={{ fontSize: 13, color: "#9ca3af", marginTop: 2 }}
                numberOfLines={1}
              >
                {complaintTitle}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* ── Success or Form ── */}
      {submitted ? (
        <SuccessState
          rating={submittedRating}
          onGoBack={() => router.back()}
          onViewComplaints={() =>
            router.replace("/complaints/UserComplaints") // adjust to your complaints list route
          }
          t={t}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Intro Card ── */}
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#f3f4f6",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: "#eff6ff",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <MessageSquare size={30} color={THEME.primary} strokeWidth={2} />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: "#111827",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {t("postIncidentFeedback.heading")}
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: "#6b7280",
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              {t("postIncidentFeedback.subheading")}
            </Text>
          </View>

          {/* ── Rating Card ── */}
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 20,
              padding: 24,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#f3f4f6",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: "#374151",
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              {t("postIncidentFeedback.ratingPrompt")}
            </Text>

            <StarRating value={rating} onChange={setRating} />

            {rating > 0 && (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: getRatingColor(rating),
                  textAlign: "center",
                  marginTop: 14,
                }}
              >
                {getRatingLabel(rating, t)}
              </Text>
            )}
          </View>

          {/* ── Comment Card ── */}
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 20,
              padding: 18,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: "#f3f4f6",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: "#374151",
                marginBottom: 12,
              }}
            >
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
              style={{
                borderWidth: 1.5,
                borderColor: "#e5e7eb",
                borderRadius: 14,
                padding: 14,
                fontSize: 15,
                color: "#1f2937",
                lineHeight: 22,
                minHeight: 120,
              }}
            />
            <Text
              style={{
                fontSize: 13,
                color: message.length >= 450 ? "#f97316" : "#9ca3af",
                textAlign: "right",
                marginTop: 6,
              }}
            >
              {message.length}/500
            </Text>
          </View>

          {/* ── Submit Button ── */}
          <TouchableOpacity
            onPress={() => canSubmit && mutate()}
            disabled={!canSubmit}
            style={{
              backgroundColor: canSubmit ? THEME.primary : "#e5e7eb",
              borderRadius: 18,
              paddingVertical: 17,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 10,
            }}
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
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: canSubmit ? "#fff" : "#9ca3af",
                  }}
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