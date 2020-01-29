<script>
    export let title = "Tool";
</script>

<style>
    .tool {
        background-color:#212121;
        border-top: 1px;
        border-left: 0px;
        border-right: 0px;
        border-bottom:  0px;
        border-style: solid;
        border-color: #444444;
       
    }

    .title {
        background-color: #2c2c2c;
     
    }

</style>

<div class="tool">
    <div class="title">{title}</div>
    <slot></slot>
</div>