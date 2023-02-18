<script>
    import "../app.css";
	import NavBar from "../components/NavBar.svelte";
</script>

<div class="flex w-full justify-center items-center md:mt-4">
    <div class="w-full md:w-2/3">  
        <NavBar />
        <div class="w-full bg-white md:rounded md:border border-gray-200 px-4 py-2">
            <slot />
        </div>
    </div>
</div>

<style>
</style>