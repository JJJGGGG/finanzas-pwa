<script lang="ts">
  import "@carbon/styles/css/styles.css";
  import "@carbon/charts/styles.css";
  import type { ScaleTypes, TickRotations, LineChartOptions } from "@carbon/charts/interfaces"
	import { createDbConnection, getIncomesFromDatabase, getSpendingsFromDatabase, type Income, type Spending } from "../helpers/db";
	import { onMount } from "svelte";
  import { DateInput } from "date-picker-svelte"

    let db: IDBDatabase | null;
    let incomes: Income[] = [];
    let spendings: Spending[] = [];

    let chartType = "balance";

    let lineChart: typeof import("@carbon/charts-svelte").LineChart;

    let initialDate: Date;
    let finalDate: Date;

    let minDate: Date;
    let maxDate: Date;

    let loadedIncomes = false;
    let loadedSpendings = false;

    onMount(async () => {
        db = await createDbConnection();
        const charts = await import("@carbon/charts-svelte");
        lineChart = charts.LineChart;
    })

    function updateDates(spendings: Spending[], incomes: Income[]) {
      const dates = getDates(incomes, spendings);

      minDate = new Date(new Date(dates[0]).setHours(0,0,0,0));

      maxDate = new Date(new Date(dates[dates.length - 1]).setHours(23, 59, 59, 999));

      initialDate = minDate;
      finalDate = maxDate;
    }

    $: (spendings.length || incomes.length) && updateDates(spendings, incomes)

    async function loadIncomesFromDatabase() {
        if(db) {
            incomes = await getIncomesFromDatabase(db);
            setTimeout(() => {
              loadedIncomes = true
            }, 500);
        }
    }
    async function loadSpendingsFromDatabase() {
        if(db) {
            spendings = await getSpendingsFromDatabase(db);
            setTimeout(() => {
              loadedSpendings = true
            }, 500);
        }
    }

    $: db && loadIncomesFromDatabase();
    $: db && loadSpendingsFromDatabase();


    const fullOptions: LineChartOptions = {
      "title": "",
      "axes": {
        "bottom": {
          "title": "Fecha",
          "mapsTo": "date",
          "scaleType": "time" as ScaleTypes,
          // "ticks": {
          //   "formatter": (date: number) => new Date(date).toLocaleDateString()
          // }

          "ticks": {
            "rotation": "always" as TickRotations
          }
        },		
        "left": {
          "stacked": true,
          "title": "Dinero (pesos)"
        },
      },
      "curve": "curveMonotoneX",
      "height": "400px",
      // "timeScale": {
      //   "addSpaceOnEdges": 1
      // },
      "color": {
        "pairing": {
          "option": 2,
        },
        "scale": {
          "Ingreso": "#0F4392",
          "Gasto": "#FF4949",
          "Balance": "#9400D3"
        }
      },
    }

    function getDates(incomes: Income[], spendings: Spending[]) {
      const datesSet = new Set([
          ...incomes.map((d) => d.timestamp),
          ...spendings.map((d) => d.timestamp),
        ]);

        const dates = Array.from(datesSet).sort(); // esto se puede hacer más rápido

        return dates;
    }

    function getCumulativePerDay(incomes: Income[], spendings: Spending[]) {
        const ret: {group: string, date: number, value: number}[] = [];
        
        const dates = getDates(incomes, spendings);

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

        const cumulativePerDate: {income: number, spending: number, date: number}[] = [];

        perDate.forEach((val, i, arr) => {
          console.log(val)
          cumulativePerDate.push({
            income: i == 0 ? val.income : val.income + cumulativePerDate[cumulativePerDate.length-1].income,
            spending: i == 0 ? val.spending : val.spending + cumulativePerDate[cumulativePerDate.length-1].spending,
            date: val.date
          })
        })

        return cumulativePerDate;
    }

    function getGraphData(abc: {income: number; spending: number; date: number; }[], chartType: string) {
      console.log(abc)
      if(chartType == "balance") {
        return abc.map((val) => ({group: "Balance", value: val.income - val.spending, date: val.date}))
      }
      if(chartType == "income") {
        let abc2 = abc.slice(abc.findIndex((val) => val.income != 0));
        abc2 = abc2.filter((val, i, arr) => i == 0 || arr[i-1].income != val.income);
        return abc2.map((val) => ({group: "Ingreso", value: val.income, date: val.date}))
      }
      if((chartType == "spending") || true) {
        let abc2 = abc.slice(abc.findIndex((val) => val.spending != 0));
        abc2 = abc2.filter((val, i, arr) => i == 0 || arr[i-1].spending != val.spending);
        return abc2.map((val) => ({group: "Gasto", value: val.spending, date: val.date}))
      }
    }

    $: allBudgetCumulative = getCumulativePerDay(incomes, spendings);
    $: data = getGraphData(allBudgetCumulative, chartType)
</script>

<h1 class="text-2xl text-gray-700 font-bold mb-2">Resumen de Gastos</h1>

{#if loadedIncomes && loadedSpendings}
  {#if incomes.length || spendings.length}
    <h2 class="text-base text-gray-700 font-bold mb-2">Tipo de gráfico</h2>
    <select class="rounded px-2 py-1 mb-4" bind:value={chartType}>
      <option value="balance">Balance</option>
      {#if incomes.length}<option value="income">Ingresos</option>{/if}
      {#if spendings.length}<option value="spending">Gastos</option>{/if}
    </select>
    <h2 class="text-base text-gray-700 font-bold mb-2">Filtrar por fecha</h2>
    <div class="flex gap-4">
      <div>
      <div class="text-gray-700 font-bold mb-2">Inicio</div>
      <DateInput bind:value={initialDate} min={minDate} max={finalDate} format="yyyy-MM-dd" />
      </div>
      <div>
      <div  class="text-gray-700 font-bold mb-2">Final</div>
      <DateInput bind:value={finalDate} min={initialDate} max={maxDate} format="yyyy-MM-dd"/>
      </div>
    </div>
    <div class="px-4">
      <svelte:component
        style="padding: 10px 10px 10px 10px"
        this={lineChart}
        data={data.filter((val) => val.date >= initialDate.getTime() && val.date <= finalDate.getTime())}
        options={fullOptions} 
      />
    </div>
    {:else}

    <div class="h-20 flex flex-col justify-center">
      No hay ingresos ni gastos.
    </div>
    {/if}
{:else}
<div class="h-20 flex flex-col justify-center">
  <svg version="1.1" id="L9" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
  viewBox="0 0 100 100" enable-background="new 0 0 0 0" xml:space="preserve">
    <path fill="#000" d="M73,50c0-12.7-10.3-23-23-23S27,37.3,27,50 M30.9,50c0-10.5,8.5-19.1,19.1-19.1S69.1,39.5,69.1,50">
      <animateTransform 
         attributeName="transform" 
         attributeType="XML" 
         type="rotate"
         dur="1s" 
         from="0 50 50"
         to="360 50 50" 
         repeatCount="indefinite" />
    </path>
  </svg>
</div>
{/if}