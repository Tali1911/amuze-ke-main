import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle2, RefreshCw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { leadsService, Lead } from '@/services/leadsService';

/**
 * Expected program_type slugs emitted by each public form component.
 * Keep in sync with src/components/forms/*.tsx leadsService.createLead calls.
 */
const FORM_EXPECTATIONS: { form: string; expected: string; notes?: string }[] = [
  { form: 'HolidayCampForm.tsx', expected: 'holiday-camp', notes: 'Same slug used for summer / easter / mid-term — segment filters like "summer" / "easter" will not match.' },
  { form: 'HomeschoolingProgram.tsx', expected: 'homeschooling' },
  { form: 'HomeschoolingForm.tsx', expected: 'homeschooling' },
  { form: 'TeamBuildingProgram.tsx', expected: 'team-building' },
  { form: 'SchoolExperienceProgram.tsx', expected: 'school-experience' },
  { form: 'DayCampsProgram.tsx', expected: 'day-camp', notes: 'Day camps currently disabled in public UI.' },
  { form: 'PartiesProgram.tsx', expected: 'parties' },
  { form: 'LittleForestProgram.tsx', expected: 'little-forest' },
  { form: 'KenyanExperiencesProgram.tsx', expected: 'kenyan-experiences' },
  { form: 'KenyanExperiencesForm.tsx', expected: 'kenyan-experiences' },
];

const KNOWN_SLUGS = new Set(FORM_EXPECTATIONS.map(f => f.expected));

const LeadSourceAuditPanel: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const data = await leadsService.getAllLeads();
    setLeads(data as Lead[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const bySourceType: Record<string, Record<string, number>> = {};
    const missing: Lead[] = [];
    const unknown: Lead[] = [];

    for (const l of leads) {
      const t = (l.program_type || '').trim();
      const src = (l.source || 'unknown').trim();
      byType[t || '(missing)'] = (byType[t || '(missing)'] || 0) + 1;
      bySource[src] = (bySource[src] || 0) + 1;
      bySourceType[src] = bySourceType[src] || {};
      bySourceType[src][t || '(missing)'] = (bySourceType[src][t || '(missing)'] || 0) + 1;
      if (!t) missing.push(l);
      else if (!KNOWN_SLUGS.has(t)) unknown.push(l);
    }
    return { byType, bySource, bySourceType, missing, unknown };
  }, [leads]);

  const filtered = (list: Lead[]) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(l =>
      (l.full_name || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.program_type || '').toLowerCase().includes(q) ||
      (l.source || '').toLowerCase().includes(q)
    );
  };

  const totalLeads = leads.length;
  const cleanCount = totalLeads - stats.missing.length - stats.unknown.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lead Source Audit</h2>
          <p className="text-sm text-muted-foreground">
            Verifies that public-form submissions write the expected <code className="text-xs">program_type</code> into <code className="text-xs">leads</code>, used by email segmentation.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total Leads</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalLeads}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-primary" />Clean</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{cleanCount}</div><p className="text-xs text-muted-foreground">Known program_type</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-destructive" />Missing</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.missing.length}</div><p className="text-xs text-muted-foreground">Null / empty program_type</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-accent" />Unknown</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.unknown.length}</div><p className="text-xs text-muted-foreground">Slug not emitted by any form</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="coverage">
        <TabsList>
          <TabsTrigger value="coverage">Form Coverage</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="missing">Missing ({stats.missing.length})</TabsTrigger>
          <TabsTrigger value="unknown">Unknown ({stats.unknown.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="coverage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expected program_type per public form</CardTitle>
              <CardDescription>How many leads have arrived for each expected slug.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form</TableHead>
                    <TableHead>Expected program_type</TableHead>
                    <TableHead className="text-right">Leads found</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FORM_EXPECTATIONS.map(f => {
                    const count = stats.byType[f.expected] || 0;
                    return (
                      <TableRow key={f.form}>
                        <TableCell className="font-mono text-xs">{f.form}</TableCell>
                        <TableCell><Badge variant="secondary">{f.expected}</Badge></TableCell>
                        <TableCell className="text-right">
                          {count === 0 ? <Badge variant="destructive">0</Badge> : count}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{f.notes || '—'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>By program_type</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>program_type</TableHead><TableHead className="text-right">Leads</TableHead><TableHead>Status</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                      <TableRow key={k}>
                        <TableCell className="font-mono text-xs">{k}</TableCell>
                        <TableCell className="text-right">{v}</TableCell>
                        <TableCell>
                          {k === '(missing)' ? <Badge variant="destructive">missing</Badge>
                            : KNOWN_SLUGS.has(k) ? <Badge variant="secondary">known</Badge>
                            : <Badge className="bg-accent text-accent-foreground">unknown</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>By source</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>source</TableHead><TableHead className="text-right">Leads</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(stats.bySource).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                      <TableRow key={k}>
                        <TableCell className="font-mono text-xs">{k}</TableCell>
                        <TableCell className="text-right">{v}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="missing">
          <Card>
            <CardHeader>
              <CardTitle>Leads with missing program_type</CardTitle>
              <CardDescription>These leads were saved without a program_type and will not match any segment filter.</CardDescription>
            </CardHeader>
            <CardContent>
              <LeadList leads={filtered(stats.missing)} search={search} setSearch={setSearch} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unknown">
          <Card>
            <CardHeader>
              <CardTitle>Leads with unrecognised program_type</CardTitle>
              <CardDescription>
                Slug doesn't match any expected value emitted by current public forms. Likely a legacy slug, a typo, or set manually.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeadList leads={filtered(stats.unknown)} search={search} setSearch={setSearch} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const LeadList: React.FC<{ leads: Lead[]; search: string; setSearch: (v: string) => void }> = ({ leads, search, setSearch }) => (
  <div className="space-y-3">
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input placeholder="Search name, email, program_type, source…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
    </div>
    <div className="rounded-md border max-h-[500px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>program_type</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No leads to show.</TableCell></TableRow>
          ) : leads.map(l => (
            <TableRow key={l.id}>
              <TableCell>{l.full_name || '—'}</TableCell>
              <TableCell className="font-mono text-xs">{l.email}</TableCell>
              <TableCell>{l.program_type ? <Badge variant="outline">{l.program_type}</Badge> : <Badge variant="destructive">missing</Badge>}</TableCell>
              <TableCell className="text-xs">{l.source || '—'}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{l.created_at ? new Date(l.created_at).toLocaleDateString() : '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);

export default LeadSourceAuditPanel;
