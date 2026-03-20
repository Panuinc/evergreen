package production

import (
	"math"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/evergreen/api/pkg/response"
)

type Handler struct {
	store *Store
}

func New(pool *pgxpool.Pool) *Handler {
	return &Handler{store: NewStore(pool)}
}

// ---- helpers ----

func toFloat(v any) float64 {
	switch n := v.(type) {
	case float64:
		return n
	case float32:
		return float64(n)
	case int:
		return float64(n)
	case int32:
		return float64(n)
	case int64:
		return float64(n)
	default:
		return 0
	}
}

func toStr(v any) string {
	if s, ok := v.(string); ok {
		return s
	}
	return ""
}

func toTime(v any) (time.Time, bool) {
	switch t := v.(type) {
	case time.Time:
		if t.IsZero() || t.Year() <= 1 {
			return time.Time{}, false
		}
		return t, true
	default:
		return time.Time{}, false
	}
}

func roundTo(v float64, decimals int) float64 {
	p := math.Pow(10, float64(decimals))
	return math.Round(v*p) / p
}

// isWPC returns true if the dimension1 code indicates the WPC department.
func isWPC(dim1 string) bool {
	d := strings.ToUpper(strings.TrimSpace(dim1))
	return d == "WPC"
}

// ---- Dashboard ----

