export interface DiagnosticResult {
  category: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: string;
  fix?: string;
}

export class SystemDiagnostics {
  private results: DiagnosticResult[] = [];

  async runAllChecks(): Promise<DiagnosticResult[]> {
    this.results = [];

    await this.checkEnvironmentVariables();
    await this.checkSupabaseConnection();
    await this.checkDatabaseTables();
    await this.checkArticlesData();

    return this.results;
  }

  private addResult(result: DiagnosticResult) {
    this.results.push(result);
  }

  private async checkEnvironmentVariables() {
    // Standard names
    const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
    const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
    // Fallback/alternative names
    const publicUrl = (import.meta as any).env.VITE_PUBLIC_SUPABASE_URL;
    const publicKey = (import.meta as any).env.VITE_PUBLIC_SUPABASE_ANON_KEY;
    const publicBoltUrl = (import.meta as any).env.VITE_PUBLIC_Bolt_Database_URL;
    const publicBoltKey = (import.meta as any).env.VITE_PUBLIC_Bolt_Database_ANON_KEY;

    const foundUrl = supabaseUrl || publicUrl || publicBoltUrl;

    if (!foundUrl) {
      this.addResult({
        category: 'Environment Variables',
        status: 'error',
        message: 'Missing Supabase URL',
        details: 'VITE_SUPABASE_URL (and fallbacks) not found.',
        fix: 'Add VITE_SUPABASE_URL=https://<your-project-id>.supabase.co to your .env file or Netlify environment variables.'
      });
    } else {
      this.addResult({
        category: 'Environment Variables',
        status: 'ok',
        message: `Supabase URL configured`,
        details: `Using: ${foundUrl}`
      });
    }

    const foundKey = supabaseKey || publicKey || publicBoltKey;

    if (!foundKey) {
      this.addResult({
        category: 'Environment Variables',
        status: 'error',
        message: 'Missing Supabase Key',
        details: 'VITE_SUPABASE_ANON_KEY (and fallbacks) not found.',
        fix: 'Add VITE_SUPABASE_ANON_KEY="your-anon-key" to your .env file or Netlify environment variables.'
      });
    } else {
      this.addResult({
        category: 'Environment Variables',
        status: 'ok',
        message: 'Supabase Key configured',
        details: `Key prefix: ${foundKey.substring(0, 20)}...`
      });
    }
  }

