<template>
  <div class="pdf-element-content" :class="'element-' + element.type">
    <!-- Text Element -->
    <div v-if="element.type === 'text'" 
         :style="textStyle"
         class="text-element">
      {{ element.props.content }}
    </div>

    <!-- Form Field Element -->
    <div v-else-if="element.type === 'field'" class="field-element">
      <div v-if="element.props.label && selectedField" class="field-label">
        {{ selectedField.label }}
      </div>
      <div class="field-value" :style="fieldStyle">
        {{ getFieldValue() }}
      </div>
    </div>

    <!-- Image Element -->
    <div v-else-if="element.type === 'image'" class="image-element">
      <img v-if="element.props.src" 
           :src="element.props.src" 
           :alt="element.props.alt"
           style="width: 100%; height: 100%; object-fit: contain;" />
      <div v-else class="image-placeholder">
        <i class="el-icon-picture-outline"></i>
        <span>{{ $t('Image') }}</span>
      </div>
    </div>

    <!-- Table Element -->
    <table v-else-if="element.type === 'table'" class="pdf-table">
      <thead v-if="element.props.showHeaders">
        <tr>
          <th 
            v-for="(header, index) in element.props.headers" 
            :key="'header-' + index"
            :style="{ fontSize: element.props.fontSize + 'px' }"
          >
            {{ header }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr 
          v-for="(row, rowIndex) in element.props.data" 
          :key="'row-' + rowIndex"
        >
          <td 
            v-for="(cell, colIndex) in row" 
            :key="'cell-' + rowIndex + '-' + colIndex"
            :style="{ fontSize: element.props.fontSize + 'px' }"
          >
            {{ cell }}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Line Element -->
    <div v-else-if="element.type === 'line'" class="line-element">
      <div class="line" :style="lineStyle"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PdfElement',
  props: {
    element: {
      type: Object,
      required: true
    },
    formData: {
      type: Object,
      default: () => ({})
    },
    formFields: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    selectedField() {
      if (!this.formFields || !this.element.props.fieldName) {
        return null;
      }
      
      return this.formFields.find(field => {
        const fieldName = field.name || field.attributes?.name || field.element;
        return fieldName === this.element.props.fieldName;
      });
    },
    
    textStyle() {
      const textAlign = this.element.props.textAlign || 'left';
      const verticalAlign = this.element.props.verticalAlign || 'middle';
      
      let justifyContent = 'flex-start';
      if (textAlign === 'center') {
        justifyContent = 'center';
      } else if (textAlign === 'right') {
        justifyContent = 'flex-end';
      }
      
      let alignItems = 'center';
      if (verticalAlign === 'top') {
        alignItems = 'flex-start';
      } else if (verticalAlign === 'bottom') {
        alignItems = 'flex-end';
      }
      
      return {
        fontSize: this.element.props.fontSize + 'px',
        fontWeight: this.element.props.fontWeight || 'normal',
        fontStyle: this.element.props.fontStyle || 'normal',
        color: this.element.props.color || '#000000',
        backgroundColor: this.element.props.backgroundColor || 'transparent',
        lineHeight: '1.2',
        wordWrap: 'break-word',
        padding: '4px',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: alignItems,
        justifyContent: justifyContent,
        textAlign: textAlign
      };
    },
    
    fieldStyle() {
      return {
        fontSize: this.element.props.fontSize + 'px',
        lineHeight: '1.2',
        wordWrap: 'break-word'
      };
    },
    
    tableStyle() {
      return {
        fontSize: (this.element.props.fontSize || 10) + 'px',
        borderCollapse: 'collapse',
        width: '100%',
        height: '100%'
      };
    },
    
    lineStyle() {
      return {
        height: this.element.props.thickness + 'px',
        backgroundColor: this.element.props.color,
        width: '100%'
      };
    },

    tableHeaders() {
      if (!this.element.props.headers) {
        // Initialize headers if not present
        const cols = this.element.props.cols || 3;
        this.element.props.headers = Array.from({ length: cols }, (_, i) => `Header ${i + 1}`);
      }
      return this.element.props.headers;
    },

    tableData() {
      if (!this.element.props.data) {
        // Initialize table data if not present
        const rows = this.element.props.rows || 3;
        const cols = this.element.props.cols || 3;
        this.element.props.data = Array.from({ length: rows }, (_, rowIndex) =>
          Array.from({ length: cols }, (_, colIndex) => `Cell ${rowIndex + 1}-${colIndex + 1}`)
        );
      }
      return this.element.props.data;
    }
  },
  methods: {
    getFieldValue() {
      if (!this.element.props.fieldName) {
        return this.$t('Select a field');
      }
      
      const selectedField = this.selectedField;
      if (!selectedField) {
        return `[${this.element.props.fieldName}]`;
      }
      
      // Show field label as preview
      const label = selectedField.label || selectedField.settings?.label || selectedField.settings?.admin_field_label;
      return label || selectedField.name || this.element.props.fieldName;
    },
    updateTableHeader(colIndex, value) {
      if (!this.element.props.headers) {
        this.element.props.headers = [];
      }
      this.$set(this.element.props.headers, colIndex, value);
      this.$emit('update', this.element.i, this.element);
    },
    updateTableCell(rowIndex, colIndex, value) {
      if (!this.element.props.data) {
        this.element.props.data = [];
      }
      if (!this.element.props.data[rowIndex]) {
        this.$set(this.element.props.data, rowIndex, []);
      }
      this.$set(this.element.props.data[rowIndex], colIndex, value);
      this.$emit('update', this.element.i, this.element);
    }
  }
};
</script>

<style scoped>
.pdf-element-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.text-element {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 4px;
  box-sizing: border-box;
}

.field-element {
  width: 100%;
  height: 100%;
  padding: 4px;
}

.field-label {
  font-size: 10px;
  color: #666;
  margin-bottom: 2px;
}

.field-value {
  color: #333;
}

.image-element {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ccc;
  font-size: 12px;
}

.image-placeholder i {
  font-size: 24px;
  margin-bottom: 4px;
}

.table-element {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.pdf-table {
  border-collapse: collapse;
  width: 100%;
  height: 100%;
}

.pdf-table-header,
.pdf-table-cell {
  border: 1px solid #ddd;
  padding: 4px 8px;
  text-align: left;
  vertical-align: top;
  min-width: 20px;
  min-height: 20px;
}

.pdf-table-header {
  background-color: #f5f5f5;
  font-weight: bold;
}

.pdf-table-cell:focus,
.pdf-table-header:focus {
  outline: 2px solid #409eff;
  background-color: #f0f9ff;
}

.line-element {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}

.line {
  width: 100%;
}
</style>
