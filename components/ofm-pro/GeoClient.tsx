"use client";

import { useState } from "react";
import { Globe } from "lucide-react";

interface GeoProps {
  aggregatedData: Record<string, number>;
  totalVisits: number;
  countryCount: number;
}

const FLAG_EMOJI: Record<string, string> = {
  US: "🇺🇸", UK: "🇬🇧", GB: "🇬🇧", DE: "🇩🇪", FR: "🇫🇷", ES: "🇪🇸",
  BR: "🇧🇷", AU: "🇦🇺", CA: "🇨🇦", NL: "🇳🇱", KR: "🇰🇷", JP: "🇯🇵",
  IN: "🇮🇳", IT: "🇮🇹", MX: "🇲🇽", CH: "🇨🇭", SE: "🇸🇪", NO: "🇳🇴",
  PL: "🇵🇱", RU: "🇷🇺", CN: "🇨🇳", AR: "🇦🇷", CO: "🇨🇴", CL: "🇨🇱",
  PH: "🇵🇭", ID: "🇮🇩", TH: "🇹🇭", SG: "🇸🇬", ZA: "🇿🇦", NG: "🇳🇬",
  EG: "🇪🇬", AE: "🇦🇪", SA: "🇸🇦", TR: "🇹🇷", PK: "🇵🇰", BD: "🇧🇩",
};

export default function GeoClient({ aggregatedData, totalVisits, countryCount }: GeoProps) {
  const sorted = Object.entries(aggregatedData).sort(([, a], [, b]) => b - a);
  const topCountry = sorted.length > 0 ? sorted[0][0] : "N/A";
  const avgPerCountry = countryCount > 0 ? Math.round(totalVisits / countryCount) : 0;
  const maxVisits = sorted.length > 0 ? sorted[0][1] : 1;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Geo Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <p className="text-sm text-gray-400">Total Visits</p>
          <p className="text-3xl font-bold text-white mt-1">{totalVisits.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <p className="text-sm text-gray-400">Top Country</p>
          <p className="text-3xl font-bold text-white mt-1">{FLAG_EMOJI[topCountry] || "🌍"} {topCountry}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <p className="text-sm text-gray-400">Countries</p>
          <p className="text-3xl font-bold text-white mt-1">{countryCount}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <p className="text-sm text-gray-400">Avg per Country</p>
          <p className="text-3xl font-bold text-white mt-1">{avgPerCountry.toLocaleString()}</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Top Countries by Visits</h2>
        {sorted.length === 0 ? (
          <p className="text-gray-500 text-sm">No geo data available. Create deep links and track clicks to see analytics.</p>
        ) : (
          <div className="space-y-3">
            {sorted.slice(0, 10).map(([country, visits]) => {
              const pct = totalVisits > 0 ? (visits / totalVisits * 100).toFixed(1) : "0";
              const barWidth = maxVisits > 0 ? (visits / maxVisits * 100) : 0;
              return (
                <div key={country} className="flex items-center gap-3">
                  <span className="text-lg w-8">{FLAG_EMOJI[country] || "🌍"}</span>
                  <span className="text-sm text-gray-300 w-8">{country}</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
                    <div className="bg-blue-500 h-6 rounded-full flex items-center pl-2 transition-all"
                      style={{ width: `${Math.max(barWidth, 5)}%` }}>
                      <span className="text-xs text-white font-medium whitespace-nowrap">
                        {visits.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 w-12 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        )}

        {totalVisits > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700 flex items-center gap-4 text-xs text-gray-400">
            <span>🌐 {totalVisits.toLocaleString()} total visits from {countryCount} countries</span>
            {sorted.length > 0 && (
              <span>📈 {sorted[0][0]} leads with {(sorted[0][1] / totalVisits * 100).toFixed(0)}% of total visits</span>
            )}
          </div>
        )}
      </div>

      {/* Full Table */}
      {sorted.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Country</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Visits</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(([country, visits]) => (
                <tr key={country} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-sm text-white">{FLAG_EMOJI[country] || "🌍"} {country}</td>
                  <td className="px-4 py-3 text-sm text-white font-medium">{visits.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {totalVisits > 0 ? (visits / totalVisits * 100).toFixed(1) : "0"}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
