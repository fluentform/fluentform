<template>
  <div class="pdf-element-properties">
    <!-- Position and Size Controls -->
    <div class="property-section">
      <h4>{{ $t('Position & Size') }}</h4>
      
      <div class="property-row">
        <div class="property-group half">
          <label>{{ $t('X Position') }}</label>
          <el-input-number
            :value="element.x"
            :min="0"
            :max="canvasWidth - element.w"
            @change="(val) => updatePosition('x', val)"
            size="small"
          />
        </div>
        
        <div class="property-group half">
          <label>{{ $t('Y Position') }}</label>
          <el-input-number
            :value="element.y"
            :min="0"
            :max="canvasHeight - element.h"
            @change="(val) => updatePosition('y', val)"
            size="small"
          />
        </div>
      </div>
      
      <div class="property-row">
        <div class="property-group half">
          <label>{{ $t('Width') }}</label>
          <el-input-number
            :value="element.w"
            :min="10"
            :max="canvasWidth - element.x"
            @change="(val) => updateSize('w', val)"
            size="small"
          />
        </div>
        
        <div class="property-group half">
          <label>{{ $t('Height') }}</label>
          <el-input-number
            :value="element.h"
            :min="10"
            :max="canvasHeight - element.y"
            @change="(val) => updateSize('h', val)"
            size="small"
          />
        </div>
      </div>
    </div>

    <!-- Element-specific Properties -->
    <div class="property-section">
      <h4>{{ $t('Properties') }}</h4>
      
      <!-- Text Element Properties -->
      <template v-if="element.type === 'text'">
        <div class="property-group">
          <label>{{ $t('Content') }}</label>
          <el-input
            v-model="element.props.content"
            type="textarea"
            :rows="3"
            @input="updateElement"
          />
        </div>
        
        <div class="property-group">
          <label>{{ $t('Font Size') }}</label>
          <el-input-number
            v-model="element.props.fontSize"
            :min="8"
            :max="72"
            @change="updateElement"
          />
        </div>
        
        <div class="property-group">
          <label>{{ $t('Font Weight') }}</label>
          <el-select v-model="element.props.fontWeight" @change="updateElement">
            <el-option label="Normal" value="normal"></el-option>
            <el-option label="Bold" value="bold"></el-option>
          </el-select>
        </div>
        
        <div class="property-group">
          <label>{{ $t('Color') }}</label>
          <el-color-picker v-model="element.props.color" @change="updateElement" />
        </div>
      </template>

      <!-- Form Field Element Properties -->
      <template v-if="element.type === 'field'">
        <div class="property-group">
          <label>{{ $t('Form Field') }}</label>
          <el-select 
            v-model="element.props.fieldName" 
            @change="updateElement"
            :placeholder="$t('Select a form field')"
            clearable
          >
            <el-option
              v-for="field in formFieldOptions"
              :key="field.value"
              :label="field.label"
              :value="field.value"
            />
          </el-select>
        </div>
        
        <div class="property-group">
          <label>{{ $t('Show Label') }}</label>
          <el-switch v-model="element.props.label" @change="updateElement" />
        </div>
        
        <div class="property-group">
          <label>{{ $t('Font Size') }}</label>
          <el-input-number
            v-model="element.props.fontSize"
            :min="8"
            :max="72"
            @change="updateElement"
          />
        </div>
      </template>

      <!-- Image Element Properties -->
      <template v-if="element.type === 'image'">
        <div class="property-group">
          <label>{{ $t('Image') }}</label>
          <div class="image-upload-section">
            <el-button 
              @click="openMediaLibrary" 
              size="small" 
              type="primary"
              icon="el-icon-picture-outline"
            >
              {{ element.props.src ? $t('Change Image') : $t('Select Image') }}
            </el-button>
            
            <div v-if="element.props.src" class="image-preview">
              <img :src="element.props.src" :alt="element.props.alt" />
              <el-button 
                @click="removeImage" 
                size="mini" 
                type="danger" 
                icon="el-icon-delete"
                circle
                class="remove-image-btn"
              />
            </div>
          </div>
        </div>
        
        <div class="property-group">
          <label>{{ $t('Alt Text') }}</label>
          <el-input
            v-model="element.props.alt"
            @input="updateElement"
          />
        </div>
      </template>

      <!-- Table Element Properties -->
      <template v-if="element.type === 'table'">
        <div class="property-group">
          <label>{{ $t('Rows') }}</label>
          <el-input-number
            v-model="element.props.rows"
            :min="1"
            :max="20"
            @change="resizeTable"
          />
        </div>
        
        <div class="property-group">
          <label>{{ $t('Columns') }}</label>
          <el-input-number
            v-model="element.props.cols"
            :min="1"
            :max="10"
            @change="resizeTable"
          />
        </div>
        
        <div class="property-group">
          <label>{{ $t('Show Headers') }}</label>
          <el-switch v-model="element.props.showHeaders" @change="updateElement" />
        </div>

        <div class="property-group">
          <label>{{ $t('Font Size') }}</label>
          <el-input-number
            v-model="element.props.fontSize"
            :min="8"
            :max="72"
            @change="updateElement"
          />
        </div>

        <!-- Table Content Editor -->
        <div class="property-group">
          <label>{{ $t('Table Content') }}</label>
          <div class="table-editor">
            <!-- Headers -->
            <div v-if="element.props.showHeaders" class="header-editor">
              <h4>{{ $t('Headers') }}</h4>
              <div 
                v-for="(header, index) in element.props.headers" 
                :key="'header-' + index"
                class="cell-editor-row"
              >
                <label class="cell-label">{{ $t('Header') }} {{ index + 1 }}</label>
                <div class="cell-input-group">
                  <el-input
                    :value="element.props.headers[index]"
                    :placeholder="`Header ${index + 1}`"
                    @input="updateHeader(index, $event)"
                    size="small"
                  />
                  <input-popover-dropdown
                    :data="editorShortcodes"
                    btn-type="info"
                    :plain="true"
                    button-text="+"
                    @command="insertSmartcodeToHeader(index, $event)"
                  />
                </div>
              </div>
            </div>

            <!-- Data Rows -->
            <div class="data-editor">
              <h4>{{ $t('Data') }}</h4>
              <div 
                v-for="(row, rowIndex) in element.props.data" 
                :key="'row-' + rowIndex"
                class="row-editor"
              >
                <label class="row-label">{{ $t('Row') }} {{ rowIndex + 1 }}</label>
                <div 
                  v-for="(cell, colIndex) in row" 
                  :key="'cell-' + rowIndex + '-' + colIndex"
                  class="cell-editor-row"
                >
                  <label class="cell-label">{{ $t('Cell') }} {{ rowIndex + 1 }}-{{ colIndex + 1 }}</label>
                  <div class="cell-input-group">
                    <el-input
                      :value="element.props.data[rowIndex][colIndex]"
                      :placeholder="`Cell ${rowIndex + 1}-${colIndex + 1}`"
                      @input="updateCell(rowIndex, colIndex, $event)"
                      size="small"
                    />
                    <input-popover-dropdown
                      :data="editorShortcodes"
                      btn-type="info"
                      :plain="true"
                      button-text="+"
                      @command="insertSmartcodeToCell(rowIndex, colIndex, $event)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Line Element Properties -->
      <template v-if="element.type === 'line'">
        <div class="property-group">
          <label>{{ $t('Thickness') }}</label>
          <el-input-number
            v-model="element.props.thickness"
            :min="1"
            :max="10"
            @change="updateElement"
          />
        </div>
        
        <div class="property-group">
          <label>{{ $t('Color') }}</label>
          <el-color-picker v-model="element.props.color" @change="updateElement" />
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import inputPopoverDropdown from '../../../common/input-popover-dropdown.vue';

