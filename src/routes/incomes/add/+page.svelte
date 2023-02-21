<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
    import { addIncomeToDatabase, createDbConnection, getIncomesFromDatabase } from "../../../helpers/db";
    // @ts-ignore
    import Svelecte from "svelecte";
    let incomeName = "";
    let incomeCategory = "";
    let value: number | null;

    let db: IDBDatabase | null;

    let currentIncomeCategories: {id: string, name: string}[] = []

    onMount(async () => {
        db = await createDbConnection();
        const incomes = await getIncomesFromDatabase(db);
        const incomeCategories: string[] = []
        incomes.forEach((income) => {
            const category = income.category;
            if(!incomeCategories.includes(category)) {
                incomeCategories.push(category);
            }
        })
        currentIncomeCategories = incomeCategories.map((cat) => ({id: cat, name: cat}));
    })

    async function addIncome() {
        if(db) {
            await addIncomeToDatabase(db, "nombre1", 20000, Date.now(), "cat1");
            await addIncomeToDatabase(db, "nombre2", 12500, Date.now(), "cat1");
            await addIncomeToDatabase(db, "nombre3", 2500, Date.now(), "cat2");
            await addIncomeToDatabase(db, "nombre4", 2300, Date.now(), "cat1");
            await addIncomeToDatabase(db, "nombre5", 2530, Date.now(), "cat2");
            await addIncomeToDatabase(db, "nombre6", 12000, Date.now() + 86400000, "cat2");
            await addIncomeToDatabase(db, "nombre7", 13000, Date.now() + 86400000, "cat1");
        }
        goto("/incomes");
        // if(incomeName && incomeCategory && value !== null && db) {
        //     const date = Date.now();
        //     await addIncomeToDatabase(db, incomeName, value, date, incomeCategory);
        //     goto("/incomes")
        // }
    }

    const i18nOptions = {
        empty: "No hay opciones. Por favor cree una nueva.",
        createRowLabel: (val: string) => `Presione para crear categoría '${val}'`
    }
</script>

<h1 class="text-2xl text-gray-700 font-bold mb-2">Agregar Ingreso</h1>

<div>
    <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="nombre">
            Qué ingreso recibiste?
        </label>
        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" bind:value={incomeName} id="nombre" type="text" >
    </div>
    

    <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="categoria">
            Categoría del Ingreso
        </label>
        <Svelecte placeholder="Selecciona o crea una categoría" i18n={i18nOptions} clearable creatable creatablePrefix="" options={currentIncomeCategories} bind:value={incomeCategory} id="categoria"/>
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