<script lang="ts">
  import "@carbon/styles/css/styles.css";
  import "@carbon/charts/styles.css";
  import type { ScaleTypes, AreaChartOptions, LineChartOptions } from "@carbon/charts/interfaces"
	import { createDbConnection, getIncomesFromDatabase, getSpendingsFromDatabase, type Income, type Spending } from "../helpers/db";
	import { onMount } from "svelte";
	import { AreaChart } from "@carbon/charts-svelte";

    let db: IDBDatabase | null;
    let incomes: Income[] = [];
    let spendings: Spending[] = [];

    let chartType = "normal";

    let stackedAreaChart: typeof import("@carbon/charts-svelte").StackedAreaChart;
    let lineChart: typeof import("@carbon/charts-svelte").LineChart;

    onMount(async () => {
        db = await createDbConnection();
        const charts = await import("@carbon/charts-svelte");
        stackedAreaChart = charts.StackedAreaChart;
        lineChart = charts.LineChart;
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

    const fullOptions: AreaChartOptions | LineChartOptions = {
      "title": "",
      "axes": {
        "bottom": {
          "title": "Fecha",
          "mapsTo": "date",
          "scaleType": "time" as ScaleTypes,
          // "ticks": {
          //   "formatter": (date: number) => new Date(date).toLocaleDateString()
          // }
        },		
        "left": {
          "stacked": true,
          "title": "Dinero (pesos)"
        },
      },
      "curve": "curveMonotoneX",
      "height": "400px",
      "timeScale": {
        "addSpaceOnEdges": 1
      },
      "color": {
        "pairing": {
          "option": 2,
        },
        "scale": {
          "Ingreso": "#0F4392",
          "Gasto": "#FF4949",
        }
      },
    }

    function getPerDay(incomes: Income[], spendings: Spending[]) {
        const ret: {group: string, date: number, value: number}[] = [];
        
        const datesSet = new Set([
          ...incomes.map((d) => d.timestamp),
          ...spendings.map((d) => d.timestamp),
        ]);

        const dates = Array.from(datesSet).sort(); // esto se puede hacer más rápido

        let incomeIdx = 0;
        let spendingIdx = 0;

        const perDate = dates.map((date) => {
          let income = 0;
          let spending = 0;
          if(incomeIdx < incomes.length && incomes[incomeIdx].timestamp == date) {
            income = incomes[incomeIdx].value;
            incomeIdx++;
          }
          if(spendingIdx < spendings.length && spendings[spendingIdx].timestamp == date) {
            spending = spendings[spendingIdx].value;
            spendingIdx++;
          }
          return {
            income,
            spending,
            date
          }
        })

        perDate.forEach((val) => {
          if(val.income > 0) {
            ret.push({
              group: "Ingreso",
              value: val.income,
              date: val.date
            })
          }
          if(val.spending > 0) {
            ret.push({
              group: "Gasto",
              value: val.spending,
              date: val.date
            })
          }
        })

        return ret;

    }

    function getCumulativePerDay(incomes: Income[], spendings: Spending[]) {
        const ret: {group: string, date: number, value: number}[] = [];
        
        const datesSet = new Set([
          ...incomes.map((d) => d.timestamp),
          ...spendings.map((d) => d.timestamp),
        ]);

        const dates = Array.from(datesSet).sort(); // esto se puede hacer más rápido

        let incomeIdx = 0;
        let spendingIdx = 0;

        const perDate = dates.map((date) => {
          let income = 0;
          let spending = 0;
          if(incomeIdx < incomes.length && incomes[incomeIdx].timestamp == date) {
            income = incomes[incomeIdx].value;
          }
          if(spendingIdx < spendings.length && spendings[spendingIdx].timestamp == date) {
            spending = spendings[spendingIdx].value;
          }
          return {
            income,
            spending,
            date
          }
        })

        const cumulativePerDate: {income: number, spending: number, date: number}[] = [];

        perDate.forEach((val, i, arr) => {
          cumulativePerDate.push({
            income: i == 0 ? val.income : val.income + cumulativePerDate[cumulativePerDate.length-1].income,
            spending: i == 0 ? val.spending : val.spending + cumulativePerDate[cumulativePerDate.length-1].spending,
            date: val.date
          })
        })

        cumulativePerDate.forEach((val) => {
          ret.push({
            group: "Ingreso",
            value: val.income,
            date: val.date
          })
          ret.push({
            group: "Gasto",
            value: -val.spending,
            date: val.date
          })
        })

        return ret;


        // arr.forEach((val, idx) => {
        //     const date = new Date(val.timestamp).getTime();
        //     // if(idx == 0 || ret[ret.length - 1].date != date) {
        //     //     ret.push({
        //     //         group: type,
        //     //         date: date,
        //     //         value: idx == 0 ? val.value : val.value + ret[ret.length - 1].value
        //     //     })
        //     // } else {
        //     //     ret[ret.length - 1].value += val.value
        //     // }
        //     let value;
        //     if(type == "Gastos") {
        //       value = - val.value;
        //     } else {
        //       value = val.value;
        //     }
        //     ret.push({
        //         group: type,
        //         date: date,
        //         value: idx == 0 ? value : value + ret[ret.length - 1].value
        //     })
        // })
        // ret.push({
        //   group: type,
        //   date: Date.now(),
        //   value: ret.length != 0 ? ret[ret.length - 1].value : 0
        // })
        // return ret;
    }

    $: allBudgetCumulative = getCumulativePerDay(incomes, spendings);
    $: allBudget = getPerDay(incomes, spendings)
</script>

<h1 class="text-2xl text-gray-700 font-bold mb-2">Resumen de Gastos</h1>

<select class="rounded px-2 py-1" bind:value={chartType}>
  <option value="normal">Diario</option>
  <option value="cumulative">Acumulado</option>
</select>

<div class="px-4">
  {#if chartType == "normal"}
    <svelte:component
      this={lineChart}
      data={allBudget}
      options={fullOptions} 
    />
  {/if}
  {#if chartType == "cumulative"}
    <svelte:component
        this={stackedAreaChart}
        data={allBudgetCumulative}
        options={fullOptions} 
    />
  {/if}
</div>