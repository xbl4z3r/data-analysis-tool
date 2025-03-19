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
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import ExportOptions from "@/components/ExportOptions";

const MultiVariableAnalyzer = ({data = [], dictionaryData = []}) => {
    const [referenceVariables, setReferenceVariables] = useState<string[]>([]);
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
        } else {
            setAnalysisData([]);
        }
    }, [referenceVariables, observedVariables, data, calculationMode]);

    const generateAnalysisData = () => {
        if (observedVariables.length === 0 || data.length === 0) {
            return [];
        }

        let groupedData: any = {};
        const groups: any[] = [];

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
                });

                groups.push(groupedData[groupKey]);
            }
        });

        if (groups.length > maxGroups) {
            groups.sort((a, b) => b.count - a.count);
            const trimmedGroups = groups.slice(0, maxGroups);
            console.warn(`Too many combinations (${groups.length}), showing only top ${maxGroups} groups.`);

            const filteredGroupData: any = {};
            trimmedGroups.forEach(group => {
                filteredGroupData[group.key] = group;
            });
            groupedData = filteredGroupData;
        }

        data.forEach(item => {
            // @ts-ignore
            const groupValues = referenceVariables.map(refVar => item[refVar]?.toString() || "N/A");
            const groupKey = groupValues.join("/");

            if (groupedData[groupKey]) {
                groupedData[groupKey].count++;
                groupedData[groupKey]._entryCount++;

                observedVariables.forEach(variable => {
                    const value = parseFloat(item[variable]);
                    if (!isNaN(value)) {
                        // Track sum for average calculation
                        groupedData[groupKey][variable] += value;
                        // Track count
                        groupedData[groupKey][`${variable}_count`]++;
                        // Track min/max
                        groupedData[groupKey][`${variable}_min`] = Math.min(groupedData[groupKey][`${variable}_min`], value);
                        groupedData[groupKey][`${variable}_max`] = Math.max(groupedData[groupKey][`${variable}_max`], value);
                        // Store all values for median calculation
                        groupedData[groupKey][`${variable}_values`].push(value);
                    }
                });
            }
        });

        Object.values(groupedData).forEach((group: any) => {
            observedVariables.forEach(variable => {
                if (group[`${variable}_count`] > 0) {
                    const values = group[`${variable}_values`];

                    switch (calculationMode) {
                        case 'average':
                            group[variable] = group[variable] / group[`${variable}_count`];
                            break;
                        case 'sum':
                            // Sum is already calculated during aggregation
                            break;
                        case 'count':
                            group[variable] = group[`${variable}_count`];
                            break;
                        case 'min':
                            group[variable] = group[`${variable}_min`];
                            break;
                        case 'max':
                            group[variable] = group[`${variable}_max`];
                            break;
                        case 'median':
                            // Calculate median
                            values.sort((a: number, b: number) => a - b);
                            const mid = Math.floor(values.length / 2);
                            group[variable] = values.length % 2 === 0
                                ? (values[mid - 1] + values[mid]) / 2
                                : values[mid];
                            break;
                    }
                }

                // Clean up temporary fields
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

                    return (
                        <div key={index} className="text-sm">
                            <span style={{color: entry.color}}>{entry.name}: </span>
                            <span
                                className="font-medium text-gray-800 dark:text-gray-100">{entry.value.toFixed(2)}</span>
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
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                {['bar', 'line', 'area', 'radar', 'pie'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setChartType(type)}
                                        className={`p-2 rounded capitalize ${
                                            chartType === type
                                                ? 'bg-blue-500'
                                                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                                        }`}
                                    >
                                        {type} Chart
                                    </button>
                                ))}
                            </div>
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
                                                filename={`olympic-analysis-${referenceVariables.join('-')}`}
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
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default MultiVariableAnalyzer