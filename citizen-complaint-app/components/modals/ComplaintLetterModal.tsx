/**
 * ComplaintLetterModal.tsx
 *
 * Drop-in component for ComplaintDetail.tsx
 *
 * Usage:
 *   1. Import this component and add it inside your ComplaintDetail return.
 *   2. Add the "Download Complaint" button (also provided below).
 *   3. Install deps if not already present:
 *        expo install expo-print expo-sharing expo-file-system
 *
 * Props:
 *   visible        – controls modal visibility
 *   onClose        – called when user dismisses
 *   complaint      – the ComplaintWithLinks data object from your query
 */

import React, { useState } from "react";
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
import {
  X,
  Download,
  FileText,
  Printer,
} from "lucide-react-native";
import { THEME } from "@/constants/theme";
import { formatDate, formatTime, getCategoryLabel } from "@/constants/complaint/complaint";

// ─── Re-use your local types (copy or import from ComplaintDetail) ────────────

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
    case "barangay_official":   return "Barangay Official";
    case "lgu_official":        return "LGU Official";
    case "department_staff":    return "Department Staff";
    default:                    return "Official";
  }
}

function humanStatus(status?: string): string {
  const map: Record<string, string> = {
    submitted:                "Submitted – Awaiting Review",
    reviewed_by_barangay:     "Under Review by Barangay",
    resolved_by_barangay:     "Resolved by Barangay",
    forwarded_to_lgu:         "Forwarded to LGU",
    reviewed_by_lgu:          "Under Review by LGU",
    resolved_by_lgu:          "Resolved by LGU",
    forwarded_to_department:  "Forwarded to Department",
    reviewed_by_department:   "Under Review by Department",
    resolved_by_department:   "Resolved by Department",
    rejected:                 "Rejected by Barangay",
    rejected_by_barangay:     "Rejected by Barangay",
  };
  return map[status ?? ""] ?? (status ?? "Unknown");
}

// ─── HTML Letter Template ─────────────────────────────────────────────────────