export default {
  name: 'PdfElementProperties',
  components: {
    inputPopoverDropdown
  },
  props: {
    element: Object,
    formFields: Array,
    canvasWidth: Number,
    canvasHeight: Number,
    editorShortcodes: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    formFieldOptions() {
      console.log('Form fields received in properties:', this.formFields);
      
      if (!this.formFields || this.formFields.length === 0) {
        return [];
      }
      
      return this.formFields.map(field => {
        const name = field.name || field.attributes?.name || field.element;
        const label = field.label || field.admin_label || field.settings?.label || field.settings?.admin_field_label || name;
        
        return {
          value: name,
          label: `${label} (${name})`
        };
      });
    }
  },
  methods: {
    updateElement() {
      console.log('Updating element:', this.element);
      this.$emit('update', this.element.i, this.element);
    },
    
    updatePosition(field, value) {
      this.$emit('update-position', this.element.i, field, value);
    },
    
    updateSize(field, value) {
      this.$emit('update-size', this.element.i, field, value);
    },
    
    openMediaLibrary() {
      if (typeof wp !== 'undefined' && wp.media) {
        const mediaUploader = wp.media({
          title: this.$t('Select Image'),
          button: {
            text: this.$t('Use this image')
          },
          multiple: false,
          library: {
            type: 'image'
          }
        });

        mediaUploader.on('select', () => {
          const attachment = mediaUploader.state().get('selection').first().toJSON();
          this.element.props.src = attachment.url;
          this.element.props.alt = attachment.alt || attachment.title || '';
          this.updateElement();
        });

        mediaUploader.open();
      } else {
        // Fallback for when wp.media is not available
        const url = prompt(this.$t('Enter image URL:'), this.element.props.src || '');
        if (url !== null) {
          this.element.props.src = url;
          this.updateElement();
        }
      }
    },
    
    removeImage() {
      this.element.props.src = '';
      this.element.props.alt = '';
      this.updateElement();
    },
    updateHeader(index, value) {
      console.log('Updating header', index, 'with value:', value);
      if (!this.element.props.headers) {
        this.$set(this.element.props, 'headers', []);
      }
      this.$set(this.element.props.headers, index, value);
      this.updateElement();
    },
    updateCell(rowIndex, colIndex, value) {
      console.log('Updating cell', rowIndex, colIndex, 'with value:', value);
      if (!this.element.props.data) {
        this.$set(this.element.props, 'data', []);
      }
      if (!this.element.props.data[rowIndex]) {
        this.$set(this.element.props.data, rowIndex, []);
      }
      this.$set(this.element.props.data[rowIndex], colIndex, value);
      this.updateElement();
    },
    insertSmartcodeToHeader(headerIndex, smartcode) {
      console.log('Inserting smartcode to header', headerIndex, ':', smartcode);
      if (!this.element.props.headers) {
        this.$set(this.element.props, 'headers', []);
      }
      if (!this.element.props.headers[headerIndex]) {
        this.$set(this.element.props.headers, headerIndex, '');
      }
      const currentValue = this.element.props.headers[headerIndex] || '';
      this.$set(this.element.props.headers, headerIndex, currentValue + smartcode);
      this.updateElement();
    },
    insertSmartcodeToCell(rowIndex, colIndex, smartcode) {
      console.log('Inserting smartcode to cell', rowIndex, colIndex, ':', smartcode);
      if (!this.element.props.data) {
        this.$set(this.element.props, 'data', []);
      }
      if (!this.element.props.data[rowIndex]) {
        this.$set(this.element.props.data, rowIndex, []);
      }
      if (!this.element.props.data[rowIndex][colIndex]) {
        this.$set(this.element.props.data[rowIndex], colIndex, '');
      }
      const currentValue = this.element.props.data[rowIndex][colIndex] || '';
      this.$set(this.element.props.data[rowIndex], colIndex, currentValue + smartcode);
      this.updateElement();
    },
    resizeTable() {
      const rows = this.element.props.rows || 3;
      const cols = this.element.props.cols || 3;

      // Resize headers
      if (!this.element.props.headers) {
        this.element.props.headers = [];
      }
      while (this.element.props.headers.length < cols) {
        this.element.props.headers.push(`Header ${this.element.props.headers.length + 1}`);
      }
      this.element.props.headers = this.element.props.headers.slice(0, cols);

      // Resize data
      if (!this.element.props.data) {
        this.element.props.data = [];
      }
      
      // Adjust rows
      while (this.element.props.data.length < rows) {
        const newRow = Array.from({ length: cols }, (_, i) => `Cell ${this.element.props.data.length + 1}-${i + 1}`);
        this.element.props.data.push(newRow);
      }
      this.element.props.data = this.element.props.data.slice(0, rows);

      // Adjust columns in existing rows
      this.element.props.data.forEach((row, rowIndex) => {
        while (row.length < cols) {
          row.push(`Cell ${rowIndex + 1}-${row.length + 1}`);
        }
        this.element.props.data[rowIndex] = row.slice(0, cols);
      });

      this.updateElement();
    }
  }
};
</script>

