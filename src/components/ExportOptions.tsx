// src/components/ExportOptions.tsx
import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import DataAnalysisGenerator from "@/components/DataAnalysisGenerator";

const ExportOptions = ({ chartRef, data, dictionaryData, filename, referenceVariables = [], observedVariables = [], calculationMode = 'average', chartType = 'bar' } : {
    chartRef: any,
    data: any[],
    dictionaryData: any[]
    filename: string,
    referenceVariables?: string[],
    observedVariables?: string[],
    calculationMode?: string,
    chartType?: string
}) => {
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

    // Existing export functions
    const downloadAsImage = () => {
        if (!chartRef.current) return;

        const svg = chartRef.current.querySelector('svg');
        if (!svg) return;

        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svg);

        const blob = new Blob([source], {type: 'image/svg+xml'});
        saveAs(blob, `${filename}.svg`);
    };

    const downloadAsCSV = () => {
        if (!data || !data.length) return;

        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row =>
            Object.values(row).map(val =>
                typeof val === 'string' ? `"${val}"` : val
            ).join(',')
        );

        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], {type: 'text/csv;charset=utf-8'});
        saveAs(blob, `${filename}.csv`);
    };

    // Handle completed analysis
    const handleAnalysisComplete = (analysis: string) => {
        setAiAnalysis(analysis);
    };

    return (
        <div className="mb-4">
            <div className="flex flex-wrap gap-2 justify-center items-center mb-3">
                <button
                    onClick={downloadAsImage}
                    className="bg-indigo-500 text-white px-3 py-1 text-sm rounded hover:bg-indigo-600"
                >
                    Export Chart (SVG)
                </button>
                <button
                    onClick={downloadAsCSV}
                    className="bg-indigo-500 text-white px-3 py-1 text-sm rounded hover:bg-indigo-600"
                >
                    Export Data (CSV)
                </button>
                <DataAnalysisGenerator
                    data={data}
                    dictionaryData={dictionaryData}
                    referenceVariables={referenceVariables}
                    observedVariables={observedVariables}
                    calculationMode={calculationMode}
                    chartType={chartType}
                    onAnalysisComplete={handleAnalysisComplete}
                />
            </div>

            {aiAnalysis && (
                <div className="p-3 border rounded bg-gray-50 dark:bg-gray-800">
                    <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-100">AI Analysis</h3>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                        {aiAnalysis.split('\n').map((paragraph, i) => (
                            paragraph.trim() ? <p key={i} className="mb-2">{paragraph}</p> : null
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExportOptions;