import { TailoredCvData } from "@/lib/job-providers/interface";

interface Props {
  cvData: TailoredCvData;
}

/**
 * A clean, highly-polished ATS-optimised CV template matching the requested reference image.
 * Designed using clean typography, centered layout header, emoji contact details,
 * and a vertical border line table for technical skills.
 */
export function AtsDocument({ cvData }: Props) {
  // Helper to split skill string into category and items if formatted as "Category: Items"
  const parseSkill = (skillStr: string) => {
    const colonIndex = skillStr.indexOf(':');
    if (colonIndex > -1) {
      return {
        category: skillStr.substring(0, colonIndex).trim(),
        items: skillStr.substring(colonIndex + 1).trim(),
      };
    }
    return {
      category: "Skills",
      items: skillStr,
    };
  };

  return (
    <div
      id="ats-document"
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "11.5pt",
        color: "#111111",
        backgroundColor: "#ffffff",
        width: "100%",
        lineHeight: "1.45",
        padding: "0",
      }}
    >
      {/* ── HEADER ────────────────────────────────── */}
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <h1
          style={{
            fontSize: "26pt",
            fontWeight: "bold",
            color: "#111111",
            letterSpacing: "-0.5px",
            lineHeight: "1.1",
            marginBottom: "4px",
            textTransform: "uppercase",
          }}
        >
          {cvData.fullName || "CANDIDATE NAME"}
        </h1>

        {/* Headline peran yang dilamar — yang pertama dibaca HR saat screening */}
        {cvData.targetedRoles && (
          <div
            style={{
              fontSize: "11pt",
              fontWeight: "bold",
              color: "#444444",
              letterSpacing: "0.6px",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            {cvData.targetedRoles}
          </div>
        )}

        {/* Contact info row with emojis */}
        <div
          style={{
            fontSize: "9.5pt",
            color: "#333333",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "6px 12px",
            alignItems: "center",
            marginTop: "4px",
          }}
        >
          {cvData.location && (
            <span>
              <span style={{ marginRight: "3px" }}>📍</span>
              {cvData.location}
            </span>
          )}
          {cvData.location && cvData.phone && <span style={{ color: "#cccccc" }}>|</span>}
          {cvData.phone && (
            <span>
              <span style={{ marginRight: "3px" }}>📞</span>
              {cvData.phone}
            </span>
          )}
          {cvData.phone && cvData.email && <span style={{ color: "#cccccc" }}>|</span>}
          {cvData.email && (
            <span>
              <span style={{ marginRight: "3px" }}>✉️</span>
              {cvData.email}
            </span>
          )}
          {cvData.email && cvData.portfolio && <span style={{ color: "#cccccc" }}>|</span>}
          {cvData.portfolio && (
            <span>
              <span style={{ marginRight: "3px" }}>🌐</span>
              {cvData.portfolio}
            </span>
          )}
        </div>
      </div>

      {/* Main horizontal divider under header */}
      <div style={{ borderBottom: "1.5px solid #111111", marginBottom: "12px" }}></div>

      {/* ── PROFESSIONAL SUMMARY (No header title as per screenshot) ──────────────────── */}
      {cvData.professionalSummary && (
        <div style={{ marginBottom: "12px" }}>
          <p
            style={{
              fontSize: "10.5pt",
              color: "#222222",
              lineHeight: "1.45",
              textAlign: "justify",
              margin: 0,
            }}
          >
            {cvData.professionalSummary}
          </p>
        </div>
      )}

      {/* ── WORK EXPERIENCE ───────────────────────────── */}
      {cvData.experiences && cvData.experiences.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <SectionTitle>Work Experience</SectionTitle>
          <div>
            {cvData.experiences.map((exp, i) => (
              <div key={i} style={{ marginBottom: i < cvData.experiences!.length - 1 ? "10px" : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: "bold", fontSize: "11pt", color: "#111111" }}>
                    {exp.company}
                  </span>
                  <span style={{ fontWeight: "bold", fontSize: "10pt", color: "#111111" }}>
                    {exp.duration}
                  </span>
                </div>
                <div style={{ fontSize: "10pt", color: "#444444", fontStyle: "italic", marginTop: "0px", marginBottom: "4px" }}>
                  {exp.role}
                </div>
                {/* Custom Bullets */}
                {exp.highlights && exp.highlights.length > 0 && (
                  <ul style={{ listStyleType: "none", margin: 0, padding: 0 }}>
                    {exp.highlights.map((h, j) => (
                      <li key={j} style={{ display: "flex", alignItems: "flex-start", marginBottom: "3px" }}>
                        <span style={{ marginRight: "8px", fontSize: "10pt", color: "#111111", flexShrink: 0 }}>•</span>
                        <span style={{ fontSize: "10pt", color: "#222222", lineHeight: "1.45" }}>{h}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EDUCATION ────────────────────────────── */}
      {cvData.education && cvData.education.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <SectionTitle>Education</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {cvData.education.map((edu, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: "bold", fontSize: "11pt", color: "#111111" }}>
                    {edu.institution}
                  </span>
                  <span style={{ fontWeight: "bold", fontSize: "10pt", color: "#111111" }}>
                    {edu.year}
                  </span>
                </div>
                <div style={{ fontSize: "10pt", color: "#444444", fontStyle: "italic", marginTop: "2px" }}>
                  {edu.degree}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PROJECTS ────────────────────────────── */}
      {cvData.projects && cvData.projects.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <SectionTitle>Projects</SectionTitle>
          <div>
            {cvData.projects.map((proj, i) => (
              <div key={i} style={{ marginBottom: i < cvData.projects!.length - 1 ? "10px" : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: "bold", fontSize: "11pt", color: "#111111" }}>
                    {proj.name}
                  </span>
                  <span style={{ fontWeight: "bold", fontSize: "10pt", color: "#111111" }}>
                    {proj.duration}
                  </span>
                </div>
                {proj.role && (
                  <div style={{ fontSize: "10pt", color: "#444444", fontStyle: "italic", marginTop: "0px", marginBottom: "4px" }}>
                    {proj.role}
                  </div>
                )}
                {proj.highlights && proj.highlights.length > 0 && (
                  <ul style={{ listStyleType: "none", margin: 0, padding: 0 }}>
                    {proj.highlights.map((h, j) => (
                      <li key={j} style={{ display: "flex", alignItems: "flex-start", marginBottom: "3px" }}>
                        <span style={{ marginRight: "8px", fontSize: "10pt", color: "#111111", flexShrink: 0 }}>•</span>
                        <span style={{ fontSize: "10pt", color: "#222222", lineHeight: "1.45" }}>{h}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ORGANIZATION ─────────────────────────── */}
      {cvData.organizations && cvData.organizations.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <SectionTitle>Organization</SectionTitle>
          <div>
            {cvData.organizations.map((org, i) => (
              <div key={i} style={{ marginBottom: i < cvData.organizations!.length - 1 ? "10px" : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: "bold", fontSize: "11pt", color: "#111111" }}>
                    {org.name}
                  </span>
                  <span style={{ fontWeight: "bold", fontSize: "10pt", color: "#111111" }}>
                    {org.duration}
                  </span>
                </div>
                {org.role && (
                  <div style={{ fontSize: "10pt", color: "#444444", fontStyle: "italic", marginTop: "0px", marginBottom: "4px" }}>
                    {org.role}
                  </div>
                )}
                {org.highlights && org.highlights.length > 0 && (
                  <ul style={{ listStyleType: "none", margin: 0, padding: 0 }}>
                    {org.highlights.map((h, j) => (
                      <li key={j} style={{ display: "flex", alignItems: "flex-start", marginBottom: "3px" }}>
                        <span style={{ marginRight: "8px", fontSize: "10pt", color: "#111111", flexShrink: 0 }}>•</span>
                        <span style={{ fontSize: "10pt", color: "#222222", lineHeight: "1.45" }}>{h}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TECHNICAL SKILLS & COMPETENCIES ───────────────────────────── */}
      {cvData.skills && cvData.skills.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <SectionTitle>Skills</SectionTitle>
          <table style={{ width: "100%", borderCollapse: "collapse", margin: 0 }}>
            <tbody>
              {cvData.skills.map((skillStr, index) => {
                const parsed = parseSkill(skillStr);
                return (
                  <tr key={index}>
                    <td
                      style={{
                        width: "25%",
                        fontWeight: "bold",
                        fontSize: "10.5pt",
                        color: "#111111",
                        verticalAlign: "top",
                        padding: "4px 10px 4px 0",
                        lineHeight: "1.4",
                      }}
                    >
                      {parsed.category}
                    </td>
                    <td
                      style={{
                        width: "75%",
                        fontSize: "10.5pt",
                        color: "#222222",
                        verticalAlign: "top",
                        padding: "4px 0 4px 12px",
                        borderLeft: "1.5px solid #222222",
                        lineHeight: "1.4",
                      }}
                    >
                      {parsed.items}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "12.5pt",
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        color: "#111111",
        borderBottom: "1.5px solid #111111",
        paddingBottom: "3px",
        marginBottom: "8px",
        marginTop: "16px",
      }}
    >
      {children}
    </div>
  );
}
