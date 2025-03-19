import React from "react";
import {Area, ComposedChart, Legend, Line, Tooltip, XAxis, YAxis} from "recharts";

const ViolinPlotChart = ({ data, observedVariables, colors } : {
    data: any,
    observedVariables: string[],
    colors: string[]
}) => {
    return (
        <ComposedChart width={500} height={300} data={data} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {observedVariables.map((variable: any, index: number) => (
                <React.Fragment key={variable}>
                    {/* Violin outline - two curved areas back-to-back */}
                    <Area
                        dataKey={`${variable}_density_left`}
                        stroke={colors[index % colors.length]}
                        fillOpacity={0.3}
                        fill={colors[index % colors.length]}
                    />
                    <Area
                        dataKey={`${variable}_density_right`}
                        stroke={colors[index % colors.length]}
                        fillOpacity={0.3}
                        fill={colors[index % colors.length]}
                    />
                    {/* Center line showing median */}
                    <Line
                        dataKey={`${variable}_median`}
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                    />
                </React.Fragment>
            ))}
        </ComposedChart>
    );
};

export default ViolinPlotChart;