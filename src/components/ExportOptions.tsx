import React from 'react';
import {saveAs} from 'file-saver';

const ExportOptions = ({chartRef, data, filename = 'olympic-analysis'}: {
    chartRef: React.RefObject<HTMLDivElement> | React.RefObject<null>,
    data: any[],
    filename?: string
}) => {
    if(!chartRef) return null;

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

    return (
        <div className="flex gap-2 justify-center items-center">
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
        </div>
    );
};

export default ExportOptions;