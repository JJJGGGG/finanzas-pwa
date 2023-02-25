<script lang="ts">
  import "@carbon/styles/css/styles.css";
  import "@carbon/charts/styles.css";
  import type { ScaleTypes, TickRotations, LineChartOptions } from "@carbon/charts/interfaces"
	import { addIncomeToDatabase, addSpendingToDatabase, createDbConnection, getIncomesFromDatabase, getSpendingsFromDatabase, type Income, type Spending } from "../helpers/db";
	import { onMount } from "svelte";
  import { DateInput } from "date-picker-svelte"

  type CashFlow = {value: number, date:number, category: string}
  

  let db: IDBDatabase | null;
  let incomes: Income[] = [];
  let spendings: Spending[] = [];
  let incomesPerDay: CashFlow[] = [];
  let spendingsPerDay: CashFlow[] = [];
  let cumulativeIncomesPerDay: CashFlow[] = [];
  let cumulativeSpendingsPerDay: CashFlow[] = [];
  let balance: { value: number, date: number }[] = [];

  let chartType = "balance";

  let lineChart: typeof import("@carbon/charts-svelte").StackedAreaChart;
  let barChart: typeof import("@carbon/charts-svelte").BarChartStacked;

  let initialDate: Date = new Date(0);
  let finalDate: Date = new Date(8640000000000000);
  let minDate: Date = new Date(0);
  let maxDate: Date = new Date(8640000000000000);

  let loaded = false;
  let dates: number[] = [];
  let categories: string[] = [];

  let fileInput: HTMLInputElement;

  onMount(async () => {
      db = await createDbConnection();
      const charts = await import("@carbon/charts-svelte");
      lineChart = charts.StackedAreaChart;
      barChart = charts.BarChartStacked;
      await loadFromDatabase();
  });

  function getDates(incomes: CashFlow[], spendings: CashFlow[]) {
    // TODO: 
    const datesSet = new Set([
        ...incomes.map((d) => d.date),
        ...spendings.map((d) => d.date),
      ]);

      const dates = Array.from(datesSet).sort(); // esto se puede hacer más rápido

      return dates;
  }

  function getCategories(incomes: CashFlow[], spendings: CashFlow[]) {
    // TODO: 
    const categoriesSet = new Set([
        ...incomes.map((d) => d.category),
        ...spendings.map((d) => d.category),
      ]);

      const dates = Array.from(categoriesSet).sort(); // esto se puede hacer más rápido

      return dates;
  }

  function joinPerDay(arr: Income[] | Spending[]) {
    const arrPerDay: CashFlow[] = [];
    // TODO: hacerlo por categorías

    arr = arr.map(el => ({...el, timestamp: new Date(el.timestamp).setHours(0,0,0,0)})).sort((a, b) => a.timestamp - b.timestamp || a.category.localeCompare(b.category));

    let lastDate: undefined | number = undefined;
    let lastCategory: undefined | string = undefined;
    arr.forEach((el) => {
      const currentDate = el.timestamp;
      if(lastDate == undefined || lastDate != currentDate || lastCategory == undefined || lastCategory != el.category) {
        arrPerDay.push({value: el.value, date: currentDate, category: el.category})
      } else {
        arrPerDay[arrPerDay.length - 1].value += el.value;
      }
      lastDate = currentDate;
      lastCategory = el.category;
    });

    return arrPerDay
  }

  function getCumulativeBetweenDates(arr: CashFlow[], initialDate: number, finalDate: number) {
    const result: CashFlow[] = [];

    const bought: Record<string, number> = {};

    arr = arr.filter((val) => val.date >= initialDate && val.date <= finalDate);

    arr = arr.sort((a, b) => a.date - b.date || a.category.localeCompare(b.category))
    
    // TODO: añadir las categorias que no se compraron (para tener el acumulado). puede ser verlo por día
    // o de otra forma
    
    const days: number[] = [];
    arr.forEach((el) => {if(!days.length || days[days.length - 1] != el.date) {days.push(el.date)}});

    let currentIndex = 0;
    let currentDay: Record<string, number> = {};
    days.forEach(day => {
      while(currentIndex < arr.length && arr[currentIndex].date == day) {
        currentDay[arr[currentIndex].category] = (currentDay[arr[currentIndex].category] || 0) + arr[currentIndex].value;
        currentIndex += 1;
      }
      Object.keys(currentDay).forEach(key => {
        result.push({ value: currentDay[key], date: day, category: key })
      })
    })
  
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
      categories = getCategories(incomesPerDay, spendingsPerDay);
      setTimeout(() => loaded = true, 200);
    }
  }


  $: cumulativeIncomesPerDay = getCumulativeBetweenDates(incomesPerDay, initialDate.getTime(), finalDate.getTime());
  $: cumulativeSpendingsPerDay = getCumulativeBetweenDates(spendingsPerDay, initialDate.getTime(), finalDate.getTime());
  $: balance = getBalance(incomesPerDay, spendingsPerDay, dates);

  function getGraphColors(graphType: string) {
    if(graphType == "spendingsPerDay" || graphType == "cumulativeSpendingsPerDay") {
      return {"ZZZZZZZZ": "#AB1C37", "aaaaaaaa": "#BA3405"}
    }
    if(graphType == "incomesPerDay" || graphType == "cumulativeIncomesPerDay") {
      return {"ZZZZZZZZ": "#1E90FF", "aaaaaaaa": "#00308F"}
    }
    return {"Balance": "#9400D3"}
  }

  function getOptions(graphType: string): LineChartOptions {
    const options: LineChartOptions = {
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
    }
    return options;
  }

  function getBalance(incomesPerDay: {value: number, date: number}[], spendingsPerDay: {value: number, date: number}[], dates: number[]) {
    let incomeIdx = 0;
    let spendingIdx = 0;

    const perDate = dates.map((date) => {
      let income = 0;
      let spending = 0;
      while(incomeIdx < incomesPerDay.length && incomesPerDay[incomeIdx].date == date) {
        income += incomesPerDay[incomeIdx].value;
        incomeIdx++;
      }
      while(spendingIdx < spendingsPerDay.length && spendingsPerDay[spendingIdx].date == date) {
        spending += spendingsPerDay[spendingIdx].value;
        spendingIdx++;
      }
      return {
        value: income - spending,
        date
      }
    })

    const cumulativePerDate: {value: number, date: number}[] = [];

    perDate.forEach((val, i) => {
      cumulativePerDate.push({
        value: i == 0 ? val.value : val.value + cumulativePerDate[cumulativePerDate.length-1].value,
        date: val.date
      })
    })

    return cumulativePerDate;
  }

  function getGraphData(chartType: string, initialDate: Date, finalDate: Date) {
    if(chartType == "incomesPerDay") {
      return incomesPerDay.filter((inc) => inc.date >= initialDate.getTime() && inc.date <= finalDate.getTime()).map((el) => ({...el, group: el.category}));
    }

    if(chartType == "spendingsPerDay") {
      return spendingsPerDay.filter((spe) => spe.date >= initialDate.getTime() && spe.date <= finalDate.getTime()).map((el) => ({...el, group: el.category}));
    }

    if(chartType == "cumulativeIncomesPerDay") {
      return cumulativeIncomesPerDay.map((el) => ({...el, group: el.category}));
    }

    if(chartType == "cumulativeSpendingsPerDay") {
      return cumulativeSpendingsPerDay.map((el) => ({...el, group: el.category}));
    }

    if(chartType == "balance") {
      return balance.filter((spe) => spe.date >= initialDate.getTime() && spe.date <= finalDate.getTime()).map((el) => ({...el, group: "Balance"}));
    }
  }
  function download(filename: string, text: string) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  async function exportJson() {
    loadFromDatabase();
    const text = JSON.stringify({
      incomes,
      spendings
    })
    download("export.json", text)
  }

  async function importJson(e: Event) {
    let image = (e?.target as unknown as { files: File[] }).files[0];
    let reader = new FileReader();
    reader.readAsText(image);
    reader.onload = async (e) => {
      const text = e?.target?.result as string;
      const json: { spendings: Spending[], incomes: Income[] } = JSON.parse(text);
      for(let i=0; i<json.spendings.length; i++) {
        const spending = json.spendings[i];
        if(db) {
          await addSpendingToDatabase(db, spending.name, spending.value, spending.timestamp, spending.category);
        }
      }
      for(let i=0; i<json.incomes.length; i++) {
        const income = json.incomes[i];
        if(db) {
          await addIncomeToDatabase(db, income.name, income.value, income.timestamp, income.category);
        }
      }
    };
  }
</script>

<h1 class="text-2xl text-gray-700 font-bold mb-2">Resumen de Gastos</h1>

<button class="bg-blue-500 hover:bg-blue-600 cursor-pointer px-4 py-2 mb-2 text-white rounded text-sm mr-4" on:click={exportJson}>Exportar JSON</button>
<button class="bg-blue-500 hover:bg-blue-600 cursor-pointer px-4 py-2 mb-2 text-white rounded text-sm" on:click={()=>{fileInput.click();}}>Importar JSON</button>
<input style="display:none" type="file" accept=".json" on:change={(e)=>importJson(e)} bind:this={fileInput} >
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
          data={getGraphData(chartType, initialDate, finalDate)}
          options={getOptions(chartType)} 
        />
      {/if}
      {#if chartType == "cumulativeIncomesPerDay" || chartType == "cumulativeSpendingsPerDay" || chartType == "balance"}
        <svelte:component
          style="padding: 10px 10px 10px 10px"
          this={lineChart}
          data={getGraphData(chartType, initialDate, finalDate)}
          options={getOptions(chartType)} 
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