function buildLetterHTML(complaint: ComplaintData): string {
  const brgy = complaint.barangay;
  const today = new Date().toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  });

  const allResponses: IncidentResponse[] = (complaint.incident_links ?? [])
    .flatMap((l) => l.incident?.responses ?? [])
    .sort((a, b) => new Date(a.response_date).getTime() - new Date(b.response_date).getTime());

  const remarksHTML = allResponses.length === 0
    ? `<p style="font-style:italic;color:#888;">No official remarks on record.</p>`
    : allResponses.map((r, i) => `
        <div style="margin-bottom:18px;padding:14px 16px;border-left:4px solid #1a3c6e;background:#f7f9fc;">
          <p style="margin:0 0 4px 0;font-weight:bold;font-size:13px;color:#1a3c6e;">
            Remark #${i + 1} &nbsp;|&nbsp; ${roleLabel(r.user?.role)}
          </p>
          <p style="margin:0 0 6px 0;font-size:12px;color:#666;">
            ${formatDate(r.response_date)} at ${formatTime(r.response_date)}
          </p>
          <p style="margin:0;font-size:13px;color:#222;line-height:1.6;">
            ${r.actions_taken?.trim() || "<em>No remarks provided.</em>"}
          </p>
        </div>
      `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13px;
      color: #111;
      background: #fff;
      padding: 48px 56px;
    }

    /* ── Letter Header ── */
    .header {
      text-align: center;
      border-bottom: 3px double #1a3c6e;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .republic-line {
      font-size: 11px;
      font-style: italic;
      color: #555;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .gov-unit {
      font-size: 18px;
      font-weight: bold;
      color: #1a3c6e;
      letter-spacing: 0.5px;
    }
    .barangay-name {
      font-size: 15px;
      font-weight: bold;
      color: #1a3c6e;
      margin-top: 2px;
    }
    .address-line {
      font-size: 11px;
      color: #555;
      margin-top: 3px;
    }
    .contact-line {
      font-size: 11px;
      color: #555;
    }

    /* ── Document Label ── */
    .doc-label {
      text-align: center;
      margin: 20px 0 24px;
    }
    .doc-label h2 {
      font-size: 15px;
      font-weight: bold;
      text-decoration: underline;
      color: #1a3c6e;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .doc-label p {
      font-size: 12px;
      color: #555;
      margin-top: 4px;
    }

    /* ── Meta row ── */
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .meta-row .ref { font-weight: bold; }

    /* ── Section headings ── */
    .section-heading {
      background: #1a3c6e;
      color: #fff;
      font-size: 12px;
      font-weight: bold;
      padding: 6px 12px;
      margin: 18px 0 10px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    /* ── Info table ── */
    table.info-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 6px;
    }
    table.info-table td {
      padding: 7px 10px;
      border: 1px solid #ccc;
      vertical-align: top;
    }
    table.info-table td.label-cell {
      width: 35%;
      font-weight: bold;
      background: #f0f4f8;
      color: #1a3c6e;
    }

    /* ── Status badge ── */
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 12px;
    }

    /* ── Remarks ── */
    .remarks-container { margin-top: 4px; }

    /* ── Footer / Signature ── */
    .signature-block {
      margin-top: 48px;
      display: flex;
      justify-content: space-between;
    }
    .sig-col { width: 44%; text-align: center; }
    .sig-name {
      font-weight: bold;
      font-size: 13px;
      border-top: 1px solid #333;
      padding-top: 6px;
      margin-top: 40px;
    }
    .sig-title { font-size: 11px; color: #555; }

    .footer-note {
      margin-top: 36px;
      border-top: 1px solid #ccc;
      padding-top: 10px;
      font-size: 10px;
      color: #888;
      text-align: center;
    }

    /* ── Print ── */
    @media print {
      body { padding: 28px 36px; }
    }
  </style>
</head>
<body>

  <!-- ══ LETTERHEAD ══ -->
  <div class="header">
    <p class="republic-line">Republic of the Philippines</p>
    <p class="republic-line">Province of Laguna</p>
    <p class="gov-unit">MUNICIPALITY OF SANTA MARIA</p>
    <p class="barangay-name">${brgy?.barangay_name ?? "Barangay Office"}</p>
    <p class="address-line">${brgy?.barangay_address ?? "Santa Maria, Laguna"}</p>
    <p class="contact-line">
      ${brgy?.barangay_contact_number ? "Tel: " + brgy.barangay_contact_number + " &nbsp;|&nbsp; " : ""}
      ${brgy?.barangay_email ? "Email: " + brgy.barangay_email : ""}
    </p>
  </div>

  <!-- ══ DOCUMENT TITLE ══ -->
  <div class="doc-label">
    <h2>Complaint Record Document</h2>
    <p>Official Complaint Filed Under Barangay Jurisdiction</p>
  </div>

  <!-- ══ REF / DATE ══ -->
  <div class="meta-row">
    <span class="ref">Reference No.: CMPL-${String(complaint.id).padStart(6, "0")}</span>
    <span>Date Printed: ${today}</span>
  </div>

  <!-- ══ COMPLAINT INFORMATION ══ -->
  <div class="section-heading">I. Complaint Information</div>
  <table class="info-table">
    <tr>
      <td class="label-cell">Complaint ID</td>
      <td>#${complaint.id}</td>
    </tr>
    <tr>
      <td class="label-cell">Subject / Title</td>
      <td>${complaint.title}</td>
    </tr>
    <tr>
      <td class="label-cell">Category</td>
      <td>${getCategoryLabel(complaint.category?.category_name ?? "")}</td>
    </tr>
    ${complaint.description ? `
    <tr>
      <td class="label-cell">Description</td>
      <td style="line-height:1.7;">${complaint.description}</td>
    </tr>` : ""}
    ${complaint.location_details ? `
    <tr>
      <td class="label-cell">Location</td>
      <td>${complaint.location_details}</td>
    </tr>` : ""}
    <tr>
      <td class="label-cell">Date & Time Submitted</td>
      <td>${formatDate(complaint.created_at)} at ${formatTime(complaint.created_at)}</td>
    </tr>
    <tr>
      <td class="label-cell">Current Status</td>
      <td>
        <span class="status-badge" style="background:#e8f0fe;color:#1a3c6e;">
          ${humanStatus(complaint.status)}
        </span>
      </td>
    </tr>
  </table>

  <!-- ══ BARANGAY INFORMATION ══ -->
  ${brgy ? `
  <div class="section-heading">II. Receiving Barangay Details</div>
  <table class="info-table">
    <tr>
      <td class="label-cell">Barangay Name</td>
      <td>${brgy.barangay_name}</td>
    </tr>
    <tr>
      <td class="label-cell">Address</td>
      <td>${brgy.barangay_address}</td>
    </tr>
    <tr>
      <td class="label-cell">Contact Number</td>
      <td>${brgy.barangay_contact_number}</td>
    </tr>
    <tr>
      <td class="label-cell">Email Address</td>
      <td>${brgy.barangay_email}</td>
    </tr>
  </table>` : ""}

  <!-- ══ OFFICIAL REMARKS ══ -->
  <div class="section-heading">III. Official Remarks / Actions Taken</div>
  <div class="remarks-container">
    ${remarksHTML}
  </div>

  <!-- ══ CERTIFICATION ══ -->
  <div class="section-heading">IV. Certification</div>
  <p style="font-size:13px;line-height:1.8;margin-top:6px;">
    This is to certify that the above-stated complaint has been duly received and
    recorded by the Barangay of <strong>${brgy?.barangay_name ?? "_______________"}</strong>,
    Municipality of Santa Maria, Province of Laguna, in accordance with the
    provisions of Republic Act No. 7160, otherwise known as the
    <em>Local Government Code of 1991</em>, and the applicable guidelines of the
    Department of the Interior and Local Government (DILG).
  </p>
  <p style="font-size:13px;line-height:1.8;margin-top:10px;">
    This document is issued upon request for whatever legal purpose it may serve.
  </p>

  <!-- ══ SIGNATURES ══ -->
  <div class="signature-block">
    <div class="sig-col">
      <div class="sig-name">COMPLAINANT</div>
      <div class="sig-title">Signature over Printed Name</div>
    </div>
    <div class="sig-col">
      <div class="sig-name">BARANGAY CAPTAIN / AUTHORIZED OFFICIAL</div>
      <div class="sig-title">${brgy?.barangay_name ?? "Barangay"}, Santa Maria, Laguna</div>
    </div>
  </div>

  <!-- ══ FOOTER ══ -->
  <div class="footer-note">
    This is a computer-generated document. · ${brgy?.barangay_name ?? "Barangay"}, Municipality of Santa Maria, Laguna ·
    Generated on ${today} · Reference No. CMPL-${String(complaint.id).padStart(6, "0")}
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

export default function ComplaintLetterModal({ visible, onClose, complaint }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const screenH = Dimensions.get("window").height;

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      const html = buildLetterHTML(complaint);

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      // Share / save
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Complaint #${complaint.id} – Official Letter`,
          UTI: "com.adobe.pdf",
        });
      } else {
        // Fallback: open print dialog
        await Print.printAsync({ uri });
      }
    } catch (e) {
      console.error("PDF generation error:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const brgy = complaint.barangay;
  const today = new Date().toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  });

  const allResponses: IncidentResponse[] = (complaint.incident_links ?? [])
    .flatMap((l) => l.incident?.responses ?? [])
    .sort((a, b) => new Date(a.response_date).getTime() - new Date(b.response_date).getTime());

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* ── Sheet ── */}
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
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#6b7280" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* ── Scrollable Letter Preview ── */}
          <ScrollView
            style={styles.previewScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
          >
            {/* Paper */}
            <View style={styles.paper}>

              {/* ── Letterhead ── */}
              <View style={styles.letterhead}>
                <Text style={styles.republicLine}>Republic of the Philippines</Text>
                <Text style={styles.republicLine}>Province of Laguna</Text>
                <Text style={styles.govUnit}>MUNICIPALITY OF SANTA MARIA</Text>
                <Text style={styles.barangayName}>{brgy?.barangay_name ?? "Barangay Office"}</Text>
                <Text style={styles.addressLine}>{brgy?.barangay_address ?? "Santa Maria, Laguna"}</Text>
                {(brgy?.barangay_contact_number || brgy?.barangay_email) && (
                  <Text style={styles.addressLine}>
                    {brgy.barangay_contact_number ? `Tel: ${brgy.barangay_contact_number}  ` : ""}
                    {brgy.barangay_email ? `| Email: ${brgy.barangay_email}` : ""}
                  </Text>
                )}
              </View>
              <View style={styles.letterheadDivider} />

              {/* ── Doc Title ── */}
              <View style={styles.docTitleBlock}>
                <Text style={styles.docTitle}>COMPLAINT RECORD DOCUMENT</Text>
                <Text style={styles.docSubtitle}>Official Complaint Filed Under Barangay Jurisdiction</Text>
              </View>

              {/* ── Ref / Date ── */}
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  Reference No.: <Text style={{ fontWeight: "700" }}>CMPL-{String(complaint.id).padStart(6, "0")}</Text>
                </Text>
                <Text style={styles.metaText}>Date Printed: {today}</Text>
              </View>

              {/* ── Section I ── */}
              <SectionHeading label="I. Complaint Information" />
              <InfoTableRow label="Complaint ID" value={`#${complaint.id}`} />
              <InfoTableRow label="Subject / Title" value={complaint.title} />
              <InfoTableRow label="Category" value={getCategoryLabel(complaint.category?.category_name ?? "")} />
              {complaint.description && <InfoTableRow label="Description" value={complaint.description} />}
              {complaint.location_details && <InfoTableRow label="Location" value={complaint.location_details} />}
              <InfoTableRow
                label="Date & Time Submitted"
                value={`${formatDate(complaint.created_at)}  at  ${formatTime(complaint.created_at)}`}
              />
              <InfoTableRow label="Current Status" value={humanStatus(complaint.status)} isStatus />

              {/* ── Section II ── */}
              {brgy && (
                <>
                  <SectionHeading label="II. Receiving Barangay Details" />
                  <InfoTableRow label="Barangay Name" value={brgy.barangay_name} />
                  <InfoTableRow label="Address" value={brgy.barangay_address} />
                  <InfoTableRow label="Contact Number" value={brgy.barangay_contact_number} />
                  <InfoTableRow label="Email Address" value={brgy.barangay_email} />
                </>
              )}

              {/* ── Section III ── */}
              <SectionHeading label="III. Official Remarks / Actions Taken" />
              {allResponses.length === 0 ? (
                <Text style={styles.noRemarks}>No official remarks on record.</Text>
              ) : (
                allResponses.map((r, i) => (
                  <View key={r.id} style={styles.remarkCard}>
                    <View style={styles.remarkAccent} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.remarkTopRow}>
                        <Text style={styles.remarkLabel}>Remark #{i + 1}</Text>
                        <View style={styles.rolePill}>
                          <Text style={styles.rolePillText}>{roleLabel(r.user?.role)}</Text>
                        </View>
                      </View>
                      <Text style={styles.remarkDate}>
                        {formatDate(r.response_date)} at {formatTime(r.response_date)}
                      </Text>
                      <Text style={styles.remarkBody}>
                        {r.actions_taken?.trim() || "No remarks provided."}
                      </Text>
                    </View>
                  </View>
                ))
              )}

              {/* ── Section IV ── */}
              <SectionHeading label="IV. Certification" />
              <Text style={styles.certText}>
                This is to certify that the above-stated complaint has been duly received and
                recorded by the Barangay of{" "}
                <Text style={{ fontWeight: "700" }}>{brgy?.barangay_name ?? "_______________"}</Text>,
                Municipality of Santa Maria, Province of Laguna, in accordance with the provisions
                of Republic Act No. 7160, otherwise known as the{" "}
                <Text style={{ fontStyle: "italic" }}>Local Government Code of 1991</Text>, and
                the applicable guidelines of the Department of the Interior and Local Government (DILG).
              </Text>
              <Text style={[styles.certText, { marginTop: 8 }]}>
                This document is issued upon request for whatever legal purpose it may serve.
              </Text>

              {/* ── Signatures ── */}
              <View style={styles.sigRow}>
                <View style={styles.sigCol}>
                  <View style={styles.sigLine} />
                  <Text style={styles.sigName}>COMPLAINANT</Text>
                  <Text style={styles.sigTitle}>Signature over Printed Name</Text>
                </View>
                <View style={styles.sigCol}>
                  <View style={styles.sigLine} />
                  <Text style={styles.sigName}>BARANGAY CAPTAIN</Text>
                  <Text style={styles.sigTitle}>{brgy?.barangay_name ?? "Barangay"}, Santa Maria, Laguna</Text>
                </View>
              </View>

              {/* ── Footer ── */}
              <View style={styles.paperFooter}>
                <Text style={styles.paperFooterText}>
                  This is a computer-generated document. · {brgy?.barangay_name ?? "Barangay"},{" "}
                  Municipality of Santa Maria, Laguna · Generated on {today} · Ref. No. CMPL-{String(complaint.id).padStart(6, "0")}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* ── Action Buttons ── */}
          <View style={styles.actionBar}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDownload}
              style={[styles.downloadBtn, isGenerating && { opacity: 0.7 }]}
              activeOpacity={0.85}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Download size={18} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.downloadBtnText}>Download PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </View>
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

  // ── Modal header
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
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#f3f4f6",
    alignItems: "center", justifyContent: "center",
  },

  // ── Scroll
  previewScroll: { flex: 1 },

  // ── Paper
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

  // ── Letterhead
  letterhead: { alignItems: "center", paddingBottom: 12 },
  republicLine: { fontSize: 10, fontStyle: "italic", color: "#555", letterSpacing: 0.5 },
  govUnit: { fontSize: 16, fontWeight: "800", color: "#1a3c6e", marginTop: 2, letterSpacing: 0.5 },
  barangayName: { fontSize: 13, fontWeight: "700", color: "#1a3c6e", marginTop: 1 },
  addressLine: { fontSize: 10, color: "#666", marginTop: 2, textAlign: "center" },
  letterheadDivider: {
    borderBottomWidth: 2.5, borderBottomColor: "#1a3c6e",
    borderTopWidth: 1, borderTopColor: "#1a3c6e",
    marginVertical: 10,
  },

  // ── Doc title
  docTitleBlock: { alignItems: "center", marginBottom: 14 },
  docTitle: {
    fontSize: 13, fontWeight: "800", color: "#1a3c6e",
    textDecorationLine: "underline", letterSpacing: 0.8, textTransform: "uppercase",
  },
  docSubtitle: { fontSize: 11, color: "#666", marginTop: 3 },

  // ── Meta
  metaRow: {
    flexDirection: "row", justifyContent: "space-between",
    marginBottom: 14,
  },
  metaText: { fontSize: 11, color: "#555" },

  // ── Section heading
  sectionHeading: {
    backgroundColor: "#1a3c6e",
    paddingHorizontal: 10, paddingVertical: 6,
    marginTop: 14, marginBottom: 0,
    borderRadius: 4,
  },
  sectionHeadingText: {
    color: "#fff", fontSize: 11, fontWeight: "700",
    letterSpacing: 0.5, textTransform: "uppercase",
  },

  // ── Table rows
  tableRow: {
    flexDirection: "row",
    borderWidth: 1, borderColor: "#e5e7eb",
    borderTopWidth: 0,
  },
  tableLabel: {
    width: "38%", padding: 8,
    backgroundColor: "#f0f4f8",
    borderRightWidth: 1, borderRightColor: "#e5e7eb",
    justifyContent: "center",
  },
  tableLabelText: { fontSize: 12, fontWeight: "700", color: "#1a3c6e" },
  tableValue: { flex: 1, padding: 8, justifyContent: "center" },
  tableValueText: { fontSize: 12, color: "#1f2937", lineHeight: 18 },

  // ── Status badge
  statusBadge: {
    backgroundColor: "#e8f0fe", borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start",
  },
  statusBadgeText: { fontSize: 11, fontWeight: "700", color: "#1a3c6e" },

  // ── Remarks
  noRemarks: { fontSize: 12, fontStyle: "italic", color: "#9ca3af", marginTop: 10 },
  remarkCard: {
    flexDirection: "row",
    marginTop: 10,
    backgroundColor: "#f7f9fc",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1, borderColor: "#e5e7eb",
  },
  remarkAccent: { width: 4, backgroundColor: "#1a3c6e" },
  remarkTopRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, paddingBottom: 4 },
  remarkLabel: { fontSize: 12, fontWeight: "700", color: "#1a3c6e" },
  rolePill: {
    backgroundColor: "#e8f0fe", borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  rolePillText: { fontSize: 10, fontWeight: "700", color: "#1a3c6e" },
  remarkDate: { fontSize: 11, color: "#9ca3af", paddingHorizontal: 10 },
  remarkBody: { fontSize: 12, color: "#1f2937", lineHeight: 18, padding: 10, paddingTop: 6 },

  // ── Certification
  certText: { fontSize: 12, color: "#333", lineHeight: 19, marginTop: 10 },

  // ── Signatures
  sigRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 36 },
  sigCol: { width: "44%", alignItems: "center" },
  sigLine: { width: "100%", borderTopWidth: 1, borderTopColor: "#333", marginBottom: 6 },
  sigName: { fontSize: 11, fontWeight: "700", color: "#111", textAlign: "center" },
  sigTitle: { fontSize: 10, color: "#666", textAlign: "center", marginTop: 2 },

  // ── Paper footer
  paperFooter: { marginTop: 24, borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 10 },
  paperFooterText: { fontSize: 9, color: "#aaa", textAlign: "center", lineHeight: 14 },

  // ── Action bar
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
});

