const YEARS = Array.from({ length: 11 }, (_, index) => 2015 + index);

const remarkTemplates = [
  "Strengthened outcome-based placement coaching and mock industry days",
  "Expanded industry immersion weeks with NAAC partner companies",
  "Scaled apprenticeship + higher education counselling collaboration",
  "Invested in domain labs and Centres of Excellence for core hiring",
  "Broadened alumni mentoring and internship stack for Tier-3 recruiters"
];

const lerp = (start, end, fraction) => start + (end - start) * fraction;

const buildPlacementHistory = (config) => {
  const {
    eligibleBase,
    eligibleGrowth,
    placementStart,
    placementEnd,
    avgSalaryStart,
    avgSalaryEnd,
    coreStart,
    coreEnd,
    mouStart,
    mouEnd,
    internshipStart,
    internshipEnd,
    higherEdStart,
    higherEdEnd,
    remarkFocus
  } = config;

  return YEARS.map((year, index) => {
    const fraction = index / (YEARS.length - 1);
    const eligibleStudents = Math.round(eligibleBase + eligibleGrowth * index);
    const placementRate = lerp(placementStart, placementEnd, fraction);
    const studentsPlaced = Math.round(eligibleStudents * placementRate);
    const placementPercent = Number(((studentsPlaced / Math.max(eligibleStudents, 1)) * 100).toFixed(1));
    const academicSession = `${year}-${String((year + 1) % 100).padStart(2, "0")}`;

    return {
      academicYear: year,
      academicSession,
      eligibleStudents,
      studentsPlaced,
      placementPercent,
      avgSalaryLpa: Number(lerp(avgSalaryStart, avgSalaryEnd, fraction).toFixed(1)),
      corePlacementPercent: Number(lerp(coreStart, coreEnd, fraction).toFixed(1)),
      industryMoUs: Math.round(lerp(mouStart, mouEnd, fraction)),
      internshipsCount: Math.round(lerp(internshipStart, internshipEnd, fraction)),
      higherEducationPercent: Number(lerp(higherEdStart, higherEdEnd, fraction).toFixed(1)),
      complianceRemarks: `${remarkFocus} · ${remarkTemplates[index % remarkTemplates.length]}`
    };
  });
};

const placementInstitutions = [
  {
    collegeCode: "AIT-PUN",
    collegeName: "Aurora Institute of Technology",
    state: "Maharashtra",
    university: "Savitribai Phule Pune University",
    sectorFocus: "AI & Advanced Manufacturing",
    history: buildPlacementHistory({
      eligibleBase: 420,
      eligibleGrowth: 25,
      placementStart: 0.68,
      placementEnd: 0.94,
      avgSalaryStart: 3.8,
      avgSalaryEnd: 11.2,
      coreStart: 0.58,
      coreEnd: 0.82,
      mouStart: 6,
      mouEnd: 22,
      internshipStart: 80,
      internshipEnd: 320,
      higherEdStart: 0.14,
      higherEdEnd: 0.23,
      remarkFocus: "Autonomous Control Systems" 
    })
  },
  {
    collegeCode: "NSE-PAT",
    collegeName: "Nalanda School of Engineering",
    state: "Bihar",
    university: "Aryabhatta Knowledge University",
    sectorFocus: "Sustainable Construction",
    history: buildPlacementHistory({
      eligibleBase: 360,
      eligibleGrowth: 20,
      placementStart: 0.52,
      placementEnd: 0.86,
      avgSalaryStart: 3.1,
      avgSalaryEnd: 8.4,
      coreStart: 0.47,
      coreEnd: 0.71,
      mouStart: 4,
      mouEnd: 17,
      internshipStart: 60,
      internshipEnd: 240,
      higherEdStart: 0.18,
      higherEdEnd: 0.28,
      remarkFocus: "Rural Infrastructure Tech" 
    })
  },
  {
    collegeCode: "HAS-SLN",
    collegeName: "Himalayan Advanced Studies",
    state: "Himachal Pradesh",
    university: "Himachal Pradesh Technical University",
    sectorFocus: "Clean Energy Systems",
    history: buildPlacementHistory({
      eligibleBase: 280,
      eligibleGrowth: 18,
      placementStart: 0.48,
      placementEnd: 0.81,
      avgSalaryStart: 2.9,
      avgSalaryEnd: 7.2,
      coreStart: 0.42,
      coreEnd: 0.68,
      mouStart: 3,
      mouEnd: 15,
      internshipStart: 50,
      internshipEnd: 210,
      higherEdStart: 0.22,
      higherEdEnd: 0.34,
      remarkFocus: "Mountain Mobility & Energy" 
    })
  },
  {
    collegeCode: "SIS-CHD",
    collegeName: "Saraswati Institute of Science",
    state: "Chandigarh",
    university: "Panjab University",
    sectorFocus: "Embedded & Defence Systems",
    history: buildPlacementHistory({
      eligibleBase: 390,
      eligibleGrowth: 22,
      placementStart: 0.62,
      placementEnd: 0.9,
      avgSalaryStart: 3.4,
      avgSalaryEnd: 9.7,
      coreStart: 0.53,
      coreEnd: 0.79,
      mouStart: 5,
      mouEnd: 19,
      internshipStart: 70,
      internshipEnd: 270,
      higherEdStart: 0.16,
      higherEdEnd: 0.26,
      remarkFocus: "Defence Avionics" 
    })
  },
  {
    collegeCode: "VIC-BLR",
    collegeName: "Vivekananda Innovation College",
    state: "Karnataka",
    university: "Visvesvaraya Technological University",
    sectorFocus: "Deep Tech Product Engineering",
    history: buildPlacementHistory({
      eligibleBase: 450,
      eligibleGrowth: 30,
      placementStart: 0.7,
      placementEnd: 0.95,
      avgSalaryStart: 4.2,
      avgSalaryEnd: 12.4,
      coreStart: 0.61,
      coreEnd: 0.86,
      mouStart: 7,
      mouEnd: 26,
      internshipStart: 90,
      internshipEnd: 360,
      higherEdStart: 0.12,
      higherEdEnd: 0.21,
      remarkFocus: "Product Incubation" 
    })
  }
];

const placementRecords = placementInstitutions.flatMap((inst) =>
  inst.history.map((row) => ({
    ...row,
    collegeCode: inst.collegeCode,
    collegeName: inst.collegeName,
    state: inst.state,
    university: inst.university,
    sectorFocus: inst.sectorFocus
  }))
);

module.exports = { placementInstitutions, placementRecords };
