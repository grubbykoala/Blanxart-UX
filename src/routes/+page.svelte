<script>
	import Viaje from '$lib/viaje/Viaje.svelte';
	import brasil from '$lib/datos/brasil.js';
</script>

<svelte:head>
	<title>Blanxart Origins · Brasil 76 %</title>
	<meta name="description" content="El viaje de tu tableta: de la Selva Tropical Atlántica de Brasil al obrador de Blanxart en Barcelona." />
</svelte:head>

<Viaje origen={brasil} />
