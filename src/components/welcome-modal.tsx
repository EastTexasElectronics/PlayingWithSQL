import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setIsOpen(true);
      localStorage.setItem('hasSeenWelcome', 'true');
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[90vw] sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Welcome to Robert&apos;s SQL Playground!</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>This interactive tool allows you to explore and learn SQL queries using a sample e-commerce database. Here&apos;s how to use each section:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li><strong>Example Queries:</strong> Click on these buttons to load pre-written SQL queries.</li>
            <li><strong>Generate SQL Query:</strong> Ask a question in plain English, and the AI will generate an SQL query for you.</li>
            <li><strong>Execute SQL Query:</strong> Write or paste your SQL query here and execute it to see the results.</li>
            <li><strong>Chat with the Database:</strong> Have a conversation with the AI about the database, asking questions and getting insights.</li>
          </ol>
          <p>Feel free to experiment and learn SQL in a hands-on way!</p>
        </div>
        <Button onClick={() => setIsOpen(false)} className="mt-4">Got it, let&apos;s start!</Button>
      </DialogContent>
    </Dialog>
  );
}
