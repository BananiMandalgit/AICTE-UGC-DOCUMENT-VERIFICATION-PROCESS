import React, { useState } from "react";
import { ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import type { ComponentDrilldown } from "@/types/placements";

interface PlacementComponentDrilldownProps {
  data: ComponentDrilldown;
}

const PlacementComponentDrilldown: React.FC<PlacementComponentDrilldownProps> = ({ data }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    placement: true,
    salary: true,
    industry: true,
    higherEd: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend.includes("↑")) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend.includes("↓")) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <div className="w-4 h-4 text-gray-400">→</div>;
  };

  return (
    <div className="space-y-4">
      {/* Placement Metrics Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("placement")}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition"
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-blue-600">{data.placementMetrics.summary.score}%</div>
            <div>
              <h3 className="font-semibold text-gray-900">Placement Metrics</h3>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                {data.placementMetrics.summary.trend}
                <TrendIcon trend={data.placementMetrics.summary.trend} />
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-600 transition ${expandedSections.placement ? "rotate-180" : ""}`}
          />
        </button>

        {expandedSections.placement && (
          <div className="p-4 bg-white space-y-4">
            {/* Summary Details */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600 uppercase">Overall</p>
                <p className="text-2xl font-bold text-blue-600">{data.placementMetrics.details.overall}%</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-600 uppercase">Core Placement</p>
                <p className="text-2xl font-bold text-green-600">{data.placementMetrics.details.core}%</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-gray-600 uppercase">Non-Core</p>
                <p className="text-2xl font-bold text-orange-600">{data.placementMetrics.details.nonCore}%</p>
              </div>
            </div>

            {/* Year-wise Breakdown */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Year-wise Breakdown</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.placementMetrics.drillDown.yearwise.map((item) => (
                  <div key={item.year} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium text-gray-700">AY {item.year}</span>
                    <div className="flex gap-4">
                      <span className="text-sm">
                        <span className="text-green-600 font-semibold">{item.core}%</span>
                        <span className="text-gray-500"> core</span>
                      </span>
                      <span className="text-sm">
                        <span className="text-orange-600 font-semibold">{item.nonCore}%</span>
                        <span className="text-gray-500"> non-core</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Salary Metrics Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("salary")}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition"
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-green-600">₹{data.salaryMetrics.summary.average}L</div>
            <div>
              <h3 className="font-semibold text-gray-900">Salary Metrics</h3>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                {data.salaryMetrics.summary.trend}
                <TrendIcon trend={data.salaryMetrics.summary.trend} />
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-600 transition ${expandedSections.salary ? "rotate-180" : ""}`}
          />
        </button>

        {expandedSections.salary && (
          <div className="p-4 bg-white space-y-4">
            {/* Salary Range */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-gray-600 uppercase">Min Salary</p>
                <p className="text-2xl font-bold text-red-600">₹{data.salaryMetrics.details.minSalary}L</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-600 uppercase">Avg Salary</p>
                <p className="text-2xl font-bold text-green-600">₹{data.salaryMetrics.details.avgSalaryLpa}L</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600 uppercase">Max Salary</p>
                <p className="text-2xl font-bold text-blue-600">₹{data.salaryMetrics.details.maxSalary}L</p>
              </div>
            </div>

            {/* Industry Breakdown */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Salary by Industry</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.salaryMetrics.drillDown.byIndustry.map((item) => (
                  <div key={item.industry} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.industry}</p>
                      <p className="text-sm text-gray-600">{item.count} students ({item.percentage}%)</p>
                    </div>
                    <p className="font-bold text-blue-600">₹{item.avgSalary}L</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Salary Distribution */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Salary Distribution</h4>
              <div className="space-y-2">
                {data.salaryMetrics.drillDown.salaryDistribution.map((item) => (
                  <div key={item.range} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{item.range}</span>
                        <span className="text-sm font-medium text-gray-700">{item.count} students</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Industry Engagement Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("industry")}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition"
        >
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">Industry Engagement</h3>
              <p className="text-sm text-gray-600">
                {data.industryEngagement.summary.mous} MoUs • {data.industryEngagement.summary.internships} Internships
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-600 transition ${expandedSections.industry ? "rotate-180" : ""}`}
          />
        </button>

        {expandedSections.industry && (
          <div className="p-4 bg-white space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-gray-600 uppercase">Total MoUs</p>
                <p className="text-2xl font-bold text-purple-600">{data.industryEngagement.details.industryMoUs}</p>
                <p className="text-xs text-gray-500 mt-1">{data.industryEngagement.details.moUsPerYear} per year</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600 uppercase">Internships</p>
                <p className="text-2xl font-bold text-blue-600">{data.industryEngagement.details.internshipsCount}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.industryEngagement.details.internshipCoveragePercent}% coverage
                </p>
              </div>
            </div>

            {/* Top Industries */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Top Industries (MoUs)</h4>
              <div className="space-y-2">
                {data.industryEngagement.drillDown.topIndustries.map((item) => (
                  <div key={item.industry} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium text-gray-700">{item.industry}</span>
                    <span className="font-bold text-purple-600">{item.moUs} MoUs</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trends */}
            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">MoU Trend</h4>
                <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
                  {data.industryEngagement.drillDown.mouTrend.map((item) => (
                    <div key={item.year} className="flex justify-between">
                      <span className="text-gray-600">AY {item.year}</span>
                      <span className="font-medium text-gray-900">{item.mous}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Internship Trend</h4>
                <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
                  {data.industryEngagement.drillDown.internshipTrend.map((item) => (
                    <div key={item.year} className="flex justify-between">
                      <span className="text-gray-600">AY {item.year}</span>
                      <span className="font-medium text-gray-900">{item.internships}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Higher Education Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("higherEd")}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 transition"
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-amber-600">{data.higherEducation.summary.percentage}%</div>
            <div>
              <h3 className="font-semibold text-gray-900">Higher Education Rate</h3>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                {data.higherEducation.summary.trend}
                <TrendIcon trend={data.higherEducation.summary.trend} />
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-600 transition ${expandedSections.higherEd ? "rotate-180" : ""}`}
          />
        </button>

        {expandedSections.higherEd && (
          <div className="p-4 bg-white space-y-4">
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-xs text-gray-600 uppercase">Students in Higher Education</p>
              <p className="text-2xl font-bold text-amber-600">{data.higherEducation.details.studentsInHigherEd}</p>
            </div>

            {/* Year-wise Comparison */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Placement vs Higher Education vs Unemployed</h4>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {data.higherEducation.drillDown.comparison.placementVsHigherEd.map((item) => (
                  <div key={item.year} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">AY {item.year}</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Placed</p>
                        <p className="font-bold text-green-600">{item.placed}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Higher Ed</p>
                        <p className="font-bold text-blue-600">{item.higherEd}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Unemployed</p>
                        <p className="font-bold text-red-600">{item.unemployed}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlacementComponentDrilldown;
