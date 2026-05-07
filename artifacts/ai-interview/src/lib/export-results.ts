import * as XLSX from "xlsx";

interface SessionResult {
  sessionId: number;
  candidateName: string;
  candidateEmail: string;
  status: string;
  overallScore: number | null;
  behavioralScore: number | null;
  technicalScore: number | null;
  codingScore: number | null;
  completedAt: string | null;
  startedAt: string | null;
}

type Category = "Hire" | "Do Not Hire" | "Not Attempted";

function categorize(r: SessionResult): Category {
  if (r.status !== "completed" || r.overallScore === null) return "Not Attempted";
  return r.overallScore >= 70 ? "Hire" : "Do Not Hire";
}

function fmt(val: number | null): string {
  return val !== null ? `${val}/100` : "N/A";
}

function fmtDate(val: string | null): string {
  if (!val) return "N/A";
  return new Date(val).toLocaleString();
}

function buildRows(results: SessionResult[]) {
  return results.map((r) => ({
    "Candidate Name": r.candidateName || r.candidateEmail,
    "Email": r.candidateEmail,
    "Overall Score": fmt(r.overallScore),
    "Behavioral Score": fmt(r.behavioralScore),
    "Technical Score": fmt(r.technicalScore),
    "Coding Score": fmt(r.codingScore),
    "Status": r.status,
    "Started At": fmtDate(r.startedAt),
    "Completed At": fmtDate(r.completedAt),
  }));
}

function styleSheet(ws: XLSX.WorkSheet, headerColor: string) {
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");

  for (let C = range.s.c; C <= range.e.c; C++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[cellAddr]) continue;
    ws[cellAddr].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: headerColor } },
      alignment: { horizontal: "center" },
      border: {
        bottom: { style: "thin", color: { rgb: "CCCCCC" } },
      },
    };
  }

  const colWidths = [22, 28, 14, 18, 16, 14, 12, 22, 22];
  ws["!cols"] = colWidths.map((w) => ({ wch: w }));

  return ws;
}

export async function downloadInterviewResults(
  interviewId: number,
  interviewTitle: string
) {
  const res = await fetch(`/api/employer/interviews/${interviewId}/export`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch export data");

  const data: { interviewTitle: string; results: SessionResult[] } = await res.json();
  const { results } = data;

  const hire = results
    .filter((r) => categorize(r) === "Hire")
    .sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0));

  const doNotHire = results
    .filter((r) => categorize(r) === "Do Not Hire")
    .sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0));

  const notAttempted = results.filter((r) => categorize(r) === "Not Attempted");

  const wb = XLSX.utils.book_new();

  const hireWs = styleSheet(
    XLSX.utils.json_to_sheet(hire.length > 0 ? buildRows(hire) : [{ "No Data": "No candidates in this category" }]),
    "1D6F42"
  );
  XLSX.utils.book_append_sheet(wb, hireWs, "Hire");

  const dNHWs = styleSheet(
    XLSX.utils.json_to_sheet(doNotHire.length > 0 ? buildRows(doNotHire) : [{ "No Data": "No candidates in this category" }]),
    "C0392B"
  );
  XLSX.utils.book_append_sheet(wb, dNHWs, "Do Not Hire");

  const naWs = styleSheet(
    XLSX.utils.json_to_sheet(notAttempted.length > 0 ? buildRows(notAttempted) : [{ "No Data": "No candidates in this category" }]),
    "7F8C8D"
  );
  XLSX.utils.book_append_sheet(wb, naWs, "Not Attempted");

  const safeTitle = (interviewTitle || `interview-${interviewId}`)
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();

  XLSX.writeFile(wb, `${safeTitle}_results.xlsx`);
}
