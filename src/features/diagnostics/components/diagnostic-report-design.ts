export const DIAGNOSTIC_REPORT_LAYOUT = {
  coverImprovementCount: 2,
  pageWidth: 780,
  pageMinHeight: 1100,
  pagePaddingX: 92,
  pagePaddingY: 64,
  coverTopPadding: 32,
  coverLogoSize: 96,
  coverLogoMarginBottom: 48,
  coverImprovementGap: 32,
  contentImprovementGap: 24,
} as const;

export const DIAGNOSTIC_REPORT_TYPOGRAPHY = {
  title: { fontSize: 28, lineHeight: 1.2, marginBottom: 48 },
  section: {
    fontSize: 27,
    lineHeight: 1.2,
    marginTop: 40,
    marginBottom: 20,
    paddingBottom: 8,
  },
  coverImprovementTitle: {
    fontSize: 18,
    lineHeight: 1.2,
    marginTop: 24,
    marginBottom: 20,
  },
  contentImprovementTitle: {
    fontSize: 16,
    lineHeight: 1.5,
    marginTop: 16,
    marginBottom: 8,
  },
  extraTitle: { fontSize: 16, lineHeight: 1.5, marginBottom: 4 },
  subheading: {
    fontSize: 16,
    lineHeight: 1.5,
    marginTop: 16,
    marginBottom: 6,
  },
  coverDescription: { fontSize: 16, lineHeight: 1.625 },
  description: { fontSize: 15, lineHeight: 1.625 },
  uiuxOverview: { fontSize: 15, lineHeight: 1.625, marginBottom: 12 },
  bullet: { fontSize: 15, lineHeight: 1.625, indent: 40, gap: 2 },
} as const;

export const DIAGNOSTIC_REPORT_COLORS = {
  paper: "#FFFFFF",
  green: "#008F4A",
  greenSoft: "#AEBC93",
  text: "#7A7A7A",
  heading: "#616161",
  border: "#F1F5F9",
  scoreGood: "#16A34A",
  scoreGoodRing: "#DCFCE7",
  scoreMedium: "#F59E0B",
  scoreMediumRing: "#FEF3C7",
  scorePoor: "#EF4444",
  scorePoorRing: "#FEE2E2",
} as const;

export const DIAGNOSTIC_REPORT_FONTS = {
  webBody: "Arial, Helvetica, sans-serif",
  pdfBody: "Helvetica",
  pdfBodyBold: "Helvetica-Bold",
  webHeading: "'Bree Serif', Georgia, serif",
  pdfHeading: "Times-Roman",
} as const;