/**
 * ─── HOW TO USE IN ComplaintDetail.tsx ────────────────────────────────────
 *
 * 1. Import:
 *      import ComplaintLetterModal from "@/components/complaint/ComplaintLetterModal";
 *
 * 2. Add state near the top of ComplaintDetail():
 *      const [showLetter, setShowLetter] = useState(false);
 *
 * 3. Add the "Download Complaint" button inside the header View (after the status badge):
 *
 *      <TouchableOpacity
 *        onPress={() => setShowLetter(true)}
 *        style={{
 *          flexDirection: "row",
 *          alignItems: "center",
 *          gap: 6,
 *          marginTop: 10,
 *          backgroundColor: "#f0f4ff",
 *          borderRadius: 12,
 *          paddingHorizontal: 14,
 *          paddingVertical: 10,
 *          alignSelf: "flex-start",
 *          borderWidth: 1,
 *          borderColor: "#c7d9ff",
 *        }}
 *        activeOpacity={0.7}
 *      >
 *        <Download size={16} color={THEME.primary} strokeWidth={2.5} />
 *        <Text style={{ fontSize: 14, fontWeight: "700", color: THEME.primary }}>
 *          Download Complaint
 *        </Text>
 *      </TouchableOpacity>
 *
 * 4. Render the modal at the bottom of the return (before the closing </View>):
 *
 *      <ComplaintLetterModal
 *        visible={showLetter}
 *        onClose={() => setShowLetter(false)}
 *        complaint={data}
 *      />
 *
 * 5. Install deps (if not already):
 *      expo install expo-print expo-sharing
 */