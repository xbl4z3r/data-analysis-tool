import React from "react";

const HeatmapChart = ({data, observedVariables, referenceVariables, calculationMode} : {
    data: any,
    observedVariables: string[],
    referenceVariables: string[],
    calculationMode: string
}) => {
    const maxValue = Math.max(...data.flatMap((d: any) => observedVariables.map(v => d[v] || 0)));

    return (
        <div className="w-full h-full">
            <div className="grid gap-1" style={{
                gridTemplateColumns: `auto repeat(${observedVariables.length}, 1fr)`
            }}>
                {/* Header row */}
                <div className="font-bold"></div>
                {observedVariables.map(variable => (
                    <div key={variable} className="font-bold text-center text-sm p-1">
                        {variable}
                    </div>
                ))}

                {/* Data rows */}
                {data.map((item: any, idx: number) => (
                    <React.Fragment key={idx}>
                        <div className="text-sm font-medium p-1">{item.group}</div>
                        {observedVariables.map(variable => {
                            const value = item[variable] || 0;
                            const intensity = maxValue > 0 ? (value / maxValue) * 100 : 0;

                            return (
                                <div
                                    key={variable}
                                    className="text-center text-xs p-1 text-gray-900"
                                    style={{
                                        backgroundColor: `rgba(59, 130, 246, ${intensity / 100})`,
                                        color: intensity > 50 ? 'white' : 'black'
                                    }}
                                    title={`${variable}: ${value}`}
                                >
                                    {value.toFixed(2)}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default HeatmapChart;