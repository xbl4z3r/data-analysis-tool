"use client"

import React, {useState} from "react";
import * as XLSX from "xlsx";
import {WorkBook} from "xlsx";
import DataDictionary from "@/components/DataDictionary";
import MultiVariableAnalyzer from "@/components/MultiVariableAnalyzer";
import DataEntries from "@/components/DataEntries";
import AnalyzerSettings from "@/components/AnalyzerSettings";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
    const [analyzedData, setAnalyzedData] = useState<any>([]);
    const [dictionaryData, setDictionaryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [selectedSheet, setSelectedSheet] = useState('');
    const [selectedDictSheet, setSelectedDictSheet] = useState('');
    const [workbook, setWorkbook] = useState<WorkBook | null>(null);

    const handleFileUpload = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                // @ts-ignore
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, {type: 'array'});
                setWorkbook(wb);
                setSheetNames(wb.SheetNames);

                // Select first sheet by default
                if (wb.SheetNames.length > 0) {
                    setSelectedSheet(wb.SheetNames[0]);
                    processSheetData(wb, wb.SheetNames[0]);
                }
                setLoading(false);
            } catch (err: any) {
                setError(`Error reading Excel file: ${err.message}`);
                setLoading(false);
            }
        };
        reader.onerror = () => {
            setError('Error reading file');
            setLoading(false);
        };
        reader.readAsArrayBuffer(file);
    };

    const processSheetData = (wb: WorkBook, sheetName: string) => {
        try {
            const worksheet = wb.Sheets[sheetName];
            const jsonData: any = XLSX.utils.sheet_to_json(worksheet, {header: 1, defval: ''});

            // Find header row
            let headerRow = 0;
            for (let i = 0; i < Math.min(10, jsonData.length); i++) {
                if (jsonData[i].length > 3) {
                    headerRow = i;
                    break;
                }
            }

            // Convert to array of objects with headers
            const headers = jsonData[headerRow];
            const data = [];

            for (let i = headerRow + 1; i < jsonData.length; i++) {
                if (jsonData[i].length > 0) {
                    const row: any = {};
                    for (let j = 0; j < headers.length; j++) {
                        if (headers[j]) {
                            row[headers[j]] = jsonData[i][j];
                        }
                    }
                    data.push(row);
                }
            }

            setAnalyzedData(data);
        } catch (err: any) {
            setError(`Error processing sheet data: ${err.message}`);
        }
    };

    const handleSheetChange = (e: any) => {
        const sheetName = e.target.value;
        setSelectedSheet(sheetName);

        if (workbook) {
            processSheetData(workbook, sheetName);
        }
    };

    const handleDictSheetChange = (e: any) => {
        setSelectedDictSheet(e.target.value);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-6xl font-bold text-gray-800 dark:text-gray-100">xbl4z3r's Data Analysis
                        Tool</h1>
                    <ThemeToggle/>
                </div>

                <div className="mb-6 rounded-lg">
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        className="block rounded-lg w-full text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-gray-700 dark:file:text-gray-300 file:bg-gray-100 dark:file:bg-gray-700 hover:file:bg-gray-200 dark:hover:file:bg-gray-600"
                    />
                </div>

                {loading ? (
                    <div className="text-center p-8 text-gray-600 dark:text-gray-300">
                        <div
                            className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        Loading data...
                    </div>
                ) : error ? (
                    <div
                        className="text-red-500 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded">{error}</div>
                ) : analyzedData.length > 0 && (
                    <div>
                        <AnalyzerSettings
                            sheetNames={sheetNames}
                            selectedSheet={selectedSheet}
                            selectedDictSheet={selectedDictSheet}
                            handleSheetChange={handleSheetChange}
                            handleDictSheetChange={handleDictSheetChange}
                        />
                        <DataDictionary
                            dictSheet={selectedDictSheet}
                            workbook={workbook}
                            xlsx={XLSX}
                            setDictionaryData={setDictionaryData}
                        />
                        <MultiVariableAnalyzer data={analyzedData} dictionaryData={dictionaryData}/>
                        <DataEntries data={analyzedData}/>
                    </div>
                )}
            </div>
        </div>
    );
}
