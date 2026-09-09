import React, { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Database, Search, Download, FileText, Plus, Trash2, Play, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  dataExplorerTables,
  TableDef,
  ColumnDef,
  QueryFilter,
  FilterOperator,
  operatorLabels,
  getOperatorsForType,
} from '@/lib/dataExplorerSchema';

const PAGE_SIZE = 50;

const DataExplorer: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<TableDef | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [selectedJoins, setSelectedJoins] = useState<string[]>([]);
  const [filters, setFilters] = useState<QueryFilter[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasRun, setHasRun] = useState(false);
  const [uniqueOnly, setUniqueOnly] = useState(false);

  // Detect if current query involves joins that could cause duplicate financial data
  const hasJoinDuplicationRisk = useMemo(() => {
    if (!selectedTable || selectedJoins.length === 0) return false;
    // Attendance joined with registrations, or registrations joined with attendance
    const riskyCombos = [
      { table: 'camp_attendance', join: 'camp_registrations' },
      { table: 'camp_registrations', join: 'camp_attendance' },
    ];
    return riskyCombos.some(
      (combo) =>
        selectedTable.name === combo.table &&
        selectedJoins.some((j) => j.includes(combo.join))
    );
  }, [selectedTable, selectedJoins]);

  // Deduplicate results by registration identifier when uniqueOnly is enabled
  const displayResults = useMemo(() => {
    if (!uniqueOnly || !hasJoinDuplicationRisk || results.length === 0) return results;

    // Find the best key to deduplicate on
    const dedupeKeys = [
      'camp_registrations.registration_number',
      'registration_number',
      'camp_registrations.id',
      'registration_id',
      'id',
    ];
    const availableKeys = Object.keys(results[0]);
    const dedupeKey = dedupeKeys.find((k) => availableKeys.includes(k));

    if (!dedupeKey) return results;

    const seen = new Set<string>();
    return results.filter((row) => {
      const val = String(row[dedupeKey] ?? '');
      if (seen.has(val)) return false;
      seen.add(val);
      return true;
    });
  }, [results, uniqueOnly, hasJoinDuplicationRisk]);

  const handleTableChange = (tableName: string) => {
    const table = dataExplorerTables.find((t) => t.name === tableName) || null;
    setSelectedTable(table);
    setSelectedColumns(table ? table.columns.map((c) => c.key) : []);
    setSelectedJoins([]);
    setFilters([]);
    setResults([]);
    setHasRun(false);
    setPage(0);
  };

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const selectAllColumns = () => {
    if (!selectedTable) return;
    setSelectedColumns(selectedTable.columns.map((c) => c.key));
  };

  const deselectAllColumns = () => {
    setSelectedColumns([]);
  };

  const toggleJoin = (selectSyntax: string) => {
    setSelectedJoins((prev) =>
      prev.includes(selectSyntax) ? prev.filter((j) => j !== selectSyntax) : [...prev, selectSyntax]
    );
  };

  const addFilter = () => {
    if (!selectedTable || selectedTable.columns.length === 0) return;
    const col = selectedTable.columns[0];
    setFilters((prev) => [
      ...prev,
      { id: crypto.randomUUID(), column: col.key, operator: 'eq', value: '' },
    ]);
  };

  const updateFilter = (id: string, updates: Partial<QueryFilter>) => {
    setFilters((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeFilter = (id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const runQuery = useCallback(
    async (pageNum: number = 0) => {
      if (!selectedTable || selectedColumns.length === 0) {
        toast.error('Select a table and at least one column');
        return;
      }

      setLoading(true);
      setHasRun(true);

      try {
        // Build select string
        const colSelect = selectedColumns.join(',');
        const joinSelect = selectedJoins.length > 0 ? ',' + selectedJoins.join(',') : '';
        const selectStr = colSelect + joinSelect;

        // Build query
        let query = (supabase as any).from(selectedTable.name).select(selectStr, { count: 'exact' });

        // Apply filters
        for (const f of filters) {
          if (!f.value && f.operator !== 'eq') continue;
          const col = selectedTable.columns.find((c) => c.key === f.column);
          const val = col?.type === 'number' ? Number(f.value) : f.value;

          switch (f.operator) {
            case 'eq':
              query = query.eq(f.column, val);
              break;
            case 'neq':
              query = query.neq(f.column, val);
              break;
            case 'gt':
              query = query.gt(f.column, val);
              break;
            case 'gte':
              query = query.gte(f.column, val);
              break;
            case 'lt':
              query = query.lt(f.column, val);
              break;
            case 'lte':
              query = query.lte(f.column, val);
              break;
            case 'ilike':
              query = query.ilike(f.column, `%${f.value}%`);
              break;
          }
        }

        // Pagination
        const from = pageNum * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        query = query.range(from, to).order('created_at', { ascending: false });

        const { data, error, count } = await query;

        if (error) {
          console.error('Data Explorer query error:', error);
          toast.error('Query failed: ' + error.message);
          setResults([]);
          setTotalCount(0);
          return;
        }

        // Flatten joined data
        const flattenedData = (data || []).map((row: any) => {
          const flat: Record<string, any> = {};
          for (const [key, value] of Object.entries(row)) {
            if (Array.isArray(value)) {
              flat[key] = JSON.stringify(value);
            } else if (value && typeof value === 'object' && !Array.isArray(value)) {
              // Nested join object — prefix keys
              for (const [nestedKey, nestedVal] of Object.entries(value as Record<string, any>)) {
                flat[`${key}.${nestedKey}`] = nestedVal;
              }
            } else {
              flat[key] = value;
            }
          }
          return flat;
        });

        setResults(flattenedData);
        setTotalCount(count || 0);
        setPage(pageNum);
        toast.success(`Found ${count || 0} records`);
      } catch (err) {
        console.error('Data Explorer error:', err);
        toast.error('An error occurred while running the query');
      } finally {
        setLoading(false);
      }
    },
    [selectedTable, selectedColumns, selectedJoins, filters]
  );

  const getDisplayColumns = (): string[] => {
    if (results.length === 0) return selectedColumns;
    return Object.keys(results[0]);
  };

  const exportCSV = () => {
    const exportData = uniqueOnly && hasJoinDuplicationRisk ? displayResults : results;
    if (exportData.length === 0) return;
    const cols = getDisplayColumns();
    const header = cols.join(',');
    const rows = exportData.map((row) =>
      cols
        .map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return '';
          const str = String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable?.name || 'data'}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const exportPDF = () => {
    const exportData = uniqueOnly && hasJoinDuplicationRisk ? displayResults : results;
    if (exportData.length === 0) return;
    const cols = getDisplayColumns();
    const doc = new jsPDF({ orientation: cols.length > 6 ? 'landscape' : 'portrait' });
    doc.setFontSize(14);
    doc.text(`${selectedTable?.label || 'Data'} Export`, 14, 18);
    doc.setFontSize(9);
    doc.text(`${totalCount} records · Exported ${new Date().toLocaleDateString()}`, 14, 25);

    autoTable(doc, {
      startY: 30,
      head: [cols.map((c) => {
        const colDef = selectedTable?.columns.find((cd) => cd.key === c);
        return colDef?.label || c;
      })],
      body: exportData.map((row) => cols.map((c) => {
        const val = row[c];
        if (val === null || val === undefined) return '';
        return String(val).substring(0, 80);
      })),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [34, 87, 64] },
    });

    doc.save(`${selectedTable?.name || 'data'}_export.pdf`);
    toast.success('PDF exported');
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Data Explorer
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Query and explore financial data across multiple tables
          </p>
        </div>
      </div>

      {/* Query Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Table & Columns */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Table & Columns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Table selector */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Select Table</label>
              <Select onValueChange={handleTableChange} value={selectedTable?.name || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a table..." />
                </SelectTrigger>
                <SelectContent>
                  {dataExplorerTables.map((t) => (
                    <SelectItem key={t.name} value={t.name}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Column checkboxes */}
            {selectedTable && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-muted-foreground">Columns</label>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={selectAllColumns}>
                      All
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={deselectAllColumns}>
                      None
                    </Button>
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1 border rounded-md p-2">
                  {selectedTable.columns.map((col) => (
                    <label key={col.key} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer hover:bg-muted/50 px-1 rounded">
                      <Checkbox
                        checked={selectedColumns.includes(col.key)}
                        onCheckedChange={() => toggleColumn(col.key)}
                      />
                      <span>{col.label}</span>
                      <Badge variant="outline" className="ml-auto text-[10px] h-4">
                        {col.type}
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Joins */}
            {selectedTable && selectedTable.joins.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Join Tables</label>
                <div className="space-y-1 border rounded-md p-2">
                  {selectedTable.joins.map((join) => (
                    <label key={join.selectSyntax} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer hover:bg-muted/50 px-1 rounded">
                      <Checkbox
                        checked={selectedJoins.includes(join.selectSyntax)}
                        onCheckedChange={() => toggleJoin(join.selectSyntax)}
                      />
                      <span>{join.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Filters</CardTitle>
              <Button variant="outline" size="sm" onClick={addFilter} disabled={!selectedTable}>
                <Plus className="h-3 w-3 mr-1" /> Add Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {filters.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No filters applied. All rows will be returned.
              </p>
            )}
            {filters.map((filter) => {
              const colDef = selectedTable?.columns.find((c) => c.key === filter.column);
              const operators = colDef ? getOperatorsForType(colDef.type) : ['eq' as FilterOperator];

              return (
                <div key={filter.id} className="flex items-center gap-2 flex-wrap">
                  {/* Column */}
                  <Select
                    value={filter.column}
                    onValueChange={(val) => {
                      const newColDef = selectedTable?.columns.find((c) => c.key === val);
                      const newOps = newColDef ? getOperatorsForType(newColDef.type) : ['eq'];
                      updateFilter(filter.id, {
                        column: val,
                        operator: newOps.includes(filter.operator as FilterOperator) ? filter.operator : (newOps[0] as FilterOperator),
                      });
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedTable?.columns.map((c) => (
                        <SelectItem key={c.key} value={c.key}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Operator */}
                  <Select
                    value={filter.operator}
                    onValueChange={(val) => updateFilter(filter.id, { operator: val as FilterOperator })}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map((op) => (
                        <SelectItem key={op} value={op}>
                          {operatorLabels[op]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Value */}
                  <Input
                    className="flex-1 min-w-[120px]"
                    placeholder="Value..."
                    value={filter.value}
                    onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                    type={colDef?.type === 'number' ? 'number' : colDef?.type === 'date' ? 'date' : 'text'}
                  />

                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeFilter(filter.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              );
            })}

            {/* Run button */}
            <div className="flex gap-2 pt-2">
              <Button onClick={() => runQuery(0)} disabled={loading || !selectedTable || selectedColumns.length === 0}>
                <Play className="h-4 w-4 mr-1" />
                {loading ? 'Running...' : 'Run Query'}
              </Button>
              {results.length > 0 && (
                <>
                  <Button variant="outline" onClick={exportCSV}>
                    <Download className="h-4 w-4 mr-1" /> CSV
                  </Button>
                  <Button variant="outline" onClick={exportPDF}>
                    <FileText className="h-4 w-4 mr-1" /> PDF
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deduplication Warning Banner */}
      {hasJoinDuplicationRisk && hasRun && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-destructive">
                  Duplicate rows detected — financial sums may be inflated
                </p>
                <p className="text-xs text-muted-foreground">
                  This query joins attendance records with registrations, creating one row per child per attendance day.
                  Summing financial columns (e.g. total_amount) in the export will overcount because the same registration
                  appears in multiple rows. Enable "Unique Registrations Only" to deduplicate.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Switch
                    id="unique-toggle"
                    checked={uniqueOnly}
                    onCheckedChange={setUniqueOnly}
                  />
                  <label htmlFor="unique-toggle" className="text-sm font-medium cursor-pointer">
                    Unique Registrations Only
                  </label>
                  {uniqueOnly && results.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {displayResults.length} of {results.length} rows
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      {hasRun && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Results
                {totalCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {uniqueOnly && hasJoinDuplicationRisk
                      ? `${displayResults.length} unique of ${totalCount}`
                      : `${totalCount} record${totalCount !== 1 ? 's' : ''}`}
                  </Badge>
                )}
              </CardTitle>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0 || loading}
                    onClick={() => runQuery(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1 || loading}
                    onClick={() => runQuery(page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {displayResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No records found matching your query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {getDisplayColumns().map((col) => {
                        const colDef = selectedTable?.columns.find((c) => c.key === col);
                        return (
                          <TableHead key={col} className="whitespace-nowrap text-xs">
                            {colDef?.label || col}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayResults.map((row, idx) => (
                      <TableRow key={idx}>
                        {getDisplayColumns().map((col) => (
                          <TableCell key={col} className="text-xs max-w-[200px] truncate">
                            {row[col] === null || row[col] === undefined
                              ? <span className="text-muted-foreground italic">null</span>
                              : typeof row[col] === 'boolean'
                              ? row[col] ? 'Yes' : 'No'
                              : String(row[col])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataExplorer;
