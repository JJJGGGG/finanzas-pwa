<script lang="ts">
  import "@carbon/styles/css/styles.css";
  import "@carbon/charts/styles.css";
  import type { ScaleTypes, AreaChartOptions } from "@carbon/charts/interfaces"
	import { createDbConnection, getIncomesFromDatabase, getSpendingsFromDatabase, type Income, type Spending } from "../helpers/db";
	import { onMount } from "svelte";

    let db: IDBDatabase | null;
    let incomes: Income[] = [];
    let spendings: Spending[] = [];

    let chart: typeof import("@carbon/charts-svelte").AreaChart;

    onMount(async () => {
        db = await createDbConnection();
        const charts = await import("@carbon/charts-svelte");
        chart = charts.AreaChart;
    })

    async function loadIncomesFromDatabase() {
        if(db) {
            incomes = await getIncomesFromDatabase(db)
        }
    }
    async function loadSpendingsFromDatabase() {
        if(db) {
            spendings = await getSpendingsFromDatabase(db)
        }
    }

    $: db && loadIncomesFromDatabase();
    $: db && loadSpendingsFromDatabase();

    const fullOptions: AreaChartOptions = {
      "title": "",
      "axes": {
        "bottom": {
          "title": "Fecha",
          "mapsTo": "date",
          "scaleType": "time" as ScaleTypes,
			    "stacked": true,
          "ticks": {
            "formatter": (date: number) => new Date(date).toLocaleDateString()
          }
        },
        "left": {
          "mapsTo": "value",
          "title": "Acumulado (pesos)",
          "scaleType": "linear" as ScaleTypes
        }
      },
      "curve": "curveMonotoneX",
      "height": "400px"
    }

    function getCumulativePerDay(arr: Income[] | Spending[], type: string) {
        const ret: {group: string, date: number, value: number}[] = [];
        arr.forEach((val, idx) => {
            const date = new Date(val.timestamp).setHours(0, 0, 0, 0);
            if(idx == 0 || ret[ret.length - 1].date != date) {
                ret.push({
                    group: type,
                    date: date,
                    value: val.value
                })
            } else {
                ret[ret.length - 1].value += val.value
            }
        })
        console.log(ret);
        return ret;
    }

    $: incomesPerDay = getCumulativePerDay(incomes, "Ingresos")
    $: spendingsPerDay = getCumulativePerDay(spendings, "Gastos")
</script>

<h1 class="text-2xl text-gray-700 font-bold mb-2">Resumen de Gastos</h1>

<div class="px-4">
  <svelte:component
      this={chart}
      data={incomesPerDay.concat(spendingsPerDay)}
      options={fullOptions} 
  />
</div>