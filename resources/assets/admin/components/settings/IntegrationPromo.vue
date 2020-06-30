<template>
    <div>
        <el-row class="setting_header">
            <el-col :md="24">
                <h2>Connect your form with more integrations with Pro</h2>
            </el-col>
        </el-row>

        <div class="ff-feature-lists">
            <ul>
                <li><span class="dashicons dashicons-yes"></span> Campaign Monitor</li>
                <li><span class="dashicons dashicons-yes"></span> GetResponse</li>
                <li><span class="dashicons dashicons-yes"></span> Active Campaign</li>
                <li><span class="dashicons dashicons-yes"></span> iContact</li>
                <li><span class="dashicons dashicons-yes"></span> Zapier</li>
                <li><span class="dashicons dashicons-yes"></span> WebHooks</li>
                <li><span class="dashicons dashicons-yes"></span> Conditional Email Broadcast</li>
                <li><span class="dashicons dashicons-yes"></span> Conditional Integration Broadcast</li>
                <li><span class="dashicons dashicons-plus"></span> More coming soon...</li>
            </ul>
            <img class="ff-integration"
                 src="https://wpmanageninja.com/wp-content/uploads/2018/10/ff-intragrations.png">
        </div>
        <div class="promo_section">
            <p class="ff-add-on-description">Unlock all type of premium input fields by using this add on</p>
            <a target="_blank" href="https://wpmanageninja.com/downloads/fluentform-pro-add-on/?utm_source=fluentform&utm_medium=wp&utm_campaign=wp_plugin&utm_term=upgrade&utm_content=add_on" class="button button-primary">Purchase Pro Add-On Now</a>
        </div>
    </div>
</template>

<script type="text/babel">
    export default {
        name: 'integration_promo'
    }
</script>

<style>
    .promo_section {
        text-align: center;
        padding: 20px;
        border-top: 1px solid #bdbdbd;
        margin-top: 30px;
    }

    .promo_section p {
        font-size: 20px;
    }

    .promo_section a {
        font-size: 20px !important;
        height: 40px !important;
        padding: 6px 20px !important;
    }
    .ff-feature-lists ul li {
        font-size: 18px;
        line-height: 27px;
    }

    .ff-feature-lists ul li span {
        font-size: 20px;
        margin-top: 4px;
    }
</style>