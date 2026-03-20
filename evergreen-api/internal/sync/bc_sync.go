package sync

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/evergreen/api/internal/bc"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/sync/errgroup"

	"github.com/evergreen/api/pkg/logger"
)

// SyncEngine orchestrates the BC-to-Supabase synchronisation.
type SyncEngine struct {
	store *Store
	bc    *bc.Client
}

// NewSyncEngine creates a new SyncEngine.
func NewSyncEngine(pool *pgxpool.Pool, bcClient *bc.Client) *SyncEngine {
	return &SyncEngine{store: NewStore(pool), bc: bcClient}
}

// entityResult tracks per-entity counts.
type entityResult struct {
	Count      int `json:"count"`
	Lines      int `json:"lines,omitempty"`
	MaxEntryNo int `json:"maxEntryNo,omitempty"`
}

// SyncResult is returned at the end of a sync run.
type SyncResult struct {
	OK       bool                     `json:"ok"`
	SyncedAt string                   `json:"syncedAt"`
	Mode     string                   `json:"mode"`
	Results  map[string]*entityResult `json:"results"`
	Errors   map[string]string        `json:"errors,omitempty"`
}

// ── Main sync orchestrator ──

// RunSync executes the full or incremental BC sync.
// mode should be "full" or "incremental" (default).
// send is an SSE callback: send(eventName, jsonData).
func (s *SyncEngine) RunSync(ctx context.Context, mode string, send func(event, data string)) {
	isFullSync := mode == "full"
	results := make(map[string]*entityResult)
	errors := make(map[string]string)
	var mu sync.Mutex
	now := time.Now().UTC().Format(time.RFC3339)

	sendProgress := func(phase, step, label string, extra map[string]any) {
		logger.Info("sync progress", "phase", phase, "step", step, "label", label)
		payload := map[string]any{
			"phase": phase,
			"step":  step,
			"label": label,
		}
		for k, v := range extra {
			payload[k] = v
		}
		b, _ := json.Marshal(payload)
		send("progress", string(b))
	}

	setResult := func(key string, r *entityResult) {
		mu.Lock()
		results[key] = r
		mu.Unlock()
	}
	setError := func(key, msg string) {
		mu.Lock()
		errors[key] = msg
		mu.Unlock()
	}
	getResult := func(key string) *entityResult {
		mu.Lock()
		defer mu.Unlock()
		return results[key]
	}

	// ── Phase 1: dimensionValues ──
	sendProgress("dimensionValues", "fetching", "Fetching dimension values...", nil)
	var dimCfg *bc.EntityConfig
	for i := range bc.SyncConfig {
		if bc.SyncConfig[i].BCEndpoint == "dimensionValues" {
			dimCfg = &bc.SyncConfig[i]
			break
		}
	}
	dimCount := 0
	if dimCfg != nil {
		params := map[string]string{"$select": buildSelectParam(dimCfg.FieldMap)}
		dims, err := s.bc.CustomApiGet("dimensionValues", params, 180*time.Second)
		if err != nil {
			setError("dimensionValues", err.Error())
			sendProgress("dimensionValues", "error", err.Error(), map[string]any{"error": err.Error()})
		} else {
			dimCount = len(dims)
			setResult("dimensionValues", &entityResult{Count: dimCount})
			sendProgress("dimensionValues", "done", fmt.Sprintf("Dimension values: %d", dimCount), map[string]any{"count": dimCount})
		}
	}

	// ── Full sync: delete all rows ──
	if isFullSync {
		sendProgress("truncate", "truncating", "Deleting all rows...", nil)
		for _, table := range getAllSupabaseTables() {
			if err := s.store.TruncateTable(ctx, table); err != nil {
				logger.Warn("truncate error", "table", table, "error", err)
			}
		}
		sendProgress("truncate", "done", "Tables cleared", nil)
	}

	// helper to sync a slice of configs with bounded concurrency
	syncGroup := func(cfgs []bc.EntityConfig, concurrency int, isFS bool, noFilter bool) {
		g, gCtx := errgroup.WithContext(ctx)
		g.SetLimit(concurrency)
		for _, cfg := range cfgs {
			cfg := cfg // capture
			g.Go(func() error {
				s.syncEntity(gCtx, &cfg, isFS, noFilter, now, sendProgress, setResult, setError)
				return nil // never fail the group
			})
		}
		_ = g.Wait()
	}

	// ── Phase 2: Master data ──
	sendProgress("master", "starting", "Syncing master data...", nil)
	masterConfigs := filterConfigs("master", true)
	if isFullSync {
		syncGroup(masterConfigs, 3, true, false)
	} else {
		// Incremental: master data does full upsert (noFilter) to catch balance changes
		syncGroup(masterConfigs, 3, false, true)
	}

	// ── Items RFID (incremental only) ──
	if !isFullSync {
		var itemCfg *bc.EntityConfig
		for i := range bc.SyncConfig {
			if bc.SyncConfig[i].BCEndpoint == "items" {
				itemCfg = &bc.SyncConfig[i]
				break
			}
		}
		if itemCfg != nil {
			if r := getResult(itemCfg.BCEndpoint); r != nil && r.Count > 0 {
				sendProgress("items-rfid", "assigning", "Assigning RFID codes...", nil)
				if err := s.assignRfidCodesIncremental(ctx, itemCfg, sendProgress); err != nil {
					setError("items-rfid", err.Error())
					sendProgress("items-rfid", "error", err.Error(), map[string]any{"error": err.Error()})
				} else {
					sendProgress("items-rfid", "done", "RFID codes assigned", nil)
				}
			}
		}
	}

	if isFullSync {
		// ── Phase 3: Small master data ──
		sendProgress("small", "starting", "Syncing small master data...", nil)
		syncGroup(filterConfigsByGroup("small"), 5, true, false)

		// ── Phase 4: Documents ──
		sendProgress("document", "starting", "Syncing documents...", nil)
		syncGroup(filterConfigsByGroup("document"), 4, true, false)

		// ── Phase 5: Posted docs ──
		sendProgress("postedDoc", "starting", "Syncing posted documents...", nil)
		syncGroup(filterConfigsByGroup("postedDoc"), 4, true, false)

		// ── Phase 6: Large ledger entries ──
		sendProgress("ledger-large", "starting", "Syncing large ledger entries...", nil)
		largeLedger := map[string]bool{
			"valueEntries": true, "itemLedgerEntries": true,
			"gLEntries": true, "customerLedgerEntries": true,
		}
		var largeCfgs []bc.EntityConfig
		for _, c := range bc.SyncConfig {
			if largeLedger[c.BCEndpoint] {
				largeCfgs = append(largeCfgs, c)
			}
		}
		syncGroup(largeCfgs, 4, true, false)

		// ── Phase 7: Small ledger entries ──
		sendProgress("ledger-small", "starting", "Syncing small ledger entries...", nil)
		smallLedger := map[string]bool{
			"vendorLedgerEntries": true, "detailedCustLedgerEntries": true,
			"detailedVendorLedgerEntries": true, "bankAccountLedgerEntries": true,
			"faLedgerEntries": true,
		}
		var smallLedgerCfgs []bc.EntityConfig
		for _, c := range bc.SyncConfig {
			if smallLedger[c.BCEndpoint] {
				smallLedgerCfgs = append(smallLedgerCfgs, c)
			}
		}
		syncGroup(smallLedgerCfgs, 5, true, false)
	} else {
		// ── Incremental: all non-master entities ──
		sendProgress("incremental", "starting", "Syncing incremental changes...", nil)
		var otherCfgs []bc.EntityConfig
		for _, c := range bc.SyncConfig {
			if c.SyncGroup != "master" && c.SupabaseTable != "" {
				otherCfgs = append(otherCfgs, c)
			}
		}
		syncGroup(otherCfgs, 5, false, false)
	}

	// ── Update sync state ──
	if err := s.store.SetSyncState(ctx, "lastSyncTime", now); err != nil {
		setError("syncState", err.Error())
	}
	for _, cfg := range bc.SyncConfig {
		if cfg.SyncGroup == "ledger" {
			if r := getResult(cfg.BCEndpoint); r != nil && r.MaxEntryNo > 0 {
				if err := s.store.SetSyncState(ctx, "lastEntryNo:"+cfg.SupabaseTable, strconv.Itoa(r.MaxEntryNo)); err != nil {
					setError("syncState", err.Error())
				}
			}
		}
	}

	sendProgress("complete", "done", "Sync complete", nil)

	modeStr := "incremental"
	if isFullSync {
		modeStr = "full"
	}
	result := SyncResult{
		OK:       true,
		SyncedAt: now,
		Mode:     modeStr,
		Results:  results,
	}
	if len(errors) > 0 {
		result.Errors = errors
	}
	b, _ := json.Marshal(result)
	send("done", string(b))
}

