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
  let incomesPerDay: { value: number, date: number }[] = [];
  let spendingsPerDay: { value: number, date: number }[] = [];
  let cumulativeIncomesPerDay: { value: number, date: number }[] = [];
  let cumulativeSpendingsPerDay: { value: number, date: number }[] = [];
  let balance: { value: number, date: number }[] = [];

  let chartType = "balance";

  let lineChart: typeof import("@carbon/charts-svelte").LineChart;
  let barChart: typeof import("@carbon/charts-svelte").BarChartStacked;

  let initialDate: Date = new Date(0);
  let finalDate: Date = new Date(8640000000000000);
  let minDate: Date = new Date(0);
  let maxDate: Date = new Date(8640000000000000);

  let loaded = false;
  let dates: number[] = [];

  onMount(async () => {
      db = await createDbConnection();
      const charts = await import("@carbon/charts-svelte");
      lineChart = charts.AreaChart;
      barChart = charts.BarChartStacked;
      await loadFromDatabase();
  });

  function getDates(incomes: {value: number, date:number}[], spendings: {value: number, date:number}[]) {
    // TODO: 
    const datesSet = new Set([
        ...incomes.map((d) => d.date),
        ...spendings.map((d) => d.date),
      ]);

      const dates = Array.from(datesSet).sort(); // esto se puede hacer más rápido

      return dates;
  }

  function joinPerDay(arr: Income[] | Spending[]) {
    const arrPerDay: { value: number, date: number }[] = [];
    // TODO: hacerlo por categorías

    let lastDate: undefined | number = undefined;
    arr.forEach((el) => {
      const currentDate = new Date(el.timestamp).setHours(0,0,0,0);
      if(lastDate == undefined || lastDate != currentDate) {
        arrPerDay.push({value: el.value, date: currentDate})
      } else {
        arrPerDay[arrPerDay.length - 1].value += el.value;
      }
      lastDate = currentDate;
    });

    return arrPerDay
  }

  function getCumulativeBetweenDates(arr: { value: number, date: number }[], initialDate: number, finalDate: number) {
    const result: { value: number, date: number }[] = [];

    arr = arr.filter((val) => val.date >= initialDate && val.date <= finalDate);

    arr.forEach((el, i) => i == 0 ? result.push(el) : result.push({ date: el.date, value: result[i-1].value + el.value }))
  
    return result;
  }

  async function loadFromDatabase() {
    if(db) {
      incomes = await getIncomesFromDatabase(db);
      spendings = await getSpendingsFromDatabase(db);
      incomesPerDay = joinPerDay(incomes);
      spendingsPerDay = joinPerDay(spendings);
      dates = getDates(incomesPerDay, spendingsPerDay);
      if(dates.length) {
        minDate = new Date(new Date(dates[0]).setHours(0,0,0,0));
        maxDate = new Date(new Date(dates[dates.length - 1]).setHours(23, 59, 59, 999));
        initialDate = minDate;
        finalDate = maxDate;
      }
      setTimeout(() => loaded = true, 200);
    }
  }


  $: cumulativeIncomesPerDay = getCumulativeBetweenDates(incomesPerDay, initialDate.getTime(), finalDate.getTime());
  $: cumulativeSpendingsPerDay = getCumulativeBetweenDates(incomesPerDay, initialDate.getTime(), finalDate.getTime());
  $: balance = getBalance(incomesPerDay, spendingsPerDay, dates);

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

  function getBalance(incomesPerDay: {value: number, date: number}[], spendingsPerDay: {value: number, date: number}[], dates: number[]) {
    let incomeIdx = 0;
    let spendingIdx = 0;

    const perDate = dates.map((date) => {
      let income = 0;
      let spending = 0;
      if(incomeIdx < incomesPerDay.length && incomesPerDay[incomeIdx].date == date) {
        income = incomesPerDay[incomeIdx].value;
        incomeIdx++;
      }
      if(spendingIdx < spendingsPerDay.length && spendingsPerDay[spendingIdx].date == date) {
        spending = spendingsPerDay[spendingIdx].value;
        spendingIdx++;
      }
      return {
        value: income - spending,
        date
      }
    })

    console.log("perdate", perDate)

    const cumulativePerDate: {value: number, date: number}[] = [];

    perDate.forEach((val, i) => {
      cumulativePerDate.push({
        value: i == 0 ? val.value : val.value + cumulativePerDate[cumulativePerDate.length-1].value,
        date: val.date
      })
    })

    return perDate;
  }

  function getGraphData(chartType: string) {
    if(chartType == "incomesPerDay") {
      return incomesPerDay.filter((inc) => inc.date >= initialDate.getTime() && inc.date <= finalDate.getTime()).map((el) => ({...el, group: "Ingreso Diario"}));
    }

    if(chartType == "spendingsPerDay") {
      return spendingsPerDay.filter((spe) => spe.date >= initialDate.getTime() && spe.date <= finalDate.getTime()).map((el) => ({...el, group: "Gasto Diario"}));
    }

    if(chartType == "cumulativeIncomesPerDay") {
      return cumulativeIncomesPerDay.map((el) => ({...el, group: "Ingreso Diario Acumulado"}));
    }

    if(chartType == "cumulativeSpendingsPerDay") {
      return cumulativeSpendingsPerDay.map((el) => ({...el, group: "Gasto Diario Acumulado"}));
    }

    if(chartType == "balance") {
      return balance.map((el) => ({...el, group: "Balance"}));
    }
  }
</script>

<h1 class="text-2xl text-gray-700 font-bold mb-2">Resumen de Gastos</h1>

{#if loaded}
  {#if incomes.length || spendings.length}
    <h2 class="text-base text-gray-700 font-bold mb-2">Tipo de gráfico</h2>
    <select class="rounded px-2 py-1 mb-4" bind:value={chartType}>
      <option value="balance">Balance</option>
      {#if incomes.length}<option value="incomesPerDay">Ingresos por Día</option>{/if}
      {#if spendings.length}<option value="spendingsPerDay">Gastos por Día</option>{/if}
      {#if incomes.length}<option value="cumulativeIncomesPerDay">Ingresos acumulados por Día</option>{/if}
      {#if spendings.length}<option value="cumulativeSpendingsPerDay">Gastos acumulados por Día</option>{/if}
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
      {#if chartType == "incomesPerDay" || chartType == "spendingsPerDay"}
        <svelte:component
          style="padding: 10px 10px 10px 10px"
          this={barChart}
          data={getGraphData(chartType)}
          options={fullOptions} 
        />
      {/if}
      {#if chartType == "cumulativeIncomesPerDay" || chartType == "cumulativeSpendingsPerDay" || chartType == "balance"}
        <svelte:component
          style="padding: 10px 10px 10px 10px"
          this={lineChart}
          data={getGraphData(chartType)}
          options={fullOptions} 
        />
      {/if}
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