'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, isValid, parseISO } from 'date-fns'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { predefinedQueries } from '@/lib/predefinedQueries';

type ColumnDef = {
  name: string
  type: string
}

type QueryResult = {
  columns: ColumnDef[]
  rows: Record<string, unknown>[]
}

type ErrorState = {
  title: string
  message: string
}

type ApiResponse = {
  fields: Array<{ name: string; dataTypeID: number }>;
  rows: Record<string, unknown>[];
  error?: string;
};

interface GenerateQueryResponse {
  error?: string;
  query: string;
}

const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }: {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="flex items-center justify-between mt-4">
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        variant="outline"
        size="sm"
        className="bg-black text-white hover:bg-blue-600 hover:text-white transition-colors duration-300"
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Previous
      </Button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        variant="outline"
        size="sm"
        className="bg-black text-white hover:bg-blue-600 hover:text-white transition-colors duration-300"
      >
        Next
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
};

export default function SQLExplorer() {
  const [userQuery, setUserQuery] = useState<string>('')
  const [userQuestion, setUserQuestion] = useState<string>('')
  const [results, setResults] = useState<QueryResult | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<ErrorState | null>(null)
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isGeneratingQuery, setIsGeneratingQuery] = useState<boolean>(false)
  const itemsPerPage = 10;
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState<boolean>(false);
  //  const isMobile = useMediaQuery('(max-width: 640px)')
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const executeQuery = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: userQuery }),
      });
      const result = await response.json() as ApiResponse;
      if (!response.ok) {
        throw new Error(result.error ?? 'An unknown error occurred');
      }
      setResults({
        columns: result.fields.map((field) => ({ name: field.name, type: field.dataTypeID.toString() })),
        rows: result.rows,
      });
      setIsResultsModalOpen(true);
    } catch (err) {
      setError({
        title: 'Query Error',
        message: err instanceof Error ? err.message : 'An unknown error occurred',
      });
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };
  const formatSQL = (sql: string) => {
    return sql.split('\n').map(line => line.trim()).join('\n');
  }

  const formatValue = (value: unknown, columnName: string, rowIndex: number): React.ReactNode => {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string' && columnName.toLowerCase().includes('password')) {
      const key = `${columnName}-${rowIndex}`;
      const isRevealed = revealedPasswords.has(key);
      return (
        <button
          onClick={() => {
            setRevealedPasswords(prev => {
              const newSet = new Set(prev);
              if (isRevealed) {
                newSet.delete(key);
              } else {
                newSet.add(key);
              }
              return newSet;
            });
          }}
          className="text-blue-500 hover:underline focus:outline-none"
        >
          {isRevealed ? value : '********'}
        </button>
      );
    }

    if (typeof value === 'object') {
      if (value instanceof Date) {
        return format(value, 'MM/dd/yy HH:mm:ss');
      }
      if (value instanceof Error) {
        return value.toString();
      }
      return JSON.stringify(value, null, 2);
    }

    if (typeof value === 'string') {
      const date = parseISO(value);
      if (isValid(date)) {
        return format(date, 'MM/dd/yy HH:mm:ss');
      }
      return value;
    }

    return String(value);
  }
  const generateQueryFromQuestion = async () => {
    setIsGeneratingQuery(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: userQuestion }),
      });
      const result = await response.json() as GenerateQueryResponse;
      if (!response.ok) {
        throw new Error(result.error ?? 'An unknown error occurred');
      }
      setUserQuery(result.query);
    } catch (err) {
      setError({
        title: 'Query Generation Error',
        message: err instanceof Error ? err.message : 'An unknown error occurred',
      });
    } finally {
      setIsGeneratingQuery(false);
    }
  };

  const exportToCSV = () => {
    if (!results) return;

    const headers = results.columns.map(col => col.name).join(',');
    const rows = results.rows.map(row =>
      results.columns.map(col => {
        const value = row[col.name];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    );

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'query_results.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    setIsChatLoading(true);
    const newMessages = [...chatMessages, { role: 'user' as const, content: chatInput }];
    setChatMessages(newMessages);
    setChatInput('');

    try {
      const response = await fetch('/api/chat-with-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from chat API');
      }

      const result = await response.json() as { response: string };
      const formattedResponse = formatChatResponse(result.response);
      setChatMessages([...newMessages, { role: 'assistant' as const, content: formattedResponse }]);
    } catch (err) {
      console.error('Error in chat:', err);
      setError({
        title: 'Chat Error',
        message: err instanceof Error ? err.message : 'An unknown error occurred',
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  const formatChatResponse = (response: string): string => {
    response = response.replace(/\[SQL\]([\s\S]*?)\[\/SQL\]/g, 'I used the following SQL query:');

    response = response.replace(/(\{[\s\S]*?\})/g, (match) => {
      try {
        const obj = JSON.parse(match) as Record<string, unknown>;
        return Object.entries(obj)
          .map(([key, value]) => `${key}: ${String(value)}`)
          .join(', ');
      } catch {
        return match; // Return the original match if parsing fails
      }
    });

    response = response.replace(/\. /g, '.\n');

    return response;
  };

  return (
    <div className="container mx-auto p-4 space-y-8 max-w-4xl bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-blue-800">
        Robert&apos;s SQL Playground
      </h1>

      {/* Example Queries Section */}
      <section className="space-y-4 bg-gray-50 p-4 sm:p-6 rounded-lg shadow-md">
        <h2 className="text-xl sm:text-2xl font-semibold text-center text-gray-800">Robert&apos;s Example Queries</h2>
        <ScrollArea className="h-[150px] sm:h-auto">
          <div className="flex flex-wrap justify-center gap-2">
            {predefinedQueries.map((pq, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setUserQuery(formatSQL(pq.query))}
                      variant="outline"
                      className="text-xs sm:text-sm bg-black text-white hover:bg-blue-600 hover:text-white transition-colors duration-300"
                      aria-label={`Load example query: ${pq.name}`}
                    >
                      {pq.name}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <pre className="text-xs">{pq.query}</pre>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </ScrollArea>
      </section>

      {/* Natural Language Query Section */}
      <section className="space-y-4 bg-gray-50 p-4 sm:p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-center space-x-2">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Generate SQL Query</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-5 w-5 text-blue-500 cursor-help" aria-label="Information about generating SQL queries" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Ask a question in plain English about the database.
                  The system will attempt to generate an SQL query based on your question.
                  After the query is generated, you can execute it by pressing the &quot;Execute Query&quot; button.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="space-y-2">
          <Textarea
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            placeholder="Ask a question about the database..."
            className="min-h-[100px] w-full border-2 border-blue-200 focus:border-blue-400 transition-colors duration-300"
            aria-label="Enter your question about the database"
          />
          <div className="flex justify-center">
            <Button
              onClick={generateQueryFromQuestion}
              disabled={isGeneratingQuery}
              className="bg-black text-white hover:bg-blue-600 hover:text-white transition-colors duration-300"
              aria-label="Generate SQL query from question"
            >
              {isGeneratingQuery ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Generating Query...
                </>
              ) : (
                'Generate Query'
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* SQL Query Execution Section */}
      <section className="space-y-4 bg-gray-50 p-4 sm:p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-center space-x-2">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Execute SQL Query</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-5 w-5 text-blue-500 cursor-help" aria-label="Information about executing SQL queries" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Enter your SQL query here. You can write your own query or use the generated query from the Natural Language section above or one of Robert&apos;s example queries at the top of this page.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="space-y-2">
          <Textarea
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Enter your SQL query here..."
            className="min-h-[100px] w-full font-mono border-2 border-blue-200 focus:border-blue-400 transition-colors duration-300"
            aria-label="Enter your SQL query"
          />
          <div className="flex justify-center">
            <Button
              onClick={executeQuery}
              disabled={isLoading}
              className="bg-black text-white hover:bg-blue-600 hover:text-white transition-colors duration-300"
              aria-label="Execute SQL query"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Executing...
                </>
              ) : (
                'Execute Query'
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="bg-red-100 border-red-400" role="alert">
          <AlertCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
          <AlertTitle className="text-red-700">{error.title}</AlertTitle>
          <AlertDescription className="text-red-600">{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Results Modal */}
      <Dialog open={isResultsModalOpen} onOpenChange={setIsResultsModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] w-full max-h-[90vh] flex flex-col bg-white">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center text-xl sm:text-2xl text-gray-800">
              Query Results
              <Button variant="ghost" size="icon" onClick={() => setIsResultsModalOpen(false)} aria-label="Close results">
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-auto">
            {results && (
              <div className="space-y-4">
                <div className="border rounded-lg overflow-x-auto bg-white shadow-inner">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {results.columns.map((column, index) => (
                          <TableHead key={index} className="font-bold text-blue-600">
                            {column.name}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.rows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((row, rowIndex) => (
                        <TableRow key={rowIndex} className="hover:bg-gray-50 transition-colors duration-200">
                          {results.columns.map((column, colIndex) => (
                            <TableCell
                              key={colIndex}
                              className={cn(
                                "border-x first:border-l-0 last:border-r-0",
                                "whitespace-pre-wrap break-words"
                              )}
                            >
                              {formatValue(row[column.name], column.name, rowIndex)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Pagination
                  totalItems={results.rows.length}
                  itemsPerPage={itemsPerPage}
                  currentPage={currentPage}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
            )}
          </div>
          <div className="flex justify-center mt-4">
            <Button
              onClick={exportToCSV}
              className="bg-black text-white hover:bg-blue-600 hover:text-white transition-colors duration-300"
              aria-label="Export results to CSV"
            >
              Export to CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat with Database Section */}
      <section className="space-y-4 mt-8 bg-gray-50 p-4 sm:p-6 rounded-lg shadow-md flex flex-col h-[calc(100vh-200px)]">
        <div className="flex items-center justify-center space-x-2">
          <h2 className="text-xl sm:text-2xl font-semibold text-center text-gray-800">Chat with the Database</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-5 w-5 text-blue-500 cursor-help" aria-label="Information about chatting with the database" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Ask questions about the database in natural language. The AI will interpret your question,
                  generate and execute SQL queries, and provide you with the results. You can have a
                  conversation about the data, ask for clarifications, or request more detailed information.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <ScrollArea className="flex-grow mb-4" ref={chatContainerRef}>
          {chatMessages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
            >
              <div
                className={`inline-block p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-100' : 'bg-purple-100'}`}
                role="log"
                aria-label={`${message.role} message`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </ScrollArea>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 items-stretch">
          <Textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask a question about the database..."
            className="flex-grow border-2 border-blue-600 focus:border-blue-800 transition-colors duration-300"
            aria-label="Enter your question for the database chat"
          />
          <Button
            onClick={handleChatSubmit}
            disabled={isChatLoading}
            className="bg-black text-white hover:bg-blue-600 hover:text-white transition-colors duration-300 flex-shrink-0 px-6 py-2 text-lg"
            aria-label="Send chat message"
          >
            {isChatLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                Thinking...
              </>
            ) : (
              'Send'
            )}
          </Button>
        </div>
      </section>
    </div>
  )
}
