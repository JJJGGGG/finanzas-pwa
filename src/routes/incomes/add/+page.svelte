<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
    import { addIncomeToDatabase, createDbConnection } from "../../../helpers/db";
    let spendingName = "";
    let value: number | null;

    let db: IDBDatabase | null;

    onMount(async () => {
        db = await createDbConnection();
    })

    async function addIncome() {
        if(spendingName && value !== null && db) {
            await addIncomeToDatabase(db, spendingName, value);
            goto("/incomes")
        }
    }
</script>

<h1 class="text-2xl text-gray-700 font-bold mb-2">Agregar Ingreso</h1>

<div>
    <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="nombre">
            Tipo de Ingreso
        </label>
        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" bind:value={spendingName} id="nombre" type="text" >
    </div>

    <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="nombre">
            Monto
        </label>
        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" bind:value={value} id="valor" type="number" >
    </div>
    <button class="bg-blue-500 hover:bg-blue-600 rounded px-4 py-2 text-white" on:click={addIncome}>Agregar ingreso</button>
    <a href="/incomes" class="inline-block ml-2">Volver</a>
</div>