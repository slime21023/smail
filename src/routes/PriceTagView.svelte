<script lang="ts">
	interface PriceTagProps {
		amount: number;
		currency: string;
		accent: string;
	}

	let { props }: { props: PriceTagProps } = $props();
</script>

<div class="price-tag">
	<span class="price-currency">{props.currency}</span>
	<span class="price-amount" style:color={props.accent}>{props.amount.toLocaleString()}</span>
</div>

<style>
	.price-tag {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 6px;
		padding: 12px;
	}

	.price-currency {
		font-size: 13px;
		color: #64748b;
	}

	.price-amount {
		font-size: 28px;
		font-weight: 700;
		color: #dc2626;
	}
</style>
