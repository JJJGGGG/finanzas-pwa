<script lang="ts">
	import { onMount } from "svelte";
    import type { Income } from "../../helpers/db"
    import { deleteIncomeFromDatabase, createDbConnection, getIncomesFromDatabase } from "../../helpers/db";

    let db: IDBDatabase | null;

    let incomes: Income[] = [];

    $: incomesRanges = incomes.map(sp => new Date(sp.timestamp).setHours(0, 0, 0, 0)).filter((value, index, array) => { return array.indexOf(value) === index });

    let selectedRange: number | null;

    onMount(async () => {
        db = await createDbConnection();
    })

    async function loadIncomesFromDatabase() {
        if(db) {
            incomes = await getIncomesFromDatabase(db)
        }
    }

    async function deleteIncome(id: number) {
        if(db && confirm("Estás seguro de querer borrar este ingreso?")) {
            await deleteIncomeFromDatabase(db, id);
            await loadIncomesFromDatabase();
        }
    }

    $: db && loadIncomesFromDatabase();
</script>

<h1 class="text-2xl text-gray-700 font-bold mb-2">Ingresos</h1>

<a href="/incomes/add" class="inline-block mb-2 bg-blue-500 hover:bg-blue-600 rounded px-4 py-2 text-white mt-4">Agregar ingreso</a>

<div>
    {#if incomes.length}
        <h2 class="text-base text-gray-700 font-bold mb-2">Filtrar por fecha</h2>
        <select class="rounded px-2 py-1" bind:value={selectedRange}>
            <option value={null}>Todas las fechas</option>
            {#each incomesRanges as range}
                <option value={range}>{new Date(range).toLocaleDateString()}</option>
            {/each}
        </select>
    {/if}
    <div class="mt-4 mb-4">
        {#each incomes.reverse() as income}
            <div class="border-gray-200 border rounded mb-4 px-4 py-2 flex h-24">
                <div class="w-full flex flex-col justify-between">
                    <div class="font-bold">{income.name}</div>
                    <div>${income.value}</div>
                </div>
                <div class=" flex flex-col w-full justify-between items-end">
                    <div>
                        <button class="bg-red-500 text-white rounded px-2 py-1 hover:bg-red-6s00" on:click={() => deleteIncome(income.id)}>Borrar</button>
                    </div>
                    <div>{new Date(income.timestamp).toLocaleString()}</div>
                </div>
            </div>
        {:else}
            <div>No hay ingresos. Para agregar uno, presione el botón "Agregar ingreso"</div>
        {/each}
    </div> 
</div>