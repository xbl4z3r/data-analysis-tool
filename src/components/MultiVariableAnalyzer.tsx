import React, {useEffect, useRef, useState} from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import ExportOptions from "@/components/ExportOptions";
import BoxPlotChart from "@/components/BoxPlotChart";
import HeatmapChart from "@/components/HeatmapChart";
import ViolinPlotChart from "@/components/ViolinPlotChart";

const MultiVariableAnalyzer = ({data = [], dictionaryData = []}) => {
    const [referenceVariables, setReferenceVariables] = useState<string[]>([]);
    const [hasNonNumericData, setHasNonNumericData] = useState(false);
    const [referenceVariableToAdd, setReferenceVariableToAdd] = useState('');
    const [observedVariables, setObservedVariables] = useState<string[]>([]);
    const [variableToObserve, setVariableToObserve] = useState('');
    const [chartType, setChartType] = useState('bar');
    const [analysisData, setAnalysisData] = useState<any>([]);
    const [calculationMode, setCalculationMode] = useState('average');
    const [isExpanded, setIsExpanded] = useState(true);
    const chartContainerRef = useRef(null);

    const maxGroups = 100;
    const chartColors = [
        '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe',
        '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'
    ];

    const checkForNonNumericData = (analysisData: any[]) => {
        if (!analysisData.length || !observedVariables.length) return false;

        for (const item of data) {
            for (const variable of observedVariables) {
                const value = item[variable];
                // Check if value exists and is not numeric
                if (value !== undefined && value !== null &&
                    (isNaN(parseFloat(value)) || !isFinite(value))) {
                    return true;
                }
            }
        }
        return false;
    };

    const getVariableDescription = (varName: string) => {
        const variable: any = dictionaryData.find((v: any) => v.name === varName);
        return variable ? variable.description : '';
    };

    const getValueDescription = (varName: string, value: string) => {
        const variable: any = dictionaryData.find((v: any) => v.name === varName);
        if (!variable || !variable.values) return null;

        const valueObj = variable.values.find((v: any) => v.value.toString() === value.toString());
        return valueObj ? valueObj.description : null;
    };

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    useEffect(() => {
        if (referenceVariables.length > 0 && observedVariables.length > 0 && data.length > 0) {
            const newData: any = generateAnalysisData();
            setAnalysisData(newData);

            // Check for non-numeric data and update state and chart type if needed
            const nonNumericDetected = checkForNonNumericData(data);
            setHasNonNumericData(nonNumericDetected);

            // Force bar chart if non-numeric data is detected
            if (nonNumericDetected && chartType !== 'bar' && chartType !== 'pie') {
                setChartType('bar');
            }
        } else {
            setAnalysisData([]);
        }
    }, [referenceVariables, observedVariables, data, calculationMode]);

    // Enhance the generateAnalysisData function to better handle non-numeric data
    const generateAnalysisData = () => {
        if (observedVariables.length === 0 || data.length === 0) {
            return [];
        }

        let groupedData: any = {};
        const groups: any[] = [];

        // First pass: create the data structure
        data.forEach(item => {
            // @ts-ignore
            const groupValues = referenceVariables.map(refVar => item[refVar]?.toString() || "N/A");
            const groupKey = groupValues.join("/");

            if (!groupedData[groupKey]) {
                groupedData[groupKey] = {
                    name: groupValues.join(", "),
                    key: groupKey,
                    count: 0,
                    _entryCount: 0
                };

                referenceVariables.forEach((refVar, idx) => {
                    groupedData[groupKey][`ref_${refVar}`] = groupValues[idx];
                });

                observedVariables.forEach(variable => {
                    groupedData[groupKey][variable] = 0;
                    groupedData[groupKey][`${variable}_count`] = 0;
                    groupedData[groupKey][`${variable}_min`] = Infinity;
                    groupedData[groupKey][`${variable}_max`] = -Infinity;
                    groupedData[groupKey][`${variable}_values`] = [];
                    // Track non-numeric values separately
                    groupedData[groupKey][`${variable}_non_numeric`] = {};
                });

                groups.push(groupedData[groupKey]);
            }
        });

        // Second pass: data processing
        data.forEach(item => {
            // @ts-ignore
            const groupValues = referenceVariables.map(refVar => item[refVar]?.toString() || "N/A");
            const groupKey = groupValues.join("/");

            if (groupedData[groupKey]) {
                groupedData[groupKey].count++;
                groupedData[groupKey]._entryCount++;

                observedVariables.forEach(variable => {
                    const rawValue = item[variable];
                    const value = parseFloat(rawValue);

                    if (!isNaN(value)) {
                        // Handle numeric values
                        if (value >= 0) {  // Only process non-negative values
                            groupedData[groupKey][variable] += value;
                            groupedData[groupKey][`${variable}_count`]++;
                            groupedData[groupKey][`${variable}_min`] = Math.min(groupedData[groupKey][`${variable}_min`], value);
                            groupedData[groupKey][`${variable}_max`] = Math.max(groupedData[groupKey][`${variable}_max`], value);
                            groupedData[groupKey][`${variable}_values`].push(value);
                        }
                    } else if (rawValue !== undefined && rawValue !== null) {
                        // Handle non-numeric values by counting occurrences
                        const strValue = String(rawValue);
                        if (!groupedData[groupKey][`${variable}_non_numeric`][strValue]) {
                            groupedData[groupKey][`${variable}_non_numeric`][strValue] = 0;
                        }
                        groupedData[groupKey][`${variable}_non_numeric`][strValue]++;

                        // For non-numeric data, we'll use the count as the value for charts
                        groupedData[groupKey][`${variable}_count`]++;
                    }
                });
            }
        });

        // Third pass: finalize calculations
        Object.values(groupedData).forEach((group: any) => {
            observedVariables.forEach(variable => {
                const hasNonNumeric = Object.keys(group[`${variable}_non_numeric`]).length > 0;
                const hasNumeric = group[`${variable}_count`] > 0;

                if (hasNumeric) {
                    const values = group[`${variable}_values`];

                    switch (calculationMode) {
                        case 'average':
                            group[variable] = values.length ? values.reduce((a: number, b: number) => a + b, 0) / values.length : 0;
                            break;
                        case 'sum':
                            group[variable] = values.reduce((a: number, b: number) => a + b, 0);
                            break;
                        case 'count':
                            group[variable] = values.length;
                            break;
                        case 'min':
                            group[variable] = values.length ? Math.min(...values) : 0;
                            break;
                        case 'max':
                            group[variable] = values.length ? Math.max(...values) : 0;
                            break;
                        case 'median':
                            if (values.length) {
                                values.sort((a: number, b: number) => a - b);
                                const mid = Math.floor(values.length / 2);
                                group[variable] = values.length % 2 === 0
                                    ? (values[mid - 1] + values[mid]) / 2
                                    : values[mid];
                            } else {
                                group[variable] = 0;
                            }
                            break;
                    }
                } else if (hasNonNumeric) {
                    // For non-numeric data, use count or most frequent value depending on chart type
                    const nonNumericValues = group[`${variable}_non_numeric`];
                    const entries = Object.entries(nonNumericValues);

                    // Find the most frequent non-numeric value
                    const mostFrequent = entries.reduce(
                        (max: any, current: any) => current[1] > max[1] ? current : max,
                        ["", 0]
                    );

                    // Use count by default
                    group[variable] = entries.reduce((sum, [_, count]: any) => sum + count, 0);

                    // Store the most frequent value for tooltips
                    group[`${variable}_most_frequent`] = mostFrequent[0];
                    group[`${variable}_frequency`] = mostFrequent[1];
                }

                // Clean up temporary fields but keep non-numeric data for tooltips
                delete group[`${variable}_count`];
                delete group[`${variable}_min`];
                delete group[`${variable}_max`];
                delete group[`${variable}_values`];
            });
        });

        return Object.values(groupedData);
    };

    const addReferenceVariable = () => {
        if (referenceVariableToAdd && !referenceVariables.includes(referenceVariableToAdd)) {
            setReferenceVariables([...referenceVariables, referenceVariableToAdd]);
            setReferenceVariableToAdd('');
        }
    };

    // Remove reference variable
    const removeReferenceVariable = (variable: string) => {
        setReferenceVariables(referenceVariables.filter(v => v !== variable));
    };

    const addObservedVariable = () => {
        if (variableToObserve && !observedVariables.includes(variableToObserve)) {
            setObservedVariables([...observedVariables, variableToObserve]);
            setVariableToObserve('');
        }
    };

    const removeObservedVariable = (variable: string) => {
        setObservedVariables(observedVariables.filter(v => v !== variable));
    };

    const CustomTooltip = ({active, payload, label}: {
        active?: boolean,
        payload?: any[],
        label?: string
    }) => {
        if (!active || !payload || payload.length === 0) return null;

        return (
            <div
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700">
                <p className="font-medium text-gray-800 dark:text-gray-100">{label}</p>
                <div className="text-sm font-medium text-gray-700 border-b mb-2 pb-1">
                    Entries: {payload[0]?.payload._entryCount || 0}
                </div>

                {payload.map((entry, index) => {
                    const varName = entry.name.split(' ')[0];
                    const desc = getVariableDescription(varName);
                    const hasNonNumeric = payload[0]?.payload[`${varName}_non_numeric`] &&
                        Object.keys(payload[0]?.payload[`${varName}_non_numeric`]).length > 0;

                    return (
                        <div key={index} className="text-sm">
                            <span style={{color: entry.color}}>{entry.name}: </span>
                            <span className="font-medium text-gray-800 dark:text-gray-100">
                            {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
                        </span>
                            {hasNonNumeric && payload[0]?.payload[`${varName}_most_frequent`] && (
                                <span className="text-xs ml-1 text-gray-600">
                                (Most common: {payload[0]?.payload[`${varName}_most_frequent`]})
                            </span>
                            )}
                            {desc && <p className="text-xs text-gray-500">{desc}</p>}
                        </div>
                    );
                })}

                {referenceVariables.map(refVar => {
                    const refValue = payload[0]?.payload[`ref_${refVar}`];
                    if (!refValue) return null;

                    const valueDesc = getValueDescription(refVar, refValue);
                    if (!valueDesc) return null;

                    return (
                        <div key={refVar} className="mt-1 text-xs border-t pt-1">
                            <span className="font-medium text-gray-800 dark:text-gray-100">{refVar}: {refValue}</span>
                            <div className="text-gray-500 text-xs italic flex-wrap">{valueDesc}</div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderChart = () => {
        if (analysisData.length === 0) return (
            <></>
        );

        switch (chartType) {
            case 'scatter':
                return (
                    <ScatterChart margin={{top: 20, right: 30, left: 20, bottom: 30}}>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="group" name="Group"/>
                        <YAxis/>
                        <Tooltip cursor={{strokeDasharray: '3 3'}}/>
                        <Legend/>
                        {observedVariables.map((variable, index) => (
                            <Scatter
                                key={variable}
                                name={variable}
                                data={analysisData.map((item: any) => ({
                                    x: item.group,
                                    y: item[variable] || 0,
                                    z: 200 // fixed size for scatter points
                                }))}
                                fill={chartColors[index % chartColors.length]}
                            />
                        ))}
                    </ScatterChart>
                );

            case 'bubble':
                return (
                    <ScatterChart margin={{top: 20, right: 30, left: 20, bottom: 30}}>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="group" name="Group"/>
                        <YAxis/>
                        <Tooltip cursor={{strokeDasharray: '3 3'}}/>
                        <Legend/>
                        {observedVariables.map((variable, index) => (
                            <Scatter
                                key={variable}
                                name={variable}
                                data={analysisData.map((item: any) => ({
                                    x: item.group,
                                    y: item[variable] || 0,
                                    z: Math.max(50, item[variable] * 5 || 100) // bubble size based on value
                                }))}
                                fill={chartColors[index % chartColors.length]}
                            />
                        ))}
                    </ScatterChart>
                );

            case 'heatmap':
                // For heatmap we need to transform data into a matrix format
                return (
                    <div className="heatmap-container">
                        <HeatmapChart
                            data={analysisData}
                            observedVariables={observedVariables}
                            referenceVariables={referenceVariables}
                            calculationMode={calculationMode}
                        />
                    </div>
                );

            case 'boxplot':
                return (
                    <BoxPlotChart
                        data={analysisData}
                        observedVariables={observedVariables}
                        calculationMode={calculationMode}
                        colors={chartColors}
                    />
                );

            case 'violin':
                return (
                    <ViolinPlotChart
                        data={analysisData}
                        observedVariables={observedVariables}
                        colors={chartColors}
                    />
                );

            case 'bar':
                return (
                    <BarChart data={analysisData}>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="name"/>
                        <YAxis/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Legend/>
                        {observedVariables.map((variable, index) => (
                            <Bar
                                key={variable}
                                dataKey={variable}
                                fill={chartColors[index % chartColors.length]}
                                name={`${variable} (${calculationMode})`}
                            />
                        ))}
                    </BarChart>
                );

            case 'line':
                return (
                    <LineChart data={analysisData}>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="name"/>
                        <YAxis/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Legend/>
                        {observedVariables.map((variable, index) => (
                            <Line
                                key={variable}
                                type="monotone"
                                dataKey={variable}
                                stroke={chartColors[index % chartColors.length]}
                                name={`${variable} (${calculationMode})`}
                            />
                        ))}
                    </LineChart>
                );

            case 'area':
                return (
                    <AreaChart data={analysisData}>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="name"/>
                        <YAxis/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Legend/>
                        {observedVariables.map((variable, index) => (
                            <Area
                                key={variable}
                                type="monotone"
                                dataKey={variable}
                                fill={chartColors[index % chartColors.length]}
                                stroke={chartColors[index % chartColors.length]}
                                name={`${variable} (${calculationMode})`}
                            />
                        ))}
                    </AreaChart>
                );

            case 'radar':
                return (
                    <RadarChart outerRadius={90} width={500} height={300} data={analysisData}>
                        <PolarGrid/>
                        <PolarAngleAxis dataKey="name"/>
                        <PolarRadiusAxis/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Legend/>
                        {observedVariables.map((variable, index) => (
                            <Radar
                                key={variable}
                                name={`${variable} (${calculationMode})`}
                                dataKey={variable}
                                stroke={chartColors[index % chartColors.length]}
                                fill={chartColors[index % chartColors.length]}
                                fillOpacity={0.6}
                            />
                        ))}
                    </RadarChart>
                );

            case 'pie':
                // Pie chart works best with a single observed variable
                const selectedVariable = observedVariables[0];
                if (!selectedVariable) return (
                    <></>
                );

                return (
                    <PieChart>
                        <Pie
                            data={analysisData}
                            dataKey={selectedVariable}
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            fill="#8884d8"
                            label={(entry) => entry.name}
                        >
                            {analysisData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]}/>
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Legend/>
                    </PieChart>
                );

            default:
                return (
                    <BarChart data={analysisData}>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="name"/>
                        <YAxis/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Legend/>
                        {observedVariables.map((variable, index) => (
                            <Bar key={variable} dataKey={variable} fill={chartColors[index % chartColors.length]}/>
                        ))}
                    </BarChart>
                );
        }
    };

    return (
        <div
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700 justify-center items-center">
            <div className="flex justify-between items-center cursor-pointer" onClick={toggleExpand}>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Multi-Variable Analysis</h2>
                <button
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none cursor-pointer">
                    {isExpanded ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20"
                             fill="currentColor">
                            <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                                  clipRule="evenodd"/>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20"
                             fill="currentColor">
                            <path fillRule="evenodd"
                                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                  clipRule="evenodd"/>
                        </svg>
                    )}
                </button>
            </div>

            {isExpanded && (
                <>
                    <p className="text-sm text-gray-600 mb-4">
                        Analyze how reference variables relate to multiple observed variables
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <h3 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-100">Reference
                                Variables (Categories)</h3>
                            <div className="flex flex-wrap gap-2 mb-3 max-w-xl">
                                {referenceVariables.map(variable => (
                                    <div key={variable}
                                         className="bg-blue-500 px-2 py-1 rounded flex items-center max-w-xl">
                                        <span className="mr-2">
                                            {variable}
                                        </span>
                                        <button
                                            onClick={() => removeReferenceVariable(variable)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                                {referenceVariables.length === 0 && (
                                    <p className="text-gray-500 italic">No reference variables selected</p>
                                )}
                            </div>

                            <div className="flex gap-2 mb-4">
                                <select
                                    value={referenceVariableToAdd}
                                    onChange={(e) => setReferenceVariableToAdd(e.target.value)}
                                    className="flex-grow border p-2 rounded text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700"
                                >
                                    <option value="">Select a reference variable...</option>
                                    {data.length > 0 && Object.keys(data[0] || {})
                                        .filter(v => !referenceVariables.includes(v))
                                        .map(variable => {
                                            return (
                                                <option key={variable} value={variable}>
                                                    {variable}
                                                </option>
                                            );
                                        })
                                    }
                                </select>
                                <button
                                    onClick={addReferenceVariable}
                                    className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                                    disabled={!referenceVariableToAdd}
                                >
                                    Add
                                </button>
                            </div>

                            <h3 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-100">Observed Variables
                                (Numeric)</h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {observedVariables.map(variable => (
                                    <div key={variable} className="bg-blue-500 px-2 py-1 rounded flex items-center">
                                        <span className="mr-2">
                                            {variable}
                                        </span>
                                        <button
                                            onClick={() => removeObservedVariable(variable)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                                {observedVariables.length === 0 && (
                                    <p className="text-gray-500 italic">No observed variables selected</p>
                                )}
                            </div>

                            <div className="flex gap-2 mb-4">
                                <select
                                    value={variableToObserve}
                                    onChange={(e) => setVariableToObserve(e.target.value)}
                                    className="flex-grow border p-2 rounded text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700"
                                >
                                    <option value="">Select a variable to observe...</option>
                                    {data.length > 0 && Object.keys(data[0] || {})
                                        .filter(v => !observedVariables.includes(v))
                                        .map(variable => {
                                            return (
                                                <option key={variable} value={variable}>
                                                    {variable}
                                                </option>
                                            );
                                        })
                                    }
                                </select>
                                <button
                                    onClick={addObservedVariable}
                                    className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                                    disabled={!variableToObserve}
                                >
                                    Add
                                </button>
                            </div>
                            <h3 className="text-md font-medium mt-4 mb-2 text-gray-800 dark:text-gray-100">Chart
                                Type</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
                                {['bar', 'line', 'area', 'radar', 'pie', 'scatter', 'bubble', 'heatmap', 'boxplot', 'violin'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setChartType(type)}
                                        disabled={hasNonNumericData && !['bar', 'pie'].includes(type)}
                                        className={`p-2 rounded capitalize ${
                                            chartType === type
                                                ? 'bg-blue-500'
                                                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                                        } ${hasNonNumericData && !['bar', 'pie'].includes(type) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {type} Chart
                                    </button>
                                ))}
                            </div>
                            {hasNonNumericData && (
                                <div
                                    className="mt-2 p-2 bg-amber-100 dark:bg-amber-900 border border-amber-300 dark:border-amber-700 rounded">
                                    <p className="text-amber-800 dark:text-amber-200 text-sm">
                                        Non-numeric data detected. Using bar chart for best visualization.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div>
                            {referenceVariables.length > 0 && observedVariables.length > 0 ? (
                                <div>
                                    <div ref={chartContainerRef}>
                                        <ResponsiveContainer width="100%" height={300}>
                                            {renderChart()}
                                        </ResponsiveContainer>
                                        {analysisData.length > 0 && (
                                            <ExportOptions
                                                chartRef={chartContainerRef}
                                                data={analysisData}
                                                dictionaryData={dictionaryData}
                                                filename={`olympic-analysis-${referenceVariables.join('-')}`}
                                                referenceVariables={referenceVariables}
                                                observedVariables={observedVariables}
                                                calculationMode={calculationMode}
                                                chartType={chartType}
                                            />
                                        )}
                                    </div>
                                    {analysisData.length >= maxGroups && (
                                        <p className="text-amber-600 text-sm mt-2">
                                            Warning: Too many combinations. Showing top {maxGroups} most populated
                                            groups.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <p className="text-gray-500 italic">
                                        Select at least one reference variable and one observed variable to see their
                                        relationship
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    <h3 className="text-md font-medium mt-4 mb-2 text-gray-800 dark:text-gray-100">Calculation Mode</h3>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {['average', 'sum', 'count', 'min', 'max', 'median'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setCalculationMode(mode)}
                                className={`p-2 rounded capitalize ${
                                    calculationMode === mode
                                        ? 'bg-blue-500'
                                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                                }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    {referenceVariables.length > 0 && observedVariables.length > 0 && analysisData.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-100">Interpretation</h3>
                            <p className="text-sm text-gray-700">
                                This chart shows how the {calculationMode} values of {observedVariables.join(', ')} vary
                                across
                                different combinations of {referenceVariables.join(', ')}.
                                {calculationMode === 'average' && ' Higher values indicate higher averages.'}
                                {calculationMode === 'sum' && ' Higher values indicate larger totals.'}
                                {calculationMode === 'count' && ' Higher values indicate more occurrences.'}
                                {calculationMode === 'min' && ' Higher values indicate larger minimums.'}
                                {calculationMode === 'max' && ' Higher values indicate larger maximums.'}
                                {calculationMode === 'median' && ' Higher values indicate larger middle values.'}
                                {chartType === 'pie' && ' Larger pie slices represent higher values.'}
                            </p>
                            <p className="text-sm text-gray-700 mt-2">
                                {referenceVariables.map(variable => {
                                    const desc = getVariableDescription(variable);
                                    return (
                                        <span key={variable} className="bg-gray-100 dark:bg-gray-700 p-1 rounded mr-2">
                                            {variable}: {desc}
                                        </span>
                                    );
                                })}
                                {observedVariables.map(variable => {
                                    const desc = getVariableDescription(variable);
                                    return (
                                        <span key={variable} className="bg-gray-100 dark:bg-gray-700 p-1 rounded mr-2">
                                            {variable}: {desc}
                                        </span>
                                    );
                                })}
                            </p>
                            <p className="text-sm text-gray-700 mt-2">
                                Hover over the chart to see detailed information about each group. Definitions of
                                variables are shown in tooltips.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default MultiVariableAnalyzer