import React, {useState} from 'react';

interface AnalyzerSettingsProps {
    sheetNames: string[];
    selectedSheet: string;
    selectedDictSheet: string;
    handleSheetChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleDictSheetChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const AnalyzerSettings: React.FC<AnalyzerSettingsProps> = ({
                                                               sheetNames,
                                                               selectedSheet,
                                                               selectedDictSheet,
                                                               handleSheetChange,
                                                               handleDictSheetChange
                                                           }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center cursor-pointer" onClick={toggleExpand}>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Data Analyzer Settings</h2>
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
                <div className="flex flex-wrap gap-6 mt-4">
                    <div>
                        <label className="mr-2 text-gray-700 dark:text-gray-300">Data Sheet:</label>
                        <select
                            value={selectedSheet}
                            onChange={handleSheetChange}
                            className="border border-gray-300 dark:border-gray-700 p-2 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        >
                            {sheetNames.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mr-2 text-gray-700 dark:text-gray-300">Dictionary Sheet:</label>
                        <select
                            value={selectedDictSheet}
                            onChange={handleDictSheetChange}
                            className="border border-gray-300 dark:border-gray-700 p-2 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        >
                            {sheetNames.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyzerSettings;