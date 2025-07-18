<template>
  <div class="element-properties">
    <div class="property-section">
      <h5>{{ $t('Element') }}: {{ element.type }}</h5>
    </div>

    <!-- Text Element Properties -->
    <div v-if="element.type === 'text'" class="property-section">
      <el-form label-position="top" size="small">
        <el-form-item :label="$t('Content')">
          <el-input
            type="textarea"
            :rows="3"
            v-model="localProps.content"
            @input="updateProperty('content', $event)"
            :placeholder="$t('Enter text content...')"
          />
          <small class="help-text">{{ $t('Use {field_name} for dynamic content') }}</small>
        </el-form-item>
        
        <el-form-item :label="$t('Font Size')">
          <el-input-number
            v-model="localProps.fontSize"
            @change="updateProperty('fontSize', $event)"
            :min="8"
            :max="72"
          />
        </el-form-item>
        
        <el-form-item :label="$t('Font Weight')">
          <el-select v-model="localProps.fontWeight" @change="updateProperty('fontWeight', $event)">
            <el-option label="Normal" value="normal"></el-option>
            <el-option label="Bold" value="bold"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item :label="$t('Text Align')">
          <el-select v-model="localProps.textAlign" @change="updateProperty('textAlign', $event)">
            <el-option label="Left" value="left"></el-option>
            <el-option label="Center" value="center"></el-option>
            <el-option label="Right" value="right"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item :label="$t('Color')">
          <el-color-picker
            v-model="localProps.color"
            @change="updateProperty('color', $event)"
          />
        </el-form-item>
      </el-form>
    </div>

    <!-- Field Element Properties -->
    <div v-else-if="element.type === 'field'" class="property-section">
      <el-form label-position="top" size="small">
        <el-form-item :label="$t('Form Field')">
          <el-select 
            v-model="localProps.fieldKey" 
            @change="updateProperty('fieldKey', $event)"
            :placeholder="$t('Select a field')"
          >
            <el-option
              v-for="field in formFields"
              :key="field.name"
              :label="field.label"
              :value="field.name"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-checkbox 
            v-model="localProps.showLabel"
            @change="updateProperty('showLabel', $event)"
          >
            {{ $t('Show Label') }}
          </el-checkbox>
        </el-form-item>
        
        <el-form-item v-if="localProps.showLabel" :label="$t('Label Position')">
          <el-select v-model="localProps.labelPosition" @change="updateProperty('labelPosition', $event)">
            <el-option label="Top" value="top"></el-option>
            <el-option label="Left" value="left"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <!-- Image Element Properties -->
    <div v-else-if="element.type === 'image'" class="property-section">
      <el-form label-position="top" size="small">
        <el-form-item :label="$t('Image URL')">
          <el-input
            v-model="localProps.src"
            @input="updateProperty('src', $event)"
            :placeholder="$t('Enter image URL')"
          />
        </el-form-item>
        
        <el-form-item :label="$t('Alt Text')">
          <el-input
            v-model="localProps.alt"
            @input="updateProperty('alt', $event)"
          />
        </el-form-item>
        
        <el-form-item :label="$t('Width')">
          <el-input
            v-model="localProps.width"
            @input="updateProperty('width', $event)"
            :placeholder="$t('e.g., 100px, 50%')"
          />
        </el-form-item>
        
        <el-form-item :label="$t('Height')">
          <el-input
            v-model="localProps.height"
            @input="updateProperty('height', $event)"
            :placeholder="$t('e.g., auto, 200px')"
          />
        </el-form-item>
      </el-form>
    </div>

    <!-- Table Element Properties -->
    <div v-else-if="element.type === 'table'" class="property-section">
      <el-form label-position="top" size="small">
        <el-form-item>
          <el-checkbox 
            v-model="localProps.showHeaders"
            @change="updateProperty('showHeaders', $event)"
          >
            {{ $t('Show Headers') }}
          </el-checkbox>
        </el-form-item>
        
        <el-form-item :label="$t('Columns')">
          <div class="table-columns">
            <div 
              v-for="(column, index) in localProps.columns" 
              :key="index"
              class="column-item"
            >
              <el-select 
                v-model="column.key"
                @change="updateTableColumns"
                size="mini"
                :placeholder="$t('Field')"
              >
                <el-option
                  v-for="field in formFields"
                  :key="field.name"
                  :label="field.label"
                  :value="field.name"
                />
              </el-select>
              <el-input
                v-model="column.label"
                @input="updateTableColumns"
                size="mini"
                :placeholder="$t('Label')"
              />
              <el-button 
                @click="removeColumn(index)"
                size="mini"
                type="danger"
                icon="el-icon-delete"
              />
            </div>
            <el-button @click="addColumn" size="small" type="primary">
              {{ $t('Add Column') }}
            </el-button>
          </div>
        </el-form-item>
        
        <el-form-item :label="$t('Border Width')">
          <el-input-number
            v-model="localProps.borderWidth"
            @change="updateProperty('borderWidth', $event)"
            :min="0"
            :max="10"
          />
        </el-form-item>
      </el-form>
    </div>

    <!-- Line Element Properties -->
    <div v-else-if="element.type === 'line'" class="property-section">
      <el-form label-position="top" size="small">
        <el-form-item :label="$t('Thickness')">
          <el-input-number
            v-model="localProps.thickness"
            @change="updateProperty('thickness', $event)"
            :min="1"
            :max="10"
          />
        </el-form-item>
        
        <el-form-item :label="$t('Style')">
          <el-select v-model="localProps.style" @change="updateProperty('style', $event)">
            <el-option label="Solid" value="solid"></el-option>
            <el-option label="Dashed" value="dashed"></el-option>
            <el-option label="Dotted" value="dotted"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item :label="$t('Color')">
          <el-color-picker
            v-model="localProps.color"
            @change="updateProperty('color', $event)"
          />
        </el-form-item>
      </el-form>
    </div>

    <!-- Signature Element Properties -->
    <div v-else-if="element.type === 'signature'" class="property-section">
      <el-form label-position="top" size="small">
        <el-form-item :label="$t('Signature Field')">
          <el-select 
            v-model="localProps.fieldKey" 
            @change="updateProperty('fieldKey', $event)"
            :placeholder="$t('Select signature field')"
          >
            <el-option
              v-for="field in signatureFields"
              :key="field.name"
              :label="field.label"
              :value="field.name"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item :label="$t('Width')">
          <el-input-number
            v-model="localProps.width"
            @change="updateProperty('width', $event)"
            :min="100"
            :max="500"
          />
        </el-form-item>
        
        <el-form-item :label="$t('Height')">
          <el-input-number
            v-model="localProps.height"
            @change="updateProperty('height', $event)"
            :min="50"
            :max="300"
          />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ElementProperties',
  props: {
    element: {
      type: Object,
      required: true
    },
    formFields: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      localProps: {}
    };
  },
  computed: {
    signatureFields() {
      return this.formFields.filter(field => 
        field.element === 'signature' || 
        field.element === 'signature_pad'
      );
    }
  },
  methods: {
    updateProperty(key, value) {
      this.localProps[key] = value;
      this.$emit('update', { [key]: value });
    },
    
    addColumn() {
      if (!this.localProps.columns) {
        this.localProps.columns = [];
      }
      this.localProps.columns.push({ key: '', label: '' });
      this.updateTableColumns();
    },
    
    removeColumn(index) {
      this.localProps.columns.splice(index, 1);
      this.updateTableColumns();
    },
    
    updateTableColumns() {
      this.$emit('update', { columns: [...this.localProps.columns] });
    }
  },
  watch: {
    element: {
      handler(newElement) {
        this.localProps = { ...newElement.props };
      },
      immediate: true,
      deep: true
    }
  }
};
</script>

<style scoped>
.element-properties {
  height: 100%;
}

.property-section {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.property-section:last-child {
  border-bottom: none;
}

.help-text {
  color: #999;
  font-size: 11px;
  margin-top: 4px;
  display: block;
}

.table-columns {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
}

.column-item {
  display: flex;
  gap: 5px;
  margin-bottom: 8px;
  align-items: center;
}

.column-item:last-child {
  margin-bottom: 0;
}
</style>