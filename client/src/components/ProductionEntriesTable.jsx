import React from 'react';

// The exact columns as requested
const COLUMN_LABELS = [
  'S.No.',
  'Job Card No.',
  'Part Name (No.)',
  'Opr. No.',
  'Plan (Lot) Qty',
  'Start Date',
  'Target Date',
  'Actual Date',
  'Actual OEE (%)',
  'Actual Prod Qty',
  'Target Prod. Qty',
  'Rejection (Qty)',
  'Cycle Time (In Min)',
  'Target Setting Time (Hr.)',
  'Target Duration (In Hrs.)',
  'Actual Duration (In Hrs.)',
  'Extra Meal',
  'Actual Duration For OEE',
  'Difference (Hrs.)',
  'M/C Ref. Time (Exer)',
  'Tea & Lunch Break',
  'Meeting & Training',
  'Extra Sett. Time',
  'Chip Disp. Time',
  'Tool Change/Setting Time',
  'Insert Change Time',
  'Drill Change Time',
  'Tap Change Time',
  'Diamen. Prob. Time',
  'Q.C. Check Time',
  'Operator Prob. Time',
  'Power Cut Time',
  'Air Pressure Low Time',
  'CT. Reduce Time',
  'M/C Hold Time',
  'Prod. Loss. Time',
  'Prog. Edit/ Make Time',
  'Raw Mtl. Shortage Time',
  'Rework /End PCS. Machining Time',
  'M/C Alarm Time',
  'M/C Maint. Time',
  'Total Loss (In Hrs)'
];

export default function ProductionEntriesTable({ entries }) {
  if (!entries || entries.length === 0) {
    return <div className="text-gray-500">No production entries found for the selected job card number.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-blue-50">
            {COLUMN_LABELS.map(label => (
              <th key={label} className="border px-2 py-1 text-xs whitespace-nowrap">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr key={idx} className="border-t">
              {COLUMN_LABELS.map(label => (
                <td key={label} className="border px-2 py-1 text-xs whitespace-nowrap">
                  {entry[label] || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
