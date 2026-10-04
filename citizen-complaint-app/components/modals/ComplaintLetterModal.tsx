/**
 * ComplaintLetterModal.tsx
 *
 * Props:
 *   visible   – controls modal visibility
 *   onClose   – called when user dismisses
 *   complaint – the ComplaintWithLinks data object from your query
 *
 * Deps: expo install expo-print expo-sharing
 */

import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
// SDK 54+: use the legacy entry. On SDK 53 or older use "expo-file-system".
import * as FileSystem from "expo-file-system/legacy";
import useToast from "@/hooks/general/useToast";
import GeneralToast from "../Toast/GeneralToast";
import {
  X,
  Download,
  FileText,
  Check,
  AlertCircle,
} from "lucide-react-native";
import { THEME } from "@/constants/theme";
import {
  formatDate,
  formatTime,
  getCategoryLabel,
} from "@/constants/complaint/complaint";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  user?: { id: number; email: string; role: string; [key: string]: unknown };
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

interface Barangay {
  barangay_name: string;
  barangay_address: string;
  barangay_contact_number: string;
  barangay_email: string;
}

interface ComplaintData {
  id: number | string;
  title: string;
  description?: string;
  status?: string;
  created_at: string;
  location_details?: string;
  category?: { category_name: string };
  barangay?: Barangay;
  incident_links?: IncidentLink[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roleLabel(role?: string): string {
  switch (role) {
    case "barangay_official":
      return "Barangay Official";
    case "lgu_official":
      return "LGU Official";
    case "department_staff":
      return "Department Staff";
    default:
      return "Official";
  }
}

function humanStatus(status?: string): string {
  const map: Record<string, string> = {
    submitted: "Submitted – Awaiting Review",
    reviewed_by_barangay: "Under Review by Barangay",
    resolved_by_barangay: "Resolved by Barangay",
    forwarded_to_lgu: "Forwarded to LGU",
    reviewed_by_lgu: "Under Review by LGU",
    resolved_by_lgu: "Resolved by LGU",
    forwarded_to_department: "Forwarded to Department",
    reviewed_by_department: "Under Review by Department",
    resolved_by_department: "Resolved by Department",
    rejected: "Rejected by Barangay",
    rejected_by_barangay: "Rejected by Barangay",
  };
  return map[status ?? ""] ?? (status ?? "Unknown");
}

// Escape user-entered text so "<" or "&" can't break the PDF layout
const esc = (s?: string | null) =>
  (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// Max remarks printed in the PDF so it always fits on one page
const MAX_REMARKS = 3;

// ─── HTML Letter Template (one page) ──────────────────────────────────────────

function buildLetterHTML(complaint: ComplaintData): string {
  const brgy = complaint.barangay;
  const today = new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const refNo = `CMPL-${String(complaint.id).padStart(6, "0")}`;

  const allResponses = (complaint.incident_links ?? [])
    .flatMap((l) => l.incident?.responses ?? [])
    .sort(
      (a, b) =>
        new Date(a.response_date).getTime() -
        new Date(b.response_date).getTime()
    );

  // Show only the latest remarks so the page never overflows
  const shown = allResponses.slice(-MAX_REMARKS);
  const hidden = allResponses.length - shown.length;

  const remarksHTML =
    allResponses.length === 0
      ? `<p class="muted">No official remarks on record.</p>`
      : shown
          .map(
            (r, i) => `
        <div class="remark">
          <div class="remark-top">
            Remark #${hidden + i + 1} &nbsp;|&nbsp; ${roleLabel(r.user?.role)}
            <span class="remark-date">${formatDate(r.response_date)} at ${formatTime(r.response_date)}</span>
          </div>
          <div class="remark-body">${esc(r.actions_taken?.trim()) || "<em>No remarks provided.</em>"}</div>
        </div>`
          )
          .join("") +
        (hidden > 0
          ? `<p class="muted">+ ${hidden} earlier remark(s) not shown. View the full record in the app.</p>`
          : "");

  // Auto-shrink if the content is long
  const weight =
    (complaint.description?.length ?? 0) +
    (complaint.location_details?.length ?? 0) +
    shown.reduce((n, r) => n + (r.actions_taken?.length ?? 0), 0);
  const zoom =
    weight < 500 ? 1 : weight < 1000 ? 0.92 : weight < 1600 ? 0.82 : 0.72;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  @page { size: 612pt 792pt; margin: 0; }
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:100%; height:100%; overflow:hidden; }
  body { font-family:'Times New Roman',Times,serif; font-size:11px; color:#111; padding:28px 36px; }
  .page { zoom:${zoom}; page-break-after:avoid; page-break-inside:avoid; }

  .header { text-align:center; border-bottom:3px double #1a3c6e; padding-bottom:8px; margin-bottom:10px; }
  .small { font-size:9.5px; font-style:italic; color:#555; }
  .gov { font-size:15px; font-weight:bold; color:#1a3c6e; }
  .brgy { font-size:12.5px; font-weight:bold; color:#1a3c6e; }
  .addr { font-size:9.5px; color:#555; }

  .title { text-align:center; margin:8px 0 10px; }
  .title h2 { font-size:13px; text-decoration:underline; color:#1a3c6e; text-transform:uppercase; letter-spacing:1px; }
  .title p { font-size:10px; color:#555; }

  .meta { display:flex; justify-content:space-between; font-size:10.5px; margin-bottom:8px; }

  .sh { background:#1a3c6e; color:#fff; font-size:10.5px; font-weight:bold; padding:3px 8px;
        margin:9px 0 4px; text-transform:uppercase; letter-spacing:.5px; }

  table { width:100%; border-collapse:collapse; font-size:11px; }
  td { padding:3px 7px; border:1px solid #ccc; vertical-align:top; }
  td.l { width:30%; font-weight:bold; background:#f0f4f8; color:#1a3c6e; }

  .remark { margin-bottom:5px; padding:5px 8px; border-left:3px solid #1a3c6e; background:#f7f9fc; }
  .remark-top { font-weight:bold; font-size:10.5px; color:#1a3c6e; }
  .remark-date { font-weight:normal; color:#777; margin-left:8px; font-size:10px; }
  .remark-body { font-size:11px; line-height:1.35; margin-top:2px; }
  .muted { font-style:italic; color:#888; font-size:10px; }

  .cert { font-size:10.5px; line-height:1.45; margin-top:4px; }

  .sigs { display:flex; justify-content:space-between; margin-top:30px; }
  .sig { width:44%; text-align:center; }
  .sig-name { border-top:1px solid #333; padding-top:3px; font-weight:bold; font-size:10.5px; }
  .sig-title { font-size:9.5px; color:#555; }

  .foot { margin-top:14px; border-top:1px solid #ccc; padding-top:5px; font-size:8.5px; color:#888; text-align:center; }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <p class="small">Republic of the Philippines · Province of Laguna</p>
    <p class="gov">MUNICIPALITY OF SANTA MARIA</p>
    <p class="brgy">${esc(brgy?.barangay_name) || "Barangay Office"}</p>
    <p class="addr">${esc(brgy?.barangay_address) || "Santa Maria, Laguna"}
      ${brgy?.barangay_contact_number ? " · Tel: " + esc(brgy.barangay_contact_number) : ""}
      ${brgy?.barangay_email ? " · " + esc(brgy.barangay_email) : ""}</p>
  </div>

  <div class="title">
    <h2>Complaint Record Document</h2>
    <p>Official Complaint Filed Under Barangay Jurisdiction</p>
  </div>

  <div class="meta">
    <span><b>Reference No.: ${refNo}</b></span>
    <span>Date Printed: ${today}</span>
  </div>

  <div class="sh">I. Complaint Information</div>
  <table>
    <tr><td class="l">Complaint ID</td><td>#${complaint.id}</td></tr>
    <tr><td class="l">Subject / Title</td><td>${esc(complaint.title)}</td></tr>
    <tr><td class="l">Category</td><td>${getCategoryLabel(complaint.category?.category_name ?? "")}</td></tr>
    ${complaint.description ? `<tr><td class="l">Description</td><td>${esc(complaint.description)}</td></tr>` : ""}
    ${complaint.location_details ? `<tr><td class="l">Location</td><td>${esc(complaint.location_details)}</td></tr>` : ""}
    <tr><td class="l">Date &amp; Time Submitted</td><td>${formatDate(complaint.created_at)} at ${formatTime(complaint.created_at)}</td></tr>
    <tr><td class="l">Current Status</td><td><b>${humanStatus(complaint.status)}</b></td></tr>
  </table>

  <div class="sh">II. Official Remarks / Actions Taken</div>
  ${remarksHTML}

  <div class="sh">III. Certification</div>
  <p class="cert">
    This is to certify that the above-stated complaint has been duly received and recorded by the
    Barangay of <b>${esc(brgy?.barangay_name) || "_______________"}</b>, Municipality of Santa Maria,
    Province of Laguna, in accordance with Republic Act No. 7160, otherwise known as the
    <i>Local Government Code of 1991</i>. This document is issued upon request for whatever legal
    purpose it may serve.
  </p>

  <div class="sigs">
    <div class="sig">
      <div class="sig-name">COMPLAINANT</div>
      <div class="sig-title">Signature over Printed Name</div>
    </div>
    <div class="sig">
      <div class="sig-name">BARANGAY CAPTAIN / AUTHORIZED OFFICIAL</div>
      <div class="sig-title">${esc(brgy?.barangay_name) || "Barangay"}, Santa Maria, Laguna</div>
    </div>
  </div>

  <div class="foot">
    Computer-generated document · Generated on ${today} · Ref. No. ${refNo}
  </div>

</div>
</body>
</html>`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  complaint: ComplaintData;
}

export default function ComplaintLetterModal({
  visible,
  onClose,
  complaint,
}: Props) {
  const [status, setStatus] = useState<
    "idle" | "generating" | "done" | "error"
  >("idle");

  // Return the button to normal 3s after done/error
  useEffect(() => {
    if (status !== "done" && status !== "error") return;
    const timer = setTimeout(() => setStatus("idle"), 3000);
    return () => clearTimeout(timer);
  }, [status]);

  // Reset whenever the modal closes
  useEffect(() => {
    if (!visible) setStatus("idle");
  }, [visible]);
  const screenH = Dimensions.get("window").height;
  const { toastVisible, toastMessage, toastType, showToast, hideToast } =
    useToast();

  // Android: user picks a folder and the file is written there (true "saved").
  // iOS: share sheet opens; user taps "Save to Files".
  // Returns false if the user cancelled the Android folder picker.
  const saveToDevice = async (
    uri: string,
    fileName: string
  ): Promise<boolean> => {
    if (Platform.OS === "android") {
      const perm =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!perm.granted) return false;

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        perm.directoryUri,
        fileName.replace(/\.pdf$/i, ""),
        "application/pdf"
      );
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return true;
    }

    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: fileName,
    });
    return true;
  };

  const handleDownload = async () => {
    if (status === "generating") return;
    try {
      setStatus("generating");
      const html = buildLetterHTML(complaint);

      // Generate a single-page PDF (US Letter in points; A4 = 595 x 842)
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        width: 612,
        height: 792,
      });

      const fileName = `Complaint-CMPL-${String(complaint.id).padStart(6, "0")}.pdf`;
      const saved = await saveToDevice(uri, fileName);

      // Android: file was really written -> show verified "Saved".
      // iOS: the share sheet can't report saved vs cancelled, so we
      // never claim success there; just return to normal.
      setStatus(saved && Platform.OS === "android" ? "done" : "idle");
    } catch (e) {
      console.error("PDF generation error:", e);
      setStatus("error");
      showToast("Failed to save the PDF. Please try again.", "error");
    }
  };

  const brgy = complaint.barangay;
  const today = new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const allResponses: IncidentResponse[] = (complaint.incident_links ?? [])
    .flatMap((l) => l.incident?.responses ?? [])
    .sort(
      (a, b) =>
        new Date(a.response_date).getTime() -
        new Date(b.response_date).getTime()
    );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { maxHeight: screenH * 0.92 }]}>
          {/* ── Modal Header ── */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <FileText size={20} color={THEME.primary} strokeWidth={2.5} />
              <View>
                <Text style={styles.modalTitle}>Complaint Letter</Text>
                <Text style={styles.modalSub}>Official Government Format</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <X size={20} color="#6b7280" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* ── Scrollable Letter Preview ── */}
          <ScrollView
            style={styles.previewScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
          >
            <View style={styles.paper}>
              {/* Letterhead */}
              <View style={styles.letterhead}>
                <Text style={styles.republicLine}>
                  Republic of the Philippines
                </Text>
                <Text style={styles.republicLine}>Province of Laguna</Text>
                <Text style={styles.govUnit}>MUNICIPALITY OF SANTA MARIA</Text>
                <Text style={styles.barangayName}>
                  {brgy?.barangay_name ?? "Barangay Office"}
                </Text>
                <Text style={styles.addressLine}>
                  {brgy?.barangay_address ?? "Santa Maria, Laguna"}
                </Text>
                {(brgy?.barangay_contact_number || brgy?.barangay_email) && (
                  <Text style={styles.addressLine}>
                    {brgy.barangay_contact_number
                      ? `Tel: ${brgy.barangay_contact_number}  `
                      : ""}
                    {brgy.barangay_email
                      ? `| Email: ${brgy.barangay_email}`
                      : ""}
                  </Text>
                )}
              </View>
              <View style={styles.letterheadDivider} />

              {/* Doc Title */}
              <View style={styles.docTitleBlock}>
                <Text style={styles.docTitle}>COMPLAINT RECORD DOCUMENT</Text>
                <Text style={styles.docSubtitle}>
                  Official Complaint Filed Under Barangay Jurisdiction
                </Text>
              </View>

              {/* Ref / Date */}
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  Reference No.:{" "}
                  <Text style={{ fontWeight: "700" }}>
                    CMPL-{String(complaint.id).padStart(6, "0")}
                  </Text>
                </Text>
                <Text style={styles.metaText}>Date Printed: {today}</Text>
              </View>

              {/* Section I */}
              <SectionHeading label="I. Complaint Information" />
              <InfoTableRow label="Complaint ID" value={`#${complaint.id}`} />
              <InfoTableRow label="Subject / Title" value={complaint.title} />
              <InfoTableRow
                label="Category"
                value={getCategoryLabel(complaint.category?.category_name ?? "")}
              />
              {complaint.description && (
                <InfoTableRow
                  label="Description"
                  value={complaint.description}
                />
              )}
              {complaint.location_details && (
                <InfoTableRow
                  label="Location"
                  value={complaint.location_details}
                />
              )}
              <InfoTableRow
                label="Date & Time Submitted"
                value={`${formatDate(complaint.created_at)}  at  ${formatTime(complaint.created_at)}`}
              />
              <InfoTableRow
                label="Current Status"
                value={humanStatus(complaint.status)}
                isStatus
              />

              {/* Section II */}
              {brgy && (
                <>
                  <SectionHeading label="II. Receiving Barangay Details" />
                  <InfoTableRow
                    label="Barangay Name"
                    value={brgy.barangay_name}
                  />
                  <InfoTableRow label="Address" value={brgy.barangay_address} />
                  <InfoTableRow
                    label="Contact Number"
                    value={brgy.barangay_contact_number}
                  />
                  <InfoTableRow
                    label="Email Address"
                    value={brgy.barangay_email}
                  />
                </>
              )}

              {/* Section III */}
              <SectionHeading label="III. Official Remarks / Actions Taken" />
              {allResponses.length === 0 ? (
                <Text style={styles.noRemarks}>
                  No official remarks on record.
                </Text>
              ) : (
                allResponses.map((r, i) => (
                  <View key={r.id} style={styles.remarkCard}>
                    <View style={styles.remarkAccent} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.remarkTopRow}>
                        <Text style={styles.remarkLabel}>Remark #{i + 1}</Text>
                        <View style={styles.rolePill}>
                          <Text style={styles.rolePillText}>
                            {roleLabel(r.user?.role)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.remarkDate}>
                        {formatDate(r.response_date)} at{" "}
                        {formatTime(r.response_date)}
                      </Text>
                      <Text style={styles.remarkBody}>
                        {r.actions_taken?.trim() || "No remarks provided."}
                      </Text>
                    </View>
                  </View>
                ))
              )}

              {/* Section IV */}
              <SectionHeading label="IV. Certification" />
              <Text style={styles.certText}>
                This is to certify that the above-stated complaint has been duly
                received and recorded by the Barangay of{" "}
                <Text style={{ fontWeight: "700" }}>
                  {brgy?.barangay_name ?? "_______________"}
                </Text>
                , Municipality of Santa Maria, Province of Laguna, in accordance
                with the provisions of Republic Act No. 7160, otherwise known as
                the{" "}
                <Text style={{ fontStyle: "italic" }}>
                  Local Government Code of 1991
                </Text>
                , and the applicable guidelines of the Department of the
                Interior and Local Government (DILG).
              </Text>
              <Text style={[styles.certText, { marginTop: 8 }]}>
                This document is issued upon request for whatever legal purpose
                it may serve.
              </Text>

              {/* Signatures */}
              <View style={styles.sigRow}>
                <View style={styles.sigCol}>
                  <View style={styles.sigLine} />
                  <Text style={styles.sigName}>COMPLAINANT</Text>
                  <Text style={styles.sigTitle}>Signature over Printed Name</Text>
                </View>
                <View style={styles.sigCol}>
                  <View style={styles.sigLine} />
                  <Text style={styles.sigName}>BARANGAY CAPTAIN</Text>
                  <Text style={styles.sigTitle}>
                    {brgy?.barangay_name ?? "Barangay"}, Santa Maria, Laguna
                  </Text>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.paperFooter}>
                <Text style={styles.paperFooterText}>
                  This is a computer-generated document. ·{" "}
                  {brgy?.barangay_name ?? "Barangay"}, Municipality of Santa
                  Maria, Laguna · Generated on {today} · Ref. No. CMPL-
                  {String(complaint.id).padStart(6, "0")}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* ── Action Buttons ── */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.cancelBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDownload}
              style={[
                styles.downloadBtn,
                status === "generating" && { opacity: 0.7 },
                status === "done" && styles.downloadBtnDone,
                status === "error" && styles.downloadBtnError,
              ]}
              activeOpacity={0.85}
              disabled={status === "generating" || status === "done"}
            >
              {status === "generating" && (
                <ActivityIndicator size="small" color="#fff" />
              )}
              {status === "done" && (
                <>
                  <Check size={20} color="#fff" strokeWidth={3} />
                  <Text style={styles.downloadBtnText}>Saved</Text>
                </>
              )}
              {status === "error" && (
                <>
                  <AlertCircle size={18} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.downloadBtnText}>Failed – Tap to retry</Text>
                </>
              )}
              {status === "idle" && (
                <>
                  <Download size={18} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.downloadBtnText}>
                    {Platform.OS === "android" ? "Download PDF" : "Save / Share PDF"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Toast lives inside this Modal so it shows above the letter */}
      <GeneralToast
        visible={toastVisible}
        onHide={hideToast}
        message={toastMessage}
        type={toastType}
      />
    </Modal>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionHeadingText}>{label}</Text>
    </View>
  );
}

function InfoTableRow({
  label,
  value,
  isStatus,
}: {
  label: string;
  value: string;
  isStatus?: boolean;
}) {
  return (
    <View style={styles.tableRow}>
      <View style={styles.tableLabel}>
        <Text style={styles.tableLabelText}>{label}</Text>
      </View>
      <View style={styles.tableValue}>
        {isStatus ? (
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{value}</Text>
          </View>
        ) : (
          <Text style={styles.tableValueText}>{value}</Text>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#f3f4f6",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },

  // Modal header
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },
  modalSub: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },

  // Scroll
  previewScroll: { flex: 1 },

  // Paper
  paper: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  // Letterhead
  letterhead: { alignItems: "center", paddingBottom: 12 },
  republicLine: {
    fontSize: 10,
    fontStyle: "italic",
    color: "#555",
    letterSpacing: 0.5,
  },
  govUnit: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a3c6e",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  barangayName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a3c6e",
    marginTop: 1,
  },
  addressLine: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
    textAlign: "center",
  },
  letterheadDivider: {
    borderBottomWidth: 2.5,
    borderBottomColor: "#1a3c6e",
    borderTopWidth: 1,
    borderTopColor: "#1a3c6e",
    marginVertical: 10,
  },

  // Doc title
  docTitleBlock: { alignItems: "center", marginBottom: 14 },
  docTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1a3c6e",
    textDecorationLine: "underline",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  docSubtitle: { fontSize: 11, color: "#666", marginTop: 3 },

  // Meta
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  metaText: { fontSize: 11, color: "#555" },

  // Section heading
  sectionHeading: {
    backgroundColor: "#1a3c6e",
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 14,
    marginBottom: 0,
    borderRadius: 4,
  },
  sectionHeadingText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // Table rows
  tableRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderTopWidth: 0,
  },
  tableLabel: {
    width: "38%",
    padding: 8,
    backgroundColor: "#f0f4f8",
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
    justifyContent: "center",
  },
  tableLabelText: { fontSize: 12, fontWeight: "700", color: "#1a3c6e" },
  tableValue: { flex: 1, padding: 8, justifyContent: "center" },
  tableValueText: { fontSize: 12, color: "#1f2937", lineHeight: 18 },

  // Status badge
  statusBadge: {
    backgroundColor: "#e8f0fe",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  statusBadgeText: { fontSize: 11, fontWeight: "700", color: "#1a3c6e" },

  // Remarks
  noRemarks: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#9ca3af",
    marginTop: 10,
  },
  remarkCard: {
    flexDirection: "row",
    marginTop: 10,
    backgroundColor: "#f7f9fc",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  remarkAccent: { width: 4, backgroundColor: "#1a3c6e" },
  remarkTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    paddingBottom: 4,
  },
  remarkLabel: { fontSize: 12, fontWeight: "700", color: "#1a3c6e" },
  rolePill: {
    backgroundColor: "#e8f0fe",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rolePillText: { fontSize: 10, fontWeight: "700", color: "#1a3c6e" },
  remarkDate: { fontSize: 11, color: "#9ca3af", paddingHorizontal: 10 },
  remarkBody: {
    fontSize: 12,
    color: "#1f2937",
    lineHeight: 18,
    padding: 10,
    paddingTop: 6,
  },

  // Certification
  certText: { fontSize: 12, color: "#333", lineHeight: 19, marginTop: 10 },

  // Signatures
  sigRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 36,
  },
  sigCol: { width: "44%", alignItems: "center" },
  sigLine: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#333",
    marginBottom: 6,
  },
  sigName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
  },
  sigTitle: { fontSize: 10, color: "#666", textAlign: "center", marginTop: 2 },

  // Paper footer
  paperFooter: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
  paperFooterText: {
    fontSize: 9,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 14,
  },

  // Action bar
  actionBar: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "700", color: "#6b7280" },
  downloadBtn: {
    flex: 2,
    backgroundColor: THEME.primary,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: THEME.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  downloadBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  downloadBtnDone: { backgroundColor: "#10b981", shadowColor: "#10b981" },
  downloadBtnError: { backgroundColor: "#ef4444", shadowColor: "#ef4444" },
});