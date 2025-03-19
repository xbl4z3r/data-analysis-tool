import React, {useState} from 'react';

interface DataEntriesProps {
    data: any[];
}

const DataEntries: React.FC<DataEntriesProps> = ({data}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(10);
    const [isExpanded, setIsExpanded] = useState(true);

    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    const totalPages = Math.ceil(data.length / perPage);

    const currentData = data.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage
    );

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700 justify-center items-center">
            <div className="flex justify-between items-center cursor-pointer" onClick={toggleExpand}>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Data Entries</h2>
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
                    <div className="overflow-x-auto">
                        <p className="text-sm text-gray-600 mb-4">
                            Analyze the data entries below to identify any patterns or anomalies.
                        </p>
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                {headers.map(header => (
                                    <th
                                        key={header}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {currentData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    {headers.map(header => (
                                        <td
                                            key={`${idx}-${header}`}
                                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300"
                                        >
                                            {row[header]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-4 px-4">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-gray-600 dark:text-gray-300">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default DataEntries;