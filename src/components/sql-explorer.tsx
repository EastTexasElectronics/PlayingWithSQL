/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, isValid, parseISO } from 'date-fns'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X } from "lucide-react"

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

// Queries made by Robert
const predefinedQueries = [
  {
    name: 'All Users',
    query: `
SELECT *
FROM Users
    `.trim()
  },
  {
    name: 'All Products',
    query: `
SELECT *
FROM Products
    `.trim()
  },
  {
    name: 'User Count',
    query: `
SELECT COUNT(*) AS total_users
FROM Users
    `.trim()
  },
  {
    name: 'Top 5 Expensive Products',
    query: `
SELECT name, price
FROM Products
ORDER BY price DESC
    `.trim()
  },
  {
    name: 'Recent Orders',
    query: `
SELECT o.order_id, u.username, o.order_date, o.total_amount
FROM Orders o
JOIN Users u ON o.user_id = u.id
ORDER BY o.order_date DESC
    `.trim()
  },
  {
    name: 'Product Categories',
    query: `
SELECT name, COUNT(*) AS product_count
FROM Categories
JOIN Products ON Categories.category_id = Products.category_id
GROUP BY Categories.category_id, Categories.name
ORDER BY product_count DESC
    `.trim()
  },
  {
    name: 'Users with Most Orders',
    query: `
SELECT u.username, COUNT(o.order_id) AS order_count
FROM Users u
LEFT JOIN Orders o ON u.id = o.user_id
GROUP BY u.id, u.username
ORDER BY order_count DESC
LIMIT 5
    `.trim()
  },
  {
    name: 'Average Order Value',
    query: `
SELECT AVG(total_amount) AS avg_order_value
FROM Orders
    `.trim()
  },
  {
    name: 'Products with Low Inventory',
    query: `
SELECT p.name, i.quantity
FROM Products p
JOIN Inventory i ON p.product_id = i.product_id
WHERE i.quantity < 10
ORDER BY i.quantity ASC
    `.trim()
  },
  {
    name: 'Top Rated Products',
    query: `
SELECT p.name, AVG(r.rating) AS avg_rating, COUNT(r.review_id) AS review_count
FROM Products p
JOIN Reviews r ON p.product_id = r.product_id
GROUP BY p.product_id, p.name
HAVING COUNT(r.review_id) > 5
ORDER BY avg_rating DESC
LIMIT 10
    `.trim()
  },
  {
    name: 'Monthly Sales',
    query: `
SELECT DATE_TRUNC('month', order_date) AS month, SUM(total_amount) AS total_sales
FROM Orders
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month DESC
LIMIT 12
    `.trim()
  },
  {
    name: 'Users with Abandoned Carts',
    query: `
SELECT u.username, COUNT(c.cart_id) AS items_in_cart
FROM Users u
JOIN Carts c ON u.id = c.user_id
LEFT JOIN Orders o ON u.id = o.user_id
WHERE o.order_id IS NULL
GROUP BY u.id, u.username
HAVING COUNT(c.cart_id) > 0
ORDER BY items_in_cart DESC
    `.trim()
  },
  {
    name: 'Product Sales Ranking',
    query: `
SELECT p.name, SUM(oi.quantity) AS total_sold
FROM Products p
JOIN OrderItems oi ON p.product_id = oi.product_id
GROUP BY p.product_id, p.name
ORDER BY total_sold DESC
LIMIT 10
    `.trim()
  },
  {
    name: 'Users with Highest Total Spend',
    query: `
SELECT u.username, SUM(o.total_amount) AS total_spend
FROM Users u
JOIN Orders o ON u.id = o.user_id
GROUP BY u.id, u.username
ORDER BY total_spend DESC
    `.trim()
  },
  {
    name: 'Products Never Ordered',
    query: `
SELECT p.name
FROM Products p
LEFT JOIN OrderItems oi ON p.product_id = oi.product_id
WHERE oi.order_item_id IS NULL
    `.trim()
  },
  {
    name: 'Category Sales Performance',
    query: `
SELECT c.name AS category, SUM(oi.quantity * oi.price) AS total_sales
FROM Categories c
JOIN Products p ON c.category_id = p.category_id
JOIN OrderItems oi ON p.product_id = oi.product_id
GROUP BY c.category_id, c.name
ORDER BY total_sales DESC
    `.trim()
  },
  {
    name: 'User Registration Trend',
    query: `
SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS new_users
FROM Users
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC
LIMIT 12
    `.trim()
  },
  {
    name: 'Orders with Payment Issues',
    query: `
SELECT o.order_id, u.username, o.total_amount, p.payment_status
FROM Orders o
JOIN Users u ON o.user_id = u.id
JOIN Payments p ON o.order_id = p.order_id
WHERE p.payment_status != 'Completed'
ORDER BY o.order_date DESC
    `.trim()
  },
  {
    name: 'Product Price History',
    query: `
SELECT p.name, oi.price, o.order_date
FROM Products p
JOIN OrderItems oi ON p.product_id = oi.product_id
JOIN Orders o ON oi.order_id = o.order_id
WHERE p.product_id = 1  -- Replace with desired product_id
ORDER BY o.order_date DESC
    `.trim()
  },
  {
    name: 'Customer Lifetime Value',
    query: `
WITH customer_orders AS (
  SELECT user_id, SUM(total_amount) AS total_spend,
         MIN(order_date) AS first_order_date,
         MAX(order_date) AS last_order_date,
         COUNT(*) AS order_count
  FROM Orders
  GROUP BY user_id
)
SELECT u.username,
       co.total_spend,
       co.order_count,
       co.total_spend / NULLIF(EXTRACT(YEAR FROM AGE(co.last_order_date, co.first_order_date)), 0) AS yearly_value
FROM Users u
JOIN customer_orders co ON u.id = co.user_id
ORDER BY yearly_value DESC
    `.trim()
  }
]

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
      if (date instanceof Date && isValid(date)) {
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
      const result = await response.json();
      if (!response.ok) {
        throw new Error((result as { error?: string }).error ?? 'An unknown error occurred');
      }
      setUserQuery((result as { query: string }).query);
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

      const result = await response.json();
      const formattedResponse = formatChatResponse((result as { response: string }).response);
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
      const obj: Record<string, unknown> = JSON.parse(match);
      return Object.entries(obj)
        .map(([key, value]) => `${key}: ${String(value)}`)
        .join(', ');
    });

    response = response.replace(/\. /g, '.\n');

    return response;
  };

  return (
    <div className="container mx-auto p-4 space-y-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Robert$apos;s SQL Playground</h1>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-center">Robert$apos;s Example Queries</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {predefinedQueries.map((pq, index) => (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setUserQuery(formatSQL(pq.query))}
                    variant="outline"
                    className="text-sm"
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
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <h2 className="text-2xl font-semibold">Generate an SQL Query from a Natural Language Question</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-5 w-5 text-muted-foreground cursor-help" />
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
            className="min-h-[100px] w-full"
          />
          <div className="flex justify-center">
            <Button onClick={generateQueryFromQuestion} disabled={isGeneratingQuery}>
              {isGeneratingQuery ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Query...
                </>
              ) : (
                'Generate Query'
              )}
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <h2 className="text-2xl font-semibold">Execute an SQL Query</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-5 w-5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Enter your SQL query here. You can write your own query or use the generated query from the Natural Language section above or one of Robert$apos;s example queries at the top of this page.
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
            className="min-h-[100px] w-full font-mono"
          />
          <div className="flex justify-center">
            <Button onClick={executeQuery} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                'Execute Query'
              )}
            </Button>
          </div>
        </div>
      </section>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{error.title}</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <Dialog open={isResultsModalOpen} onOpenChange={setIsResultsModalOpen}>
        <DialogContent className="max-w-[90vw] w-full max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              Query Results
              <Button variant="ghost" size="icon" onClick={() => setIsResultsModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-auto">
            {results && (
              <div className="space-y-4">
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {results.columns.map((column, index) => (
                          <TableHead key={index} className="font-bold">
                            {column.name}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.rows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
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
          <div className="flex justify-center mt-4 space-x-4">
            <Button onClick={exportToCSV}>
              Export to CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>
{/* TODO: add info icon with tooltip that explains how to use this section  */}
      <section className="space-y-4 mt-8">
        <h2 className="text-2xl font-semibold text-center">Chat with the Database</h2>
        <ScrollArea className="h-[400px] w-full border rounded-md p-4">
          {chatMessages.map((message, index) => (
            <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                {message.content}
              </div>
            </div>
          ))}
        </ScrollArea>
        <div className="flex space-x-2">
          <Textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask a question about the database..."
            className="flex-grow"
          />
          <Button onClick={handleChatSubmit} disabled={isChatLoading}>
            {isChatLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