<style scoped>
.pdf-element-properties {
  padding: 0;
}

.property-section {
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
}

.property-section:last-child {
  border-bottom: none;
}

.property-section h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #303133;
  font-weight: 600;
}

.property-row {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.property-group {
  margin-bottom: 15px;
}

.property-group.half {
  flex: 1;
  margin-bottom: 0;
}

.property-group label {
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.el-input,
.el-select,
.el-input-number {
  width: 100%;
}

.el-color-picker {
  width: 100%;
}

.image-upload-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.image-preview {
  position: relative;
  max-width: 150px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.remove-image-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  padding: 0;
  min-height: 20px;
}

.table-editor {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
  background: #fafafa;
}

.header-editor,
.data-editor {
  margin-bottom: 16px;
}

.header-editor h4,
.data-editor h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
}

.row-editor {
  margin-bottom: 12px;
  padding: 8px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: white;
}

.row-label {
  display: block;
  font-weight: bold;
  margin-bottom: 8px;
  color: #606266;
}

.cell-editor-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.cell-label {
  min-width: 80px;
  font-size: 12px;
  color: #909399;
  margin-right: 8px;
}

.cell-input-group {
  display: flex;
  flex: 1;
  gap: 4px;
  align-items: center;
}

.cell-input-group .el-input {
  flex: 1;
}

.cell-input-group .input-popover-dropdown {
  flex-shrink: 0;
}

.cell-input-group .el-button {
  min-width: 28px;
  padding: 5px 8px;
  font-size: 14px;
}
</style>
