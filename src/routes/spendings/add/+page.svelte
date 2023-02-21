<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
    import { addSpendingToDatabase, createDbConnection, getSpendingsFromDatabase } from "../../../helpers/db";
    // @ts-ignore
    import Svelecte from "svelecte"
    let spendingName = "";
    let spendingCategory = "";
    let value: number | null;

    let db: IDBDatabase | null;

    let currentSpendingCategories: {id: string, name: string}[] = []

    onMount(async () => {
        db = await createDbConnection();
        const spendings = await getSpendingsFromDatabase(db);
        const spendingCategories: string[] = []
        spendings.forEach((spending) => {
            const category = spending.category;
            if(!spendingCategories.includes(category)) {
                spendingCategories.push(category);
            }
        })
        currentSpendingCategories = spendingCategories.map((cat) => ({id: cat, name: cat}));
    })

    async function addSpending() {

        if(db) {
            await addSpendingToDatabase(db, "nombre1", 21000, Date.now(), "cat1");
            await addSpendingToDatabase(db, "nombre2", 13500, Date.now(), "cat1");
            await addSpendingToDatabase(db, "nombre3", 3500, Date.now(), "cat2");
            await addSpendingToDatabase(db, "nombre4", 3300, Date.now(), "cat1");
            await addSpendingToDatabase(db, "nombre5", 3530, Date.now(), "cat2");
            await addSpendingToDatabase(db, "nombre6", 13000, Date.now() + 86400000, "cat2");
            await addSpendingToDatabase(db, "nombre7", 14000, Date.now() + 86400000, "cat1");
        }
        return goto("/spendings")
        if(spendingName && value !== null && db) {
            const date = Date.now();
            await addSpendingToDatabase(db, spendingName, value, date, spendingCategory);
            goto("/spendings");
        }
    }

    const i18nOptions = {
        empty: "No hay opciones. Por favor cree una nueva.",
        createRowLabel: (val: string) => `Presione para crear categoría '${val}'`
    }
</script>

<h1 class="text-2xl text-gray-700 font-bold mb-2">Agregar Gasto</h1>

<div>
    <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="nombre">
            En qué gastaste?
        </label>
        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" bind:value={spendingName} id="nombre" type="text" >
    </div>

    <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="categoria">
            Categoría del Gasto
        </label>
        <Svelecte placeholder="Selecciona o crea una categoría" i18n={i18nOptions} clearable creatable creatablePrefix="" options={currentSpendingCategories} bind:value={spendingCategory} id="categoria"/>
    </div>

    <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="nombre">
            Monto
        </label>
        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" bind:value={value} id="valor" type="number" >
    </div>
    <button class="bg-blue-500 hover:bg-blue-600 rounded px-4 py-2 text-white" on:click={addSpending}>Agregar gasto</button>
    <a href="/spendings" class="inline-block ml-2">Volver</a>
</div>