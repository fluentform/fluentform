<template>
  <div>
    <el-row class="setting_header">
      <el-col :md="24">
        <h2>{{ $t('hCaptcha Settings') }}</h2>

        <p>
            {{('Fluent Forms integrates with hCaptcha, a free service that protects your website from spam and abuse.Please note, these settings are required only if you decide to use the hCaptcha field.') }}

          <a href="https://www.hcaptcha.com/" target="_blank">
              {{ $t('Read more about hCaptcha.') }}
          </a>
        </p>
        <p><b>{{ $t('Please generate API key and API secret using hCaptcha') }}</b></p>
      </el-col>
    </el-row>


    <div class="section-body">
      <el-form label-width="205px" label-position="left">
        <!--Site key-->
        <el-form-item>
          <template slot="label">
              {{ $t('Site Key') }}
            <el-tooltip class="item" placement="bottom-start" effect="light">
              <div slot="content">
                <h3>{{ $t('hCaptcha Site Key') }}</h3>
                <p>
                    {{ $t('Enter your hCaptcha Site Key, if you do not have ') }}<br />
                    {{ $t('a key you can register for one at the provided link.') }}<br />
                    {{ $t('hCaptcha is a free service.') }}
                </p>
              </div>

              <i class="el-icon-info el-text-info"></i>
            </el-tooltip>
          </template>

          <el-input v-model="hCaptcha.siteKey" @change="load"></el-input>
        </el-form-item>

        <!--Secret key-->
        <el-form-item>
          <template slot="label">
              {{ $t('Secret Key') }}
            <el-tooltip class="item" placement="bottom-start" effect="light">
              <div slot="content">
                <h3>{{ $t('hCaptcha Secret Key') }}</h3>

                <p>
                    {{ $t('Enter your hCaptcha Secret Key, if you do not have ') }}<br />
                    {{ $t('a key you can register for one at the provided link.') }} <br />
                    {{ $t('hCaptcha is a free service.') }}
                </p>
              </div>

              <i class="el-icon-info el-text-info"></i>
            </el-tooltip>
          </template>

          <el-input
            type="password"
            v-model="hCaptcha.secretKey"
            @change="load"
          ></el-input>
        </el-form-item>

        <!--Validate Keys-->
        <el-form-item :label="$t('Validate Keys')" v-if="siteKeyChanged">
          <div
            class="h-captcha"
            id="hCaptcha"
            :data-sitekey="hCaptcha.siteKey"
          ></div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="danger"
            icon="el-icon-delete"
            size="medium"
            @click="clearSettings"
            :loading="clearing"
            >{{ $t('Clear Settings') }}
          </el-button>

          <el-button
            type="success"
            icon="el-icon-success"
            size="medium"
            @click="save"
            :disabled="disabled"
            :loading="saving"
            >{{ $t('Save Settings') }}
          </el-button>
        </el-form-item>
      </el-form>

      <div v-if="hCaptcha_status">
        <p>{{ $t('Your hCaptcha is valid') }}</p>
      </div>
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
        return this.$notify.error({
          title: "Error!",
          message: 'Missing required fields.',
          offset: 30,
        });
      }
      this.saving = true;

      FluentFormsGlobal.$post({
        action: "fluentform-global-settings-store",
        key: "hCaptcha",
        hCaptcha: this.hCaptcha,
      })
        .then((response) => {
          this.hCaptcha_status = response.data.status;
          this.$notify.success({
            title: "Success!",
            message: response.data.message,
            offset: 30,
          });
        })
        .fail((error) => {
          this.hCaptcha_status = parseInt(error.responseJSON.data.status, 10);
          let title = this.hCaptcha_status === 1 ? "Warning!" : "Error!";
          let method = this.hCaptcha_status === 1 ? "warning" : "error";
          this.$notify[method]({
            title: title,
            message: error.responseJSON.data.message,
            offset: 30,
          });
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
          this.$notify.success({
            title: "Success!",
            message: response.data.message,
            offset: 30,
          });
        })
        .fail((error) => {
          this.hCaptcha_status = error.responseJSON.data.status;
          this.$notify.error({
            title: "Oops!",
            message: "Something went wrong.",
            offset: 30,
          });
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
