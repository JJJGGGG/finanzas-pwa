<script lang="ts">
	import { onMount } from "svelte";
    import type { Spending } from "../../helpers/db"
    import { deleteSpendingFromDatabase, createDbConnection, getSpendingsFromDatabase } from "../../helpers/db";

    let db: IDBDatabase | null;

    let spendings: Spending[] = [];

    $: spendingRanges = spendings.map(sp => new Date(sp.timestamp).setHours(0, 0, 0, 0)).filter((value, index, array) => { return array.indexOf(value) === index });

    let selectedRange: number | null;

    onMount(async () => {
        db = await createDbConnection();
    })

    async function loadSpendingsFromDatabase() {
        if(db) {
            spendings = await getSpendingsFromDatabase(db)
        }
    }

    async function deleteSpending(id: number) {
        if(db && confirm("Estás seguro de querer borrar este gasto?")) {
            await deleteSpendingFromDatabase(db, id);
            await loadSpendingsFromDatabase();
        }
    }

    $: db && loadSpendingsFromDatabase();
</script>

<div class="text-2xl text-gray-700 font-bold mb-2">Gastos</div>

<a href="/spendings/add" class="inline-block mb-2 bg-blue-500 hover:bg-blue-600 rounded px-4 py-2 text-white mt-4">Agregar gasto</a>


<div>
    {#if spendings.length}
        <h2 class="text-base text-gray-700 font-bold mb-2">Filtrar por fecha</h2>
        <select class="rounded px-2 py-1" bind:value={selectedRange}>
            <option value={null}>Todas las fechas</option>
            {#each spendingRanges as range}
                <option value={range}>{new Date(range).toLocaleDateString()}</option>
            {/each}
        </select>
    {/if}
    <div class="mt-4 mb-4">
        {#each spendings.filter(sp => !selectedRange || (new Date(sp.timestamp).getTime() >= (selectedRange) && new Date(sp.timestamp).getTime() <= new Date(selectedRange).setHours(23, 59, 59, 999))).reverse() as spending}
            <div class="border-gray-200 border rounded mb-4 px-4 py-2 flex h-24">
                <div class="w-full flex flex-col justify-between">
                    <div class="font-bold">{spending.name} <small class="text-sm bg-gray-100 text-gray-500 px-1 py-1 rounded">{spending.category}</small></div>
                    <div>${spending.value}</div>
                </div>
                <div class=" flex flex-col w-full justify-between items-end">
                    <div>
                        <button class="bg-red-500 text-white rounded px-2 py-1 hover:bg-red-6s00" on:click={() => deleteSpending(spending.id)}>Borrar</button>
                    </div>
                    <div>{new Date(spending.timestamp).toLocaleString()}</div>
                </div>
            </div>
        {:else}
            <div>No hay gastos. Para agregar uno, presione el botón "Agregar gasto"</div>
        {/each}
    </div> 
</div>