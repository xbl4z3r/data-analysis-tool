import React from "react";
import {Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis} from "recharts";

const BoxPlotChart = ({ data, observedVariables, calculationMode, colors } : {
    data: any,
    observedVariables: string[],
    calculationMode: string
    colors: string[]
}) => {

    return (
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="group" />
            <YAxis />
            <Tooltip />
            <Legend />
            {observedVariables.map((variable: any, index: number) => (
                <React.Fragment key={variable}>
                    <Bar
                        dataKey={`${variable}_min`}
                        name={`${variable} Min`}
                        fill={colors[index % colors.length]}
                        opacity={0.3}
                    />
                    <Bar
                        dataKey={`${variable}_median`}
                        name={`${variable} Median`}
                        fill={colors[index % colors.length]}
                    />
                    <Bar
                        dataKey={`${variable}_max`}
                        name={`${variable} Max`}
                        fill={colors[index % colors.length]}
                        opacity={0.7}
                    />
                </React.Fragment>
            ))}
        </BarChart>
    );
};

export default BoxPlotChart;