  private async checkSupabaseConnection() {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const url = (import.meta as any).env.VITE_SUPABASE_URL || (import.meta as any).env.VITE_PUBLIC_SUPABASE_URL || (import.meta as any).env.VITE_PUBLIC_Bolt_Database_URL;
      const key = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env.VITE_PUBLIC_SUPABASE_ANON_KEY || (import.meta as any).env.VITE_PUBLIC_Bolt_Database_ANON_KEY;

      if (!url || !key) {
        this.addResult({
          category: 'Supabase Connection',
          status: 'error',
          message: 'Cannot connect: Missing credentials',
        });
        return;
      }

      const supabase = createClient(url, key);
      const { error } = await supabase.from('news_articles').select('count', { count: 'exact', head: true });

      if (error) {
        this.addResult({
          category: 'Supabase Connection',
          status: 'error',
          message: 'Connection failed',
          details: error.message,
          fix: 'Check if the Supabase URL and Key are correct and that RLS policies are set correctly.'
        });
      } else {
        this.addResult({
          category: 'Supabase Connection',
          status: 'ok',
          message: 'Connected to Supabase successfully',
        });
      }
    } catch (error) {
      this.addResult({
        category: 'Supabase Connection',
        status: 'error',
        message: 'Connection error',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async checkDatabaseTables() {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const url = (import.meta as any).env.VITE_SUPABASE_URL || (import.meta as any).env.VITE_PUBLIC_SUPABASE_URL || (import.meta as any).env.VITE_PUBLIC_Bolt_Database_URL;
      const key = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env.VITE_PUBLIC_SUPABASE_ANON_KEY || (import.meta as any).env.VITE_PUBLIC_Bolt_Database_ANON_KEY;

      if (!url || !key) return;

      const supabase = createClient(url, key);

      const { data: tables, error } = await supabase
        .from('news_articles')
        .select('id')
        .limit(1);

      if (error && error.message.includes('does not exist')) {
        this.addResult({
          category: 'Database Tables',
          status: 'error',
          message: 'Table "news_articles" does not exist',
          fix: 'Run the migration: supabase/migrations/20251019192430_create_live_news_tables.sql'
        });
      } else if (error) {
        this.addResult({
          category: 'Database Tables',
          status: 'warning',
          message: 'Table check failed',
          details: error.message,
        });
      } else {
        this.addResult({
          category: 'Database Tables',
          status: 'ok',
          message: 'Table "news_articles" exists',
        });
      }
    } catch (error) {
      this.addResult({
        category: 'Database Tables',
        status: 'error',
        message: 'Table check failed',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async checkArticlesData() {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const url = (import.meta as any).env.VITE_SUPABASE_URL || (import.meta as any).env.VITE_PUBLIC_SUPABASE_URL || (import.meta as any).env.VITE_PUBLIC_Bolt_Database_URL;
      const key = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env.VITE_PUBLIC_SUPABASE_ANON_KEY || (import.meta as any).env.VITE_PUBLIC_Bolt_Database_ANON_KEY;

      if (!url || !key) return;

      const supabase = createClient(url, key);

      const { count: arCount, error: arError } = await supabase
        .from('news_articles')
        .select('*', { count: 'exact', head: true })
        .eq('language', 'ar');

      const { count: enCount, error: enError } = await supabase
        .from('news_articles')
        .select('*', { count: 'exact', head: true })
        .eq('language', 'en');

      if (arError || enError) {
        this.addResult({
          category: 'Articles Data',
          status: 'error',
          message: 'Failed to count articles',
          details: (arError || enError)?.message,
        });
        return;
      }

      if ((arCount || 0) === 0 && (enCount || 0) === 0) {
        this.addResult({
          category: 'Articles Data',
          status: 'error',
          message: 'No articles found in database',
          details: 'The database is empty',
          fix: 'Trigger the Edge Function: supabase/functions/fetch-live-news/index.ts'
        });
      } else {
        this.addResult({
          category: 'Articles Data',
          status: 'ok',
          message: `Found articles: ${arCount || 0} Arabic, ${enCount || 0} English`,
        });
      }
    } catch (error) {
      this.addResult({
        category: 'Articles Data',
        status: 'error',
        message: 'Data check failed',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  getStatusEmoji(status: 'ok' | 'warning' | 'error'): string {
    switch (status) {
      case 'ok': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✗';
    }
  }

  generateReport(results: DiagnosticResult[]): string {
    let report = '=== SYSTEM DIAGNOSTICS REPORT ===\n\n';

    const categories = [...new Set(results.map(r => r.category))];

    for (const category of categories) {
      report += `${category}:\n`;
      const categoryResults = results.filter(r => r.category === category);

      for (const result of categoryResults) {
        report += `  ${this.getStatusEmoji(result.status)} ${result.message}\n`;
        if (result.details) {
          report += `     Details: ${result.details}\n`;
        }
        if (result.fix) {
          report += `     Fix: ${result.fix}\n`;
        }
      }
      report += '\n';
    }

    const errorCount = results.filter(r => r.status === 'error').length;
    const warningCount = results.filter(r => r.status === 'warning').length;

    report += '=== SUMMARY ===\n';
    report += `Errors: ${errorCount}\n`;
    report += `Warnings: ${warningCount}\n`;
    report += `Passed: ${results.length - errorCount - warningCount}\n`;

    return report;
  }
}

export const runDiagnostics = async () => {
  const diagnostics = new SystemDiagnostics();
  const results = await diagnostics.runAllChecks();
  const report = diagnostics.generateReport(results);
  console.log(report);
  return { results, report };
};