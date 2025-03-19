'use client';

import React, {useState} from 'react';
import {gpt} from '@/gpt'

interface DataAnalysisProps {
    data: any[];
    dictionaryData: any[];
    referenceVariables: string[];
    observedVariables: string[];
    calculationMode: string;
    chartType: string;
    onAnalysisComplete: (analysis: string) => void;
}

const DataAnalysisGenerator: React.FC<DataAnalysisProps> = ({
                                                                data,
                                                                dictionaryData,
                                                                referenceVariables,
                                                                observedVariables,
                                                                calculationMode,
                                                                chartType,
                                                                onAnalysisComplete
                                                            }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateAnalysis = async () => {
        setLoading(true);
        setError(null);

        try {
            // Prepare data sample for the LLM (limiting to avoid token limits)
            const dataSample = data.slice(0, 15).map(item => {
                const simplified = {name: item.name};
                observedVariables.forEach(variable => {
                    // @ts-ignore
                    simplified[variable] = item[variable];
                });
                return simplified;
            });

            // Format dictionary data for the prompt
            const variableDefinitions = dictionaryData
                .filter(item => [...referenceVariables, ...observedVariables].includes(item.variable))
                .map(item => `${item.variable}: ${item.definition || 'No definition available'}`)
                .join('\n');

            // Create the prompt for analysis
            const prompt = `
    Analyze this data visualization with the following characteristics:
    - Chart type: ${chartType}
    - Calculation mode: ${calculationMode}
    - Reference variables: ${referenceVariables.join(', ')}
    - Observed variables: ${observedVariables.join(', ')}
    
    Variable definitions:
    ${variableDefinitions}
    
    - Data sample (${dataSample.length} of ${data.length} total points):
    ${JSON.stringify(dataSample, null, 2)}

    Please provide:
    1. A concise summary of what the chart shows
    2. Key trends or patterns in the data
    3. Potential insights or conclusions that can be drawn
    4. Any notable outliers or anomalies
    5. Suggestions for further analysis

    Format your response in clear paragraphs without using markdown headings.
    This analysis may be as long as you need it to be. If you find that the variables and their descriptions are
    in another language, please provide your analysis in that language. DO NOT ASK QUESTIONS!
  `;

            const response: any = await gpt.v3({
                messages: [
                    {
                        role: "assistant",
                        content: "You're an expert data analyst providing clear insights about visualizations."
                    },
                    {role: "user", content: prompt}
                ],
                markdown: false,
                stream: false,
            });

            // Pass the analysis result to parent component
            onAnalysisComplete(response.message);
        } catch (err) {
            console.error('Analysis generation failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate analysis');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={generateAnalysis}
            disabled={loading}
            className="bg-violet-500 text-white px-3 py-1 text-sm rounded hover:bg-violet-600 disabled:bg-violet-300 flex items-center"
        >
            {loading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
                         fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                </>
            ) : (
                'Analyze with AI'
            )}
        </button>
    );
};

export default DataAnalysisGenerator;