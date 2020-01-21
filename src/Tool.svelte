<script>
    export let title = "Tool";
</script>

<style>
    .tool {
        background-color:#212121;
    }

    .title {
        background-color: #2c2c2c;
    }

</style>

<div class="tool">
    <div class="title">{title}</div>
    <slot></slot>
</div>