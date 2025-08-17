/**
 * @fileoverview MCP Test Component
 * @description Simple component to test MCP Supabase functions
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MCPTest: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testMCPFunctions = async () => {
    setLoading(true);
    setResult('Testing MCP functions...\n');

    try {
      // Check what MCP functions are available
      const mcpFunctions = Object.keys(window).filter(key => key.startsWith('mcp_'));
      setResult(prev => prev + `Available MCP functions: ${mcpFunctions.join(', ')}\n`);

      // Test execute_sql function
      if ((window as any).mcp_supabase_execute_sql) {
        setResult(prev => prev + 'Testing mcp_supabase_execute_sql...\n');
        
        const response = await (window as any).mcp_supabase_execute_sql({
          query: 'SELECT COUNT(*) as count FROM quizzes'
        });
        
        setResult(prev => prev + `SQL Response: ${JSON.stringify(response, null, 2)}\n`);
      } else {
        setResult(prev => prev + 'mcp_supabase_execute_sql not available\n');
      }

      // Test custom_select_data function
      if ((window as any).mcp_supabase_custom_select_data) {
        setResult(prev => prev + 'Testing mcp_supabase_custom_select_data...\n');
        
        const response = await (window as any).mcp_supabase_custom_select_data({
          tableName: 'quizzes',
          limit: 1
        });
        
        setResult(prev => prev + `Select Response: ${JSON.stringify(response, null, 2)}\n`);
      } else {
        setResult(prev => prev + 'mcp_supabase_custom_select_data not available\n');
      }

    } catch (error) {
      setResult(prev => prev + `Error: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>MCP Function Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testMCPFunctions} disabled={loading}>
          {loading ? 'Testing...' : 'Test MCP Functions'}
        </Button>
        
        {result && (
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-96">
            {result}
          </pre>
        )}
      </CardContent>
    </Card>
  );
};

export default MCPTest;