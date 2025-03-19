import React, {SetStateAction, useEffect, useState} from 'react';
import {WorkBook} from "xlsx";

const DataDictionary = ({dictSheet, workbook, xlsx, setDictionaryData}: {
    dictSheet: string,
    workbook: WorkBook | null,
    xlsx: any,
    setDictionaryData: any,
}) => {
    const [localDictionaryData, setLocalDictionaryData] = useState<any>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(true);

    // Process dictionary data when dictSheet changes
    useEffect(() => {
        if (!workbook || !dictSheet || !xlsx) {
            setLocalDictionaryData([]);
            setDictionaryData([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const worksheet = workbook.Sheets[dictSheet];

            // Convert sheet to array of objects
            const rawData = xlsx.utils.sheet_to_json(worksheet, {defval: ''});

            // Process the dictionary data
            const processedData = processFlexibleDictionaryData(rawData);

            setLocalDictionaryData(processedData);
            setDictionaryData(processedData);
            setLoading(false);
        } catch (err) {
            // @ts-ignore
            setError(`Error processing dictionary data: ${err.message}`);
            setLoading(false);
        }
    }, [dictSheet, workbook, xlsx]);

    const processFlexibleDictionaryData = (rawData: any) => {
        if (!rawData || rawData.length === 0) return [];

        const result = [];
        let currentVariablesInSection = [];
        let processingValues = false;

        // Get column names from first row
        const firstRow = rawData[0];
        const columnNames = Object.keys(firstRow);

        // Try to identify name and description columns
        const nameColumn = findColumnByPattern(columnNames, ['name', 'variable', 'var', 'field']);
        const descColumn = findColumnByPattern(columnNames, ['desc', 'definition', 'meaning']);

        // If we can't identify the columns, take the first two columns
        const varNameKey = nameColumn || columnNames[0];
        const varDescKey = descColumn || columnNames[1] || columnNames[0];

        // Process each row in the data
        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row) continue;

            const varName = String(row[varNameKey] || '').trim();
            const varDesc = String(row[varDescKey] || '').trim();

            // Skip if no variable name
            if (!varName) continue;

            // Check if this row marks the start of values section
            if (varName.toLowerCase().includes('cod')) {
                processingValues = true;
                continue;
            }

            // Check if this is a variable definition
            // 1. First three letters are uppercase
            // 2. Either it's not in the values section OR it has at least 4 characters
            const isVariable = /^[A-Z]{3}/.test(varName) && (!processingValues || varName.length >= 4);

            if (isVariable) {
                // If we find a new variable after processing values, start a new section
                if (processingValues) {
                    processingValues = false;
                    currentVariablesInSection = [];
                }

                // Create new variable entry
                const newVariable = {
                    name: varName,
                    description: varDesc,
                    values: []
                };
                result.push(newVariable);
                currentVariablesInSection.push(newVariable);
            } else if (processingValues && currentVariablesInSection.length > 0) {
                // Add this value to all variables in the current section
                for (const variable of currentVariablesInSection) {
                    // @ts-ignore
                    variable.values.push({
                        value: varName,
                        description: varDesc
                    });
                }
            }
        }

        return result;
    };

    const findColumnByPattern = (columns: any, patterns: any) => {
        for (const pattern of patterns) {
            const match = columns.find((col: any) =>
                col.toLowerCase().includes(pattern)
            );
            if (match) return match;
        }
        return null;
    };

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    if (loading) {
        return (
            <div
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700 justify-center items-center">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Data Dictionary</h2>
                </div>
                <div className="text-center p-4">Loading dictionary...</div>
            </div>
        );
    }

    return (
        <div
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700 justify-center items-center">
            <div className="flex justify-between items-center cursor-pointer" onClick={toggleExpand}>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Data Dictionary</h2>
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
                    {error && (
                        <div className="text-yellow-500 p-2 bg-yellow-50 rounded mb-4">
                            <p className="font-medium">Dictionary Notice:</p>
                            <p>{error}</p>
                        </div>
                    )}

                    {localDictionaryData.length === 0 && !loading && !error && (
                        <p className="italic text-gray-500">
                            No dictionary data found in the selected sheet. Try another sheet or check the format.
                        </p>
                    )}

                    {localDictionaryData.length > 0 && (
                        <>
                            <p className="text-sm text-gray-600 mb-4">
                                Reference information about variables in this dataset
                            </p>

                            <div className="space-y-6 overflow-y-auto">
                                {localDictionaryData.map((variable: any, idx: number) => (
                                    <div key={idx} className="border-b pb-4 last:border-0">
                                        <div className="flex flex-wrap items-start mb-2">
                                            <h3 className="font-bold mr-2 text-blue-700">{variable.name}</h3>
                                            <p className="text-gray-700 dark:text-gray-200">{variable.description}</p>
                                        </div>

                                        {variable.values.length > 0 && (
                                            <div className="mt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-500">
                                                <h4 className="text-sm font-medium text-gray-500 mb-1">Possible
                                                    values:</h4>
                                                <table
                                                    className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                    <thead>
                                                    <tr>
                                                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody
                                                        className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                                                    {variable.values.map((val: any, vidx: number) => (
                                                        <tr key={vidx}>
                                                            <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{val.value}</td>
                                                            <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{val.description}</td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default DataDictionary;