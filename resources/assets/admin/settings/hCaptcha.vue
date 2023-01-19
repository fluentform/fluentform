<template>
  <div class="ff_hcaptcha_wrap">
    <el-form>
      <div class="ff_card">
        <div class="ff_card_head">
          <h5 class="title">{{ $t('hCaptcha Settings') }}</h5>
          <p class="text">
              {{$t('Fluent Forms integrates with hCaptcha, a free service that protects your website from spam and abuse.Please note, these settings are required only if you decide to use the hCaptcha field.')}} 
              <a href="https://www.hcaptcha.com/" target="_blank">
                  {{ $t('Read more about hCaptcha.') }}
              </a>
          </p>
          <p class="text"><b>{{ $t('Please generate API key and API secret using hCaptcha') }}</b></p>
        </div><!-- .ff_card_head -->
        <div class="ff_card_body">
          <div class="ff_block_item">
              <div class="ff_block_title_group mb-3">
                  <h6 class="ff_block_title">{{ $t('Site Key') }}</h6>
                  <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                      <div slot="content">
                          <p>{{ $t('Enter your hCaptcha Site Key, if you do not have a key you can register for one at the provided link. hCaptcha is a free service.') }}</p>
                      </div>
                      <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                  </el-tooltip>
              </div><!-- .ff_block_title_group -->
              <div class="ff_block_item_body">
                  <el-input v-model="hCaptcha.siteKey" @change="load"></el-input>
              </div><!-- .ff_block_item_body -->
          </div><!-- .ff_block_item -->
          
          <div class="ff_block_item">
              <div class="ff_block_title_group mb-3">
                  <h6 class="ff_block_title">{{ $t('Secret Key') }}</h6>
                  <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                      <div slot="content">
                          <p>{{ $t('Enter your hCaptcha Secret Key, if you do not have a key you can register for one at the provided link. hCaptcha is a free service.') }}</p>
                      </div>
                      <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                  </el-tooltip>
              </div><!-- .ff_block_title_group -->
              <div class="ff_block_item_body">
                <el-input type="password" v-model="hCaptcha.secretKey" @change="load"></el-input>
              </div><!-- .ff_block_item_body -->
          </div><!-- .ff_block_item -->
          
          <div class="ff_block_item" v-if="siteKeyChanged">
              <div class="ff_block_title_group mb-3">
                  <h6 class="ff_block_title">{{ $t('Validate Keys') }}</h6>
              </div><!-- .ff_block_title_group -->
              <div class="ff_block_item_body">
                <div class="h-captcha" id="hCaptcha" :data-sitekey="hCaptcha.siteKey"></div>
              </div><!-- .ff_block_item_body -->
          </div><!-- .ff_block_item -->

        </div><!-- .ff_card_body -->
      </div><!--.ff_card -->

        <div class="mt-4">
          <el-button type="danger" icon="el-icon-delete" @click="clearSettings" :loading="clearing">
            {{ $t('Clear Settings') }}
          </el-button>
          <el-button type="primary" icon="el-icon-success" @click="save" :disabled="disabled" :loading="saving">
            {{ $t('Save Settings') }}
          </el-button>
        </div>
      </el-form>

      <div v-if="hCaptcha_status">
        <p>{{ $t('Your hCaptcha is valid') }}</p>
      </div>
  </div>
</template>

<script>
export default {
  name: "hCaptcha",
  props: ["app"],
  data() {
    return {
      hCaptcha: {
        siteKey: "",
        secretKey: "",
      },
      hCaptcha_status: false,
      siteKeyChanged: false,
      disabled: false,
      saving: false,
      clearing: false,
    };
  },
  methods: {
    load() {
      if (!this.validate()) {
        this.disabled = false;
        this.siteKeyChanged = false;
        return;
      } else {
        this.disabled = true;
        this.siteKeyChanged = true;
      }

      this.$nextTick(() => {
        let id = "hCaptcha";
        let $hCaptcha = jQuery("#" + id);
        let siteKey = this.hCaptcha.siteKey;
        const self = this;
        $hCaptcha.html("");
        const widgetId = hcaptcha.render(id, {
          sitekey: siteKey,
        });
        hcaptcha
          .execute(widgetId, { async: true })
          .then(function ({ response, key }) {
            self.hCaptcha.token = response;
            self.disabled = false;
          })
          .catch(function (err) {
            console.log(err);
          });
      });
    },
    save() {
      if (!this.validate()) {
        return this.$fail(this.$t('Missing required fields.'));
      }
      this.saving = true;

      FluentFormsGlobal.$post({
        action: "fluentform-global-settings-store",
        key: "hCaptcha",
        hCaptcha: this.hCaptcha,
      })
        .then((response) => {
          this.hCaptcha_status = response.data.status;
          this.$success(response.data.message);
        })
        .fail((error) => {
          this.hCaptcha_status = parseInt(error.responseJSON.data.status, 10);
          let method = this.hCaptcha_status === 1 ? "$warning" : "$error";
          this[method](error.responseJSON.data.message);
        })
        .always((r) => {
          this.saving = false;
        });
    },
    clearSettings() {
      this.clearing = true;
      FluentFormsGlobal.$post({
        action: "fluentform-global-settings-store",
        key: "hCaptcha",
        hCaptcha: "clear-settings",
      })
        .then((response) => {
          this.hCaptcha_status = response.data.status;
          this.hCaptcha = { siteKey: "", secretKey: "" };
          this.$success(response.data.message);
        })
        .fail((error) => {
          this.hCaptcha_status = error.responseJSON.data.status;
          this.$fail(this.$t("Something went wrong."));
        })
        .always((r) => {
          this.clearing = false;
        });
    },
    validate() {
      return !!(this.hCaptcha.siteKey && this.hCaptcha.secretKey);
    },
    getHCaptchaSettings() {
      FluentFormsGlobal.$get({
        action: "fluentform-global-settings",
        key: [
          "_fluentform_hCaptcha_details",
          "_fluentform_hCaptcha_keys_status",
        ],
      }).then((response) => {
        const hcaptcha = response.data._fluentform_hCaptcha_details || {
          siteKey: "",
          secretKey: "",
        };
        this.hCaptcha = hcaptcha;
        this.hCaptcha_status = response.data._fluentform_hCaptcha_keys_status;
      });
    },
  },
  mounted() {
    this.getHCaptchaSettings();
  },
  created() {
    let hCaptchaScript = document.createElement("script");

    hCaptchaScript.setAttribute("src", "https://js.hcaptcha.com/1/api.js");

    document.body.appendChild(hCaptchaScript);
  },
};
</script>