// ── Generic entity sync ──

func (s *SyncEngine) syncEntity(
	ctx context.Context,
	cfg *bc.EntityConfig,
	isFullSync, noFilter bool,
	now string,
	sendProgress func(string, string, string, map[string]any),
	setResult func(string, *entityResult),
	setError func(string, string),
) {
	if cfg.SupabaseTable == "" {
		return
	}

	endpoint := cfg.BCEndpoint
	sendProgress(endpoint, "fetching", fmt.Sprintf("Fetching %s...", cfg.Name), nil)

	// Build query params
	params := map[string]string{
		"$select": buildSelectParam(cfg.FieldMap),
	}

	// Items special ordering for full sync
	if endpoint == "items" && isFullSync {
		params["$orderby"] = "genProdPostingGroup asc,no asc"
	}

	// Incremental filter
	if !isFullSync && !noFilter && cfg.IncrementalFilterType != "" {
		lastSync, _ := s.store.GetSyncState(ctx, "lastSyncTime")
		lastEntryNo, _ := s.store.GetSyncState(ctx, "lastEntryNo:"+cfg.SupabaseTable)

		switch cfg.IncrementalFilterType {
		case "entryNo":
			if lastEntryNo != "" {
				params["$filter"] = fmt.Sprintf("entryNo gt %s", lastEntryNo)
			}
		case "timestamp":
			if lastSync != "" {
				params["$filter"] = fmt.Sprintf("lastModifiedDateTime gt %s", lastSync)
			}
		}
	}

	// Fetch from BC
	bigEntities := map[string]bool{
		"valueEntries": true, "itemLedgerEntries": true, "gLEntries": true,
		"salesOrders": true, "postedSalesInvoices": true, "postedSalesShipments": true,
		"purchaseOrders": true, "postedPurchInvoices": true,
	}
	fetchTimeout := 180 * time.Second
	if bigEntities[endpoint] {
		fetchTimeout = 300 * time.Second
	}

	data, err := s.bc.CustomApiGet(endpoint, params, fetchTimeout)
	if err != nil {
		setError(endpoint, err.Error())
		sendProgress(endpoint, "error", err.Error(), map[string]any{"error": err.Error()})
		return
	}

	sendProgress(endpoint, "transforming",
		fmt.Sprintf("%s: %d records fetched", cfg.Name, len(data)),
		map[string]any{"count": len(data)})

	// Transform header rows
	headerRows := make([]map[string]any, 0, len(data))
	for i, record := range data {
		row := bc.TransformRecord(record, cfg.FieldMap)
		// Items: assign RFID inline during full sync
		if endpoint == "items" && isFullSync {
			row["bcItemRfidCode"] = strconv.Itoa(i + 1)
		}
		headerRows = append(headerRows, row)
	}

	// Fetch lines if applicable
	var lineRows []map[string]any
	if cfg.LinesEndpoint != "" && cfg.LineFieldMap != nil && cfg.LinesTable != "" && (len(headerRows) > 0 || isFullSync) {
		sendProgress(endpoint+"-lines", "fetching",
			fmt.Sprintf("Fetching %s lines...", cfg.Name), nil)
		lineParams := map[string]string{
			"$select": buildSelectParam(cfg.LineFieldMap),
		}
		lineData, err := s.bc.CustomApiGet(cfg.LinesEndpoint, lineParams, fetchTimeout)
		if err != nil {
			setError(endpoint+"-lines", err.Error())
			sendProgress(endpoint+"-lines", "error", err.Error(), map[string]any{"error": err.Error()})
		} else {
			lineRows = make([]map[string]any, 0, len(lineData))
			for _, line := range lineData {
				lineRows = append(lineRows, bc.TransformRecord(line, cfg.LineFieldMap))
			}
		}
	}

	// Track max entryNo for ledger tables
	maxEntryNo := 0
	if cfg.BCPrimaryKey == "entryNo" {
		for _, record := range data {
			if en, ok := toInt(record["entryNo"]); ok && en > maxEntryNo {
				maxEntryNo = en
			}
		}
	}

	// Upsert headers
	if len(headerRows) > 0 {
		sendProgress(endpoint, "saving",
			fmt.Sprintf("Saving %s: %d records...", cfg.Name, len(headerRows)), nil)
		concurrency := 3
		if endpoint == "items" && isFullSync {
			concurrency = 1
		}
		if err := s.store.BatchUpsert(ctx, cfg.SupabaseTable, cfg.SupabaseConflictCol, headerRows, 1000, concurrency); err != nil {
			setError(endpoint, err.Error())
			sendProgress(endpoint, "error", err.Error(), map[string]any{"error": err.Error()})
			return
		}
	}

	// Upsert lines
	if len(lineRows) > 0 && cfg.LinesTable != "" && cfg.LinesConflictCols != "" {
		sendProgress(endpoint+"-lines", "saving",
			fmt.Sprintf("Saving %s lines: %d records...", cfg.Name, len(lineRows)), nil)
		if err := s.store.BatchUpsert(ctx, cfg.LinesTable, cfg.LinesConflictCols, lineRows, 1000, 3); err != nil {
			setError(endpoint+"-lines", err.Error())
			sendProgress(endpoint+"-lines", "error", err.Error(), map[string]any{"error": err.Error()})
			return
		}
	}

	// Record results
	result := &entityResult{Count: len(headerRows)}
	if len(lineRows) > 0 {
		result.Lines = len(lineRows)
	}
	if maxEntryNo > 0 {
		result.MaxEntryNo = maxEntryNo
	}
	setResult(endpoint, result)

	linesLabel := ""
	if len(lineRows) > 0 {
		linesLabel = fmt.Sprintf(" + %d lines", len(lineRows))
	}
	sendProgress(endpoint, "done",
		fmt.Sprintf("%s: %d records%s", cfg.Name, len(headerRows), linesLabel),
		map[string]any{"count": len(headerRows), "lines": len(lineRows)})
}

