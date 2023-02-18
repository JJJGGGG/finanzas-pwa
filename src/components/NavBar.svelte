<script>
	import { page } from "$app/stores";
</script>
<nav>
    <ul class="flex border-b">
        <li class="mr-1">
        <a 
            class="bg-white rounded-t inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold" 
            href="/"
            class:border-l={$page.url.pathname == "/"}
            class:border-t={$page.url.pathname == "/"}
            class:border-r={$page.url.pathname == "/"}
            class:text-blue-700={$page.url.pathname == "/"}
        >
            Balance
        </a>
        
        </li>
        <li class="mr-1">
        <a 
            class="bg-white rounded-t inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold" 
            href="/incomes"
            class:border-l={$page.url.pathname.startsWith("/incomes")}
            class:border-t={$page.url.pathname.startsWith("/incomes")}
            class:border-r={$page.url.pathname.startsWith("/incomes")}
            class:text-blue-700={$page.url.pathname.startsWith("/incomes")}
        >
            Ingresos
        </a>
        </li>
        <li class="mr-1">
        <a 
            class="bg-white rounded-t inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold"
            href="/spendings"
            class:border-l={$page.url.pathname.startsWith("/spendings")}
            class:border-t={$page.url.pathname.startsWith("/spendings")}
            class:border-r={$page.url.pathname.startsWith("/spendings")}
            class:text-blue-700={$page.url.pathname.startsWith("/spendings")}
        >
            Gastos
        </a>
        </li>
    </ul>
</nav>