func (h *Handler) Dashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Fetch all data in parallel-ish (sequential for simplicity, all fast SQL)
	prodOrders, err := h.store.GetProductionOrders(ctx)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	ileEntries, err := h.store.GetItemLedgerEntries(ctx)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	consumptionCosts, err := h.store.GetConsumptionCosts(ctx)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	salesPriceRows, err := h.store.GetSalesPriceMap(ctx)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	dimNameRows, err := h.store.GetDimensionNames(ctx)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	// Build sales price map: itemNo -> unitPrice
	salesPriceMap := map[string]float64{}
	for _, row := range salesPriceRows {
		itemNo := toStr(row["itemNo"])
		if itemNo != "" {
			salesPriceMap[itemNo] = toFloat(row["unitPrice"])
		}
	}

	// Build dimension name maps
	deptNameMap := map[string]string{}
	projNameMap := map[string]string{}
	for _, row := range dimNameRows {
		code := toStr(row["dimCode"])
		valCode := toStr(row["valueCode"])
		valName := toStr(row["valueName"])
		if code == "DEPARTMENT" && valCode != "" {
			deptNameMap[valCode] = valName
		}
		if code == "PROJECT" && valCode != "" {
			projNameMap[valCode] = valName
		}
	}

	// Build order -> dim1Code map from production orders
	orderDim1 := map[string]string{}
	orderDim2 := map[string]string{}
	for _, po := range prodOrders {
		orderNo := toStr(po["orderNo"])
		dim1 := toStr(po["dim1Code"])
		dim2 := toStr(po["dim2Code"])
		if orderNo != "" {
			orderDim1[orderNo] = dim1
			orderDim2[orderNo] = dim2
		}
	}

	// Index consumption costs by orderNo
	type costEntry struct {
		orderNo     string
		itemNo      string
		costAmount  float64
		quantity    float64
		postingDate time.Time
		dim1Code    string
		dim2Code    string
		description string
		itemDesc    string
	}
	var consumptionList []costEntry
	orderConsumptionCost := map[string]float64{}
	for _, row := range consumptionCosts {
		orderNo := toStr(row["orderNo"])
		cost := toFloat(row["costAmount"])
		pd, _ := toTime(row["postingDate"])
		ce := costEntry{
			orderNo:     orderNo,
			itemNo:      toStr(row["itemNo"]),
			costAmount:  cost,
			quantity:    toFloat(row["quantity"]),
			postingDate: pd,
			dim1Code:    toStr(row["dim1Code"]),
			dim2Code:    toStr(row["dim2Code"]),
			description: toStr(row["description"]),
			itemDesc:    toStr(row["itemDescription"]),
		}
		consumptionList = append(consumptionList, ce)
		orderConsumptionCost[orderNo] += cost
	}

	// Index output entries by orderNo
	type outputEntry struct {
		orderNo      string
		itemNo       string
		quantity     float64
		postingDate  time.Time
		dim1Code     string
		dim2Code     string
		description  string
		itemDesc     string
		itemCategory string
		itemPrice    float64
	}
	var outputList []outputEntry
	orderOutputQty := map[string]float64{}
	for _, row := range ileEntries {
		entryType := toStr(row["entryType"])
		orderNo := toStr(row["orderNo"])
		if entryType == "Output" {
			qty := toFloat(row["quantity"])
			pd, _ := toTime(row["postingDate"])
			oe := outputEntry{
				orderNo:      orderNo,
				itemNo:       toStr(row["itemNo"]),
				quantity:     qty,
				postingDate:  pd,
				dim1Code:     toStr(row["dim1Code"]),
				dim2Code:     toStr(row["dim2Code"]),
				description:  toStr(row["description"]),
				itemDesc:     toStr(row["itemDescription"]),
				itemCategory: toStr(row["itemCategory"]),
				itemPrice:    toFloat(row["itemUnitPrice"]),
			}
			outputList = append(outputList, oe)
			orderOutputQty[orderNo] += qty
		}
	}

	// Calculate revenue per order: output qty * selling price
	// Use sales order price first, fall back to item unit price
	orderRevenue := map[string]float64{}
	for _, oe := range outputList {
		price := salesPriceMap[oe.itemNo]
		if price == 0 {
			price = oe.itemPrice
		}
		orderRevenue[oe.orderNo] += oe.quantity * price
	}

	now := time.Now()

	// Build the dashboard data for a specific set of orders (split by wpc vs other)
	type tabData struct {
		orders []map[string]any
	}
	wpcOrders := tabData{}
	otherOrders := tabData{}
	for _, po := range prodOrders {
		dim1 := toStr(po["dim1Code"])
		if isWPC(dim1) {
			wpcOrders.orders = append(wpcOrders.orders, po)
		} else {
			otherOrders.orders = append(otherOrders.orders, po)
		}
	}

	buildTab := func(orders []map[string]any) map[string]any {
		totalOrders := len(orders)
		releasedOrders := 0
		finishedOrders := 0
		onTimeCount := 0
		finishedWithDates := 0
		totalLeadDays := 0.0
		var overdueOrders []map[string]any

		byStatus := map[string]int{}
		orderNoSet := map[string]bool{}

		for _, po := range orders {
			orderNo := toStr(po["orderNo"])
			status := toStr(po["status"])
			orderNoSet[orderNo] = true
			byStatus[status]++

			switch status {
			case "Released":
				releasedOrders++
				// Check overdue
				if dueDate, ok := toTime(po["dueDate"]); ok {
					if now.After(dueDate) {
						overdueDays := int(now.Sub(dueDate).Hours() / 24)
						dim1 := toStr(po["dim1Code"])
						dim2 := toStr(po["dim2Code"])
						dim1Name := deptNameMap[dim1]
						if dim1Name == "" {
							dim1Name = dim1
						}
						dim2Name := projNameMap[dim2]
						if dim2Name == "" {
							dim2Name = dim2
						}
						overdueOrders = append(overdueOrders, map[string]any{
							"id":               orderNo,
							"description":      toStr(po["description"]),
							"sourceNo":         toStr(po["sourceNo"]),
							"quantity":         toFloat(po["quantity"]),
							"dueDate":          dueDate.Format(time.RFC3339),
							"startingDateTime": po["startingDateTime"],
							"overdueDays":      overdueDays,
							"dimension1Name":   dim1Name,
							"dimension2Name":   dim2Name,
							"locationCode":     toStr(po["locationCode"]),
						})
					}
				}
			case "Finished":
				finishedOrders++
				// On-time rate
				finishedDate, hasFD := toTime(po["finishedDate"])
				dueDate, hasDD := toTime(po["dueDate"])
				if hasFD && hasDD {
					if !finishedDate.After(dueDate) {
						onTimeCount++
					}
					finishedWithDates++
				}
				// Lead time
				startDate, hasSD := toTime(po["startingDateTime"])
				if hasFD && hasSD {
					days := finishedDate.Sub(startDate).Hours() / 24
					if days >= 0 {
						totalLeadDays += days
					}
				}
			}
		}

		// Consumption cost for this tab's orders
		tabConsumptionCost := 0.0
		tabWipValue := 0.0
		for _, po := range orders {
			orderNo := toStr(po["orderNo"])
			status := toStr(po["status"])
			cost := orderConsumptionCost[orderNo]
			tabConsumptionCost += cost
			if status == "Released" {
				tabWipValue += cost - orderRevenue[orderNo]
			}
		}

		// Revenue for this tab's orders
		tabRevenue := 0.0
		tabOutputQty := 0.0
		for _, po := range orders {
			orderNo := toStr(po["orderNo"])
			tabRevenue += orderRevenue[orderNo]
			tabOutputQty += orderOutputQty[orderNo]
		}

		tabProfit := tabRevenue - tabConsumptionCost
		var profitMargin *float64
		if tabRevenue > 0 {
			pm := roundTo(tabProfit/tabRevenue*100, 1)
			profitMargin = &pm
		}

		var onTimeRate *float64
		if finishedWithDates > 0 {
			otr := roundTo(float64(onTimeCount)/float64(finishedWithDates)*100, 1)
			onTimeRate = &otr
		}

		var avgLeadTime *float64
		if finishedOrders > 0 && totalLeadDays > 0 {
			alt := roundTo(totalLeadDays/float64(finishedOrders), 1)
			avgLeadTime = &alt
		}

		// ordersByStatus chart
		ordersByStatus := []map[string]any{}
		for status, count := range byStatus {
			ordersByStatus = append(ordersByStatus, map[string]any{
				"status": status,
				"count":  count,
			})
		}
		sort.Slice(ordersByStatus, func(i, j int) bool {
			ci := ordersByStatus[i]["count"].(int)
			cj := ordersByStatus[j]["count"].(int)
			return ci > cj
		})

		// costByProject chart
		projCost := map[string]float64{}
		projRev := map[string]float64{}
		for _, po := range orders {
			orderNo := toStr(po["orderNo"])
			dim2 := toStr(po["dim2Code"])
			if dim2 == "" {
				dim2 = "(ไม่ระบุ)"
			}
			projCost[dim2] += orderConsumptionCost[orderNo]
			projRev[dim2] += orderRevenue[orderNo]
		}
		costByProject := []map[string]any{}
		for proj, cost := range projCost {
			projName := projNameMap[proj]
			if projName == "" {
				projName = proj
			}
			costByProject = append(costByProject, map[string]any{
				"project":         projName,
				"consumptionCost": roundTo(cost, 2),
				"revenue":         roundTo(projRev[proj], 2),
			})
		}
		sort.Slice(costByProject, func(i, j int) bool {
			return costByProject[i]["consumptionCost"].(float64) > costByProject[j]["consumptionCost"].(float64)
		})

		// dailyTrend chart: group consumption & revenue by date
		dailyCons := map[string]float64{}
		dailyRev := map[string]float64{}
		for _, ce := range consumptionList {
			if !orderNoSet[ce.orderNo] {
				continue
			}
			if !ce.postingDate.IsZero() {
				key := ce.postingDate.Format("2006-01-02")
				dailyCons[key] += ce.costAmount
			}
		}
		for _, oe := range outputList {
			if !orderNoSet[oe.orderNo] {
				continue
			}
			if !oe.postingDate.IsZero() {
				key := oe.postingDate.Format("2006-01-02")
				price := salesPriceMap[oe.itemNo]
				if price == 0 {
					price = oe.itemPrice
				}
				dailyRev[key] += oe.quantity * price
			}
		}
		allDates := map[string]bool{}
		for d := range dailyCons {
			allDates[d] = true
		}
		for d := range dailyRev {
			allDates[d] = true
		}
		dateKeys := make([]string, 0, len(allDates))
		for d := range allDates {
			dateKeys = append(dateKeys, d)
		}
		sort.Strings(dateKeys)
		// Keep only last 60 days of data
		if len(dateKeys) > 60 {
			dateKeys = dateKeys[len(dateKeys)-60:]
		}
		dailyTrend := make([]map[string]any, 0, len(dateKeys))
		for _, d := range dateKeys {
			dailyTrend = append(dailyTrend, map[string]any{
				"date":        d,
				"consumption": roundTo(dailyCons[d], 2),
				"revenue":     roundTo(dailyRev[d], 2),
			})
		}

		// topOutputItems chart: top 10 items by output qty
		itemOutputQty := map[string]float64{}
		itemDesc := map[string]string{}
		for _, oe := range outputList {
			if !orderNoSet[oe.orderNo] {
				continue
			}
			itemOutputQty[oe.itemNo] += oe.quantity
			desc := oe.itemDesc
			if desc == "" {
				desc = oe.description
			}
			if desc != "" {
				itemDesc[oe.itemNo] = desc
			}
		}
		type itemQty struct {
			itemNo   string
			quantity float64
		}
		itemQtyList := make([]itemQty, 0, len(itemOutputQty))
		for k, v := range itemOutputQty {
			itemQtyList = append(itemQtyList, itemQty{k, v})
		}
		sort.Slice(itemQtyList, func(i, j int) bool {
			return itemQtyList[i].quantity > itemQtyList[j].quantity
		})
		if len(itemQtyList) > 10 {
			itemQtyList = itemQtyList[:10]
		}
		topOutputItems := make([]map[string]any, 0, len(itemQtyList))
		for _, iq := range itemQtyList {
			topOutputItems = append(topOutputItems, map[string]any{
				"itemNo":      iq.itemNo,
				"description": itemDesc[iq.itemNo],
				"quantity":    iq.quantity,
			})
		}

		// topConsumedItems chart: top 10 items by consumption cost
		itemConsCost := map[string]float64{}
		itemConsQty := map[string]float64{}
		itemConsDesc := map[string]string{}
		for _, ce := range consumptionList {
			if !orderNoSet[ce.orderNo] {
				continue
			}
			itemConsCost[ce.itemNo] += ce.costAmount
			itemConsQty[ce.itemNo] += ce.quantity
			desc := ce.itemDesc
			if desc == "" {
				desc = ce.description
			}
			if desc != "" {
				itemConsDesc[ce.itemNo] = desc
			}
		}
		type itemCost struct {
			itemNo string
			cost   float64
		}
		itemCostList := make([]itemCost, 0, len(itemConsCost))
		for k, v := range itemConsCost {
			itemCostList = append(itemCostList, itemCost{k, v})
		}
		sort.Slice(itemCostList, func(i, j int) bool {
			return itemCostList[i].cost > itemCostList[j].cost
		})
		if len(itemCostList) > 10 {
			itemCostList = itemCostList[:10]
		}
		topConsumedItems := make([]map[string]any, 0, len(itemCostList))
		for _, ic := range itemCostList {
			topConsumedItems = append(topConsumedItems, map[string]any{
				"itemNo":      ic.itemNo,
				"description": itemConsDesc[ic.itemNo],
				"cost":        roundTo(ic.cost, 2),
				"quantity":    itemConsQty[ic.itemNo],
			})
		}

		// costByDepartment chart
		deptCost := map[string]float64{}
		for _, ce := range consumptionList {
			if !orderNoSet[ce.orderNo] {
				continue
			}
			dim1 := ce.dim1Code
			if dim1 == "" {
				// fall back to order dim1
				dim1 = orderDim1[ce.orderNo]
			}
			if dim1 == "" {
				dim1 = "(ไม่ระบุ)"
			}
			deptName := deptNameMap[dim1]
			if deptName == "" {
				deptName = dim1
			}
			deptCost[deptName] += ce.costAmount
		}
		costByDepartment := []map[string]any{}
		for dept, cost := range deptCost {
			costByDepartment = append(costByDepartment, map[string]any{
				"department": dept,
				"cost":       roundTo(cost, 2),
			})
		}
		sort.Slice(costByDepartment, func(i, j int) bool {
			return costByDepartment[i]["cost"].(float64) > costByDepartment[j]["cost"].(float64)
		})

		// onTimeTrend chart: monthly on-time rate
		monthOnTime := map[string]int{}
		monthFinished := map[string]int{}
		for _, po := range orders {
			status := toStr(po["status"])
			if status != "Finished" {
				continue
			}
			finishedDate, hasFD := toTime(po["finishedDate"])
			dueDate, hasDD := toTime(po["dueDate"])
			if !hasFD || !hasDD {
				continue
			}
			monthKey := finishedDate.Format("2006-01")
			monthFinished[monthKey]++
			if !finishedDate.After(dueDate) {
				monthOnTime[monthKey]++
			}
		}
		monthKeys := make([]string, 0, len(monthFinished))
		for k := range monthFinished {
			monthKeys = append(monthKeys, k)
		}
		sort.Strings(monthKeys)
		onTimeTrend := make([]map[string]any, 0, len(monthKeys))
		for _, mk := range monthKeys {
			rate := 0.0
			if monthFinished[mk] > 0 {
				rate = roundTo(float64(monthOnTime[mk])/float64(monthFinished[mk])*100, 1)
			}
			onTimeTrend = append(onTimeTrend, map[string]any{
				"month": mk,
				"rate":  rate,
			})
		}

		// leadTimeTrend chart: monthly avg lead time
		monthLeadSum := map[string]float64{}
		monthLeadCount := map[string]int{}
		for _, po := range orders {
			status := toStr(po["status"])
			if status != "Finished" {
				continue
			}
			finishedDate, hasFD := toTime(po["finishedDate"])
			startDate, hasSD := toTime(po["startingDateTime"])
			if !hasFD || !hasSD {
				continue
			}
			days := finishedDate.Sub(startDate).Hours() / 24
			if days < 0 {
				continue
			}
			monthKey := finishedDate.Format("2006-01")
			monthLeadSum[monthKey] += days
			monthLeadCount[monthKey]++
		}
		leadMonthKeys := make([]string, 0, len(monthLeadCount))
		for k := range monthLeadCount {
			leadMonthKeys = append(leadMonthKeys, k)
		}
		sort.Strings(leadMonthKeys)
		leadTimeTrend := make([]map[string]any, 0, len(leadMonthKeys))
		for _, mk := range leadMonthKeys {
			avg := 0.0
			if monthLeadCount[mk] > 0 {
				avg = roundTo(monthLeadSum[mk]/float64(monthLeadCount[mk]), 1)
			}
			leadTimeTrend = append(leadTimeTrend, map[string]any{
				"month":   mk,
				"avgDays": avg,
				"count":   monthLeadCount[mk],
			})
		}

		// wipByOrder chart: released orders with cost/revenue
		wipByOrder := []map[string]any{}
		for _, po := range orders {
			status := toStr(po["status"])
			if status != "Released" {
				continue
			}
			orderNo := toStr(po["orderNo"])
			consCost := orderConsumptionCost[orderNo]
			rev := orderRevenue[orderNo]
			if consCost == 0 && rev == 0 {
				continue
			}
			wipByOrder = append(wipByOrder, map[string]any{
				"orderNo":         orderNo,
				"description":     toStr(po["description"]),
				"consumptionCost": roundTo(consCost, 2),
				"revenue":         roundTo(rev, 2),
				"wipValue":        roundTo(consCost-rev, 2),
			})
		}
		sort.Slice(wipByOrder, func(i, j int) bool {
			wi := wipByOrder[i]["wipValue"].(float64)
			wj := wipByOrder[j]["wipValue"].(float64)
			return wi > wj
		})

		// wipDetail table: released orders with progress
		wipDetail := []map[string]any{}
		for _, po := range orders {
			status := toStr(po["status"])
			if status != "Released" {
				continue
			}
			orderNo := toStr(po["orderNo"])
			plannedQty := toFloat(po["quantity"])
			outputQty := orderOutputQty[orderNo]
			remainQty := plannedQty - outputQty
			completionPct := 0.0
			if plannedQty > 0 {
				completionPct = roundTo(outputQty/plannedQty*100, 0)
			}
			consCost := orderConsumptionCost[orderNo]
			rev := orderRevenue[orderNo]
			wipVal := consCost - rev
			var dueDateStr any
			if dd, ok := toTime(po["dueDate"]); ok {
				dueDateStr = dd.Format(time.RFC3339)
			}
			wipDetail = append(wipDetail, map[string]any{
				"_key":            orderNo,
				"orderNo":         orderNo,
				"description":     toStr(po["description"]),
				"sourceNo":        toStr(po["sourceNo"]),
				"uom":             toStr(po["uom"]),
				"plannedQty":      plannedQty,
				"outputQty":       outputQty,
				"remainQty":       remainQty,
				"completionPct":   completionPct,
				"consumptionCost": roundTo(consCost, 2),
				"revenue":         roundTo(rev, 2),
				"wipValue":        roundTo(wipVal, 2),
				"dueDate":         dueDateStr,
			})
		}
		sort.Slice(wipDetail, func(i, j int) bool {
			pi := wipDetail[i]["completionPct"].(float64)
			pj := wipDetail[j]["completionPct"].(float64)
			return pi < pj
		})

		// fgByProductType chart: output grouped by item category
		catQty := map[string]float64{}
		catRev := map[string]float64{}
		catCount := map[string]int{}
		for _, oe := range outputList {
			if !orderNoSet[oe.orderNo] {
				continue
			}
			cat := oe.itemCategory
			if cat == "" {
				cat = "(ไม่ระบุ)"
			}
			catQty[cat] += oe.quantity
			price := salesPriceMap[oe.itemNo]
			if price == 0 {
				price = oe.itemPrice
			}
			catRev[cat] += oe.quantity * price
			catCount[cat]++
		}
		fgByProductType := []map[string]any{}
		for cat, qty := range catQty {
			fgByProductType = append(fgByProductType, map[string]any{
				"category": cat,
				"quantity": qty,
				"revenue":  roundTo(catRev[cat], 2),
				"count":    catCount[cat],
			})
		}
		sort.Slice(fgByProductType, func(i, j int) bool {
			return fgByProductType[i]["quantity"].(float64) > fgByProductType[j]["quantity"].(float64)
		})

		// profitByItem chart
		// aggregate per item: outputQty, consumptionCost (per order -> per item)
		type itemProfit struct {
			itemNo       string
			description  string
			outputQty    float64
			revenue      float64
			consCost     float64
			sellingPrice float64
		}
		itemProfitMap := map[string]*itemProfit{}
		// Build per-item output qty from output entries
		for _, oe := range outputList {
			if !orderNoSet[oe.orderNo] {
				continue
			}
			ip := itemProfitMap[oe.itemNo]
			if ip == nil {
				desc := oe.itemDesc
				if desc == "" {
					desc = oe.description
				}
				price := salesPriceMap[oe.itemNo]
				if price == 0 {
					price = oe.itemPrice
				}
				ip = &itemProfit{
					itemNo:       oe.itemNo,
					description:  desc,
					sellingPrice: price,
				}
				itemProfitMap[oe.itemNo] = ip
			}
			ip.outputQty += oe.quantity
			ip.revenue += oe.quantity * ip.sellingPrice
		}
		// Build per-item consumption cost from the production order source items
		// We need to distribute order consumption cost to the source item
		for _, po := range orders {
			orderNo := toStr(po["orderNo"])
			sourceNo := toStr(po["sourceNo"])
			cost := orderConsumptionCost[orderNo]
			if sourceNo == "" || cost == 0 {
				continue
			}
			ip := itemProfitMap[sourceNo]
			if ip == nil {
				desc := toStr(po["itemDescription"])
				if desc == "" {
					desc = toStr(po["description"])
				}
				price := salesPriceMap[sourceNo]
				if price == 0 {
					price = toFloat(po["itemUnitPrice"])
				}
				ip = &itemProfit{
					itemNo:       sourceNo,
					description:  desc,
					sellingPrice: price,
				}
				itemProfitMap[sourceNo] = ip
			}
			ip.consCost += cost
		}
		profitByItem := []map[string]any{}
		for _, ip := range itemProfitMap {
			profitAmt := ip.revenue - ip.consCost
			costPerUnit := 0.0
			if ip.outputQty > 0 {
				costPerUnit = roundTo(ip.consCost/ip.outputQty, 2)
			}
			var pm *float64
			if ip.revenue > 0 {
				v := roundTo(profitAmt/ip.revenue*100, 1)
				pm = &v
			}
			profitByItem = append(profitByItem, map[string]any{
				"itemNo":          ip.itemNo,
				"description":     ip.description,
				"sellingPrice":    ip.sellingPrice,
				"costPerUnit":     costPerUnit,
				"outputQty":       ip.outputQty,
				"totalRevenue":    roundTo(ip.revenue, 2),
				"consumptionCost": roundTo(ip.consCost, 2),
				"profitAmount":    roundTo(profitAmt, 2),
				"profitMargin":    pm,
			})
		}
		sort.Slice(profitByItem, func(i, j int) bool {
			pi := profitByItem[i]["profitAmount"].(float64)
			pj := profitByItem[j]["profitAmount"].(float64)
			return pi > pj
		})

		// profitByProject section
		type projItem struct {
			itemNo      string
			description string
			category    string
			outputQty   float64
			soQty       float64
			shippedQty  float64
			unitPrice   float64
			costPerUnit float64
			revenue     float64
			totalCost   float64
		}
		projItems := map[string]map[string]*projItem{}
		for _, po := range orders {
			orderNo := toStr(po["orderNo"])
			dim2 := toStr(po["dim2Code"])
			if dim2 == "" {
				dim2 = "(ไม่ระบุ)"
			}
			sourceNo := toStr(po["sourceNo"])
			if sourceNo == "" {
				continue
			}
			if projItems[dim2] == nil {
				projItems[dim2] = map[string]*projItem{}
			}
			pi := projItems[dim2][sourceNo]
			if pi == nil {
				desc := toStr(po["itemDescription"])
				if desc == "" {
					desc = toStr(po["description"])
				}
				price := salesPriceMap[sourceNo]
				if price == 0 {
					price = toFloat(po["itemUnitPrice"])
				}
				pi = &projItem{
					itemNo:      sourceNo,
					description: desc,
					category:    toStr(po["itemCategory"]),
					unitPrice:   price,
				}
				projItems[dim2][sourceNo] = pi
			}
			pi.outputQty += orderOutputQty[orderNo]
			pi.totalCost += orderConsumptionCost[orderNo]
			pi.revenue += orderRevenue[orderNo]
			if pi.outputQty > 0 {
				pi.costPerUnit = pi.totalCost / pi.outputQty
			}
		}
		profitByProject := []map[string]any{}
		for projCode, items := range projItems {
			projName := projNameMap[projCode]
			if projName == "" {
				projName = projCode
			}
			var totalRev, totalCost, totalProfit float64
			itemList := []map[string]any{}
			for _, pi := range items {
				profit := pi.revenue - pi.totalCost
				var margin *float64
				if pi.revenue > 0 {
					v := roundTo(profit/pi.revenue*100, 1)
					margin = &v
				}
				itemList = append(itemList, map[string]any{
					"itemNo":      pi.itemNo,
					"description": pi.description,
					"category":    pi.category,
					"outputQty":   pi.outputQty,
					"soQty":       pi.soQty,
					"shippedQty":  pi.shippedQty,
					"unitPrice":   pi.unitPrice,
					"costPerUnit": roundTo(pi.costPerUnit, 2),
					"revenue":     roundTo(pi.revenue, 2),
					"totalCost":   roundTo(pi.totalCost, 2),
					"profit":      roundTo(profit, 2),
					"margin":      margin,
				})
				totalRev += pi.revenue
				totalCost += pi.totalCost
			}
			totalProfit = totalRev - totalCost
			sort.Slice(itemList, func(i, j int) bool {
				ri := itemList[i]["revenue"].(float64)
				rj := itemList[j]["revenue"].(float64)
				return ri > rj
			})
			var projMargin *float64
			if totalRev > 0 {
				v := roundTo(totalProfit/totalRev*100, 1)
				projMargin = &v
			}
			profitByProject = append(profitByProject, map[string]any{
				"projectCode":  projCode,
				"projectName":  projName,
				"totalRevenue": roundTo(totalRev, 2),
				"totalCost":    roundTo(totalCost, 2),
				"totalProfit":  roundTo(totalProfit, 2),
				"margin":       projMargin,
				"items":        itemList,
			})
		}
		sort.Slice(profitByProject, func(i, j int) bool {
			ri := profitByProject[i]["totalRevenue"].(float64)
			rj := profitByProject[j]["totalRevenue"].(float64)
			return ri > rj
		})

		// employeeSpecialization chart
		// Group output entries by employee (from ILE description which contains the employee name)
		type empCatData struct {
			quantity float64
			orders   map[string]bool
			leadDays float64
			leadCnt  int
		}
		type empData struct {
			totalQty  float64
			orderSet  map[string]bool
			catMap    map[string]*empCatData
			leadDays  float64
			leadCount int
		}
		empMap := map[string]*empData{}

		// Build order finished date and start date maps for lead time calc
		orderFinished := map[string]time.Time{}
		orderStarted := map[string]time.Time{}
		for _, po := range orders {
			orderNo := toStr(po["orderNo"])
			if fd, ok := toTime(po["finishedDate"]); ok {
				orderFinished[orderNo] = fd
			}
			if sd, ok := toTime(po["startingDateTime"]); ok {
				orderStarted[orderNo] = sd
			}
		}

		for _, oe := range outputList {
			if !orderNoSet[oe.orderNo] {
				continue
			}
			// Employee name is in documentNo or description field
			// In BC, output entries often have employee info in the description
			empName := toStr(oe.description)
			if empName == "" {
				continue
			}
			// Split by / for multiple employees
			empNames := strings.Split(empName, "/")
			shareQty := oe.quantity / float64(len(empNames))
			cat := oe.itemCategory
			if cat == "" {
				cat = "(ไม่ระบุ)"
			}
			for _, name := range empNames {
				name = strings.TrimSpace(name)
				if name == "" {
					continue
				}
				ed := empMap[name]
				if ed == nil {
					ed = &empData{
						orderSet: map[string]bool{},
						catMap:   map[string]*empCatData{},
					}
					empMap[name] = ed
				}
				ed.totalQty += shareQty
				ed.orderSet[oe.orderNo] = true

				cd := ed.catMap[cat]
				if cd == nil {
					cd = &empCatData{orders: map[string]bool{}}
					ed.catMap[cat] = cd
				}
				cd.quantity += shareQty
				cd.orders[oe.orderNo] = true

				// Lead time for this order
				fd, hasFD := orderFinished[oe.orderNo]
				sd, hasSD := orderStarted[oe.orderNo]
				if hasFD && hasSD {
					days := fd.Sub(sd).Hours() / 24
					if days >= 0 && !ed.orderSet[oe.orderNo+"_lead"] {
						ed.orderSet[oe.orderNo+"_lead"] = true
						ed.leadDays += days
						ed.leadCount++
						if !cd.orders[oe.orderNo+"_lead"] {
							cd.orders[oe.orderNo+"_lead"] = true
							cd.leadDays += days
							cd.leadCnt++
						}
					}
				}
			}
		}

		type empSort struct {
			name string
			data *empData
		}
		empList := make([]empSort, 0, len(empMap))
		for name, data := range empMap {
			empList = append(empList, empSort{name, data})
		}
		sort.Slice(empList, func(i, j int) bool {
			return empList[i].data.totalQty > empList[j].data.totalQty
		})
		if len(empList) > 15 {
			empList = empList[:15]
		}

		employeeSpec := make([]map[string]any, 0, len(empList))
		for _, es := range empList {
			// Build categories
			type catSort struct {
				cat  string
				data *empCatData
			}
			catList := make([]catSort, 0, len(es.data.catMap))
			for cat, data := range es.data.catMap {
				catList = append(catList, catSort{cat, data})
			}
			sort.Slice(catList, func(i, j int) bool {
				return catList[i].data.quantity > catList[j].data.quantity
			})
			topCategory := ""
			if len(catList) > 0 {
				topCategory = catList[0].cat
			}
			categories := make([]map[string]any, 0, len(catList))
			for _, cs := range catList {
				catOrderCount := 0
				for k := range cs.data.orders {
					if !strings.HasSuffix(k, "_lead") {
						catOrderCount++
					}
				}
				catEntry := map[string]any{
					"category": cs.cat,
					"quantity": roundTo(cs.data.quantity, 0),
					"orders":   catOrderCount,
				}
				if cs.data.leadCnt > 0 {
					catEntry["avgDays"] = roundTo(cs.data.leadDays/float64(cs.data.leadCnt), 1)
				}
				categories = append(categories, catEntry)
			}

			orderCount := 0
			for k := range es.data.orderSet {
				if !strings.HasSuffix(k, "_lead") {
					orderCount++
				}
			}

			entry := map[string]any{
				"employee":    es.name,
				"totalQty":    roundTo(es.data.totalQty, 0),
				"orderCount":  orderCount,
				"topCategory": topCategory,
				"categories":  categories,
			}
			if es.data.leadCount > 0 {
				entry["avgLeadTime"] = roundTo(es.data.leadDays/float64(es.data.leadCount), 1)
			}
			employeeSpec = append(employeeSpec, entry)
		}

		result := map[string]any{
			"totalOrders":          totalOrders,
			"releasedOrders":       releasedOrders,
			"finishedOrders":       finishedOrders,
			"onTimeRate":           onTimeRate,
			"avgLeadTime":          avgLeadTime,
			"totalConsumptionCost": roundTo(tabConsumptionCost, 2),
			"totalRevenue":         roundTo(tabRevenue, 2),
			"totalProfit":          roundTo(tabProfit, 2),
			"profitMargin":         profitMargin,
			"wipValue":             roundTo(tabWipValue, 2),
			"totalOutputQty":       tabOutputQty,
			"overdueCount":         len(overdueOrders),
			"overdueOrders":        overdueOrders,
			"ordersByStatus":       ordersByStatus,
			"costByProject":        costByProject,
			"dailyTrend":           dailyTrend,
			"topOutputItems":       topOutputItems,
			"topConsumedItems":     topConsumedItems,
			"costByDepartment":     costByDepartment,
			"onTimeTrend":          onTimeTrend,
			"leadTimeTrend":        leadTimeTrend,
			"wipByOrder":           wipByOrder,
			"wipDetail":            wipDetail,
			"fgByProductType":      fgByProductType,
			"profitByItem":         profitByItem,
			"profitByProject":      profitByProject,
			"employeeSpecialization": employeeSpec,
		}

		// Ensure nil slices become empty arrays in JSON
		if result["overdueOrders"] == nil {
			result["overdueOrders"] = []map[string]any{}
		}
		if result["wipDetail"] == nil {
			result["wipDetail"] = []map[string]any{}
		}

		return result
	}

	wpc := buildTab(wpcOrders.orders)
	other := buildTab(otherOrders.orders)

	response.OK(w, map[string]any{
		"wpc":   wpc,
		"other": other,
	})
}

// ---- Cores ----

func (h *Handler) ListCores(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.ListCores(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- Frames ----

func (h *Handler) ListFrames(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.ListFrames(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, data)
}

// ---- FG Coverage ----

func (h *Handler) FgCoverage(w http.ResponseWriter, r *http.Request) {
	data, err := h.store.FgCoverage(r.Context())
	if err != nil {
		response.InternalError(w, err)
		return
	}
	response.OK(w, map[string]any{"fgCoverage": data})
}

// ---- BOM AI ----

func (h *Handler) BomAi(w http.ResponseWriter, r *http.Request) {
	response.OK(w, map[string]string{"status": "coming_soon"})
}