// ── Items RFID assignment (incremental) ──

func (s *SyncEngine) assignRfidCodesIncremental(
	ctx context.Context,
	cfg *bc.EntityConfig,
	sendProgress func(string, string, string, map[string]any),
) error {
	table := cfg.SupabaseTable
	pkCol := "bcItemNo"

	maxExisting, err := s.store.GetMaxItemRfidCode(ctx, table)
	if err != nil {
		return fmt.Errorf("getting max RFID: %w", err)
	}

	noRfid, err := s.store.GetItemsWithoutRfid(ctx, table, pkCol)
	if err != nil {
		return fmt.Errorf("querying items without RFID: %w", err)
	}

	if len(noRfid) == 0 {
		return nil
	}

	nextCode := maxExisting + 1
	updates := make([]map[string]any, 0, len(noRfid))
	for _, itemNo := range noRfid {
		updates = append(updates, map[string]any{
			pkCol:            itemNo,
			"bcItemRfidCode": strconv.Itoa(nextCode),
		})
		nextCode++
	}

	return s.store.BatchUpsert(ctx, table, pkCol, updates, 1000, 3)
}

// ── Helpers ──

func buildSelectParam(fieldMap map[string]string) string {
	keys := make([]string, 0, len(fieldMap))
	for k := range fieldMap {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return strings.Join(keys, ",")
}

func getAllSupabaseTables() []string {
	var tables []string
	for _, cfg := range bc.SyncConfig {
		if cfg.SupabaseTable != "" {
			tables = append(tables, cfg.SupabaseTable)
		}
		if cfg.LinesTable != "" {
			tables = append(tables, cfg.LinesTable)
		}
	}
	return tables
}

// filterConfigs returns configs for a syncGroup that have a supabaseTable.
func filterConfigs(group string, requireTable bool) []bc.EntityConfig {
	var out []bc.EntityConfig
	for _, c := range bc.SyncConfig {
		if c.SyncGroup == group {
			if requireTable && c.SupabaseTable == "" {
				continue
			}
			out = append(out, c)
		}
	}
	return out
}

// filterConfigsByGroup returns all configs for a syncGroup.
func filterConfigsByGroup(group string) []bc.EntityConfig {
	return filterConfigs(group, false)
}

func toInt(v any) (int, bool) {
	switch n := v.(type) {
	case float64:
		return int(n), true
	case int:
		return n, true
	case int64:
		return int(n), true
	case json.Number:
		i, err := n.Int64()
		return int(i), err == nil
	case string:
		i, err := strconv.Atoi(n)
		return i, err == nil
	}
	return 0, false
}
