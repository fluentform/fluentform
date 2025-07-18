<template>
  <div class="pdf-builder">
    <!-- Toolbar -->
    <div class="pdf-toolbar">
      <div class="toolbar-left">
        <el-button-group>
          <el-button 
            :type="pageSize === 'a4' ? 'primary' : ''"
            @click="changePageSize('a4')"
            size="small"
          >
            A4
          </el-button>
          <el-button 
            :type="pageSize === 'letter' ? 'primary' : ''"
            @click="changePageSize('letter')"
            size="small"
          >
            Letter
          </el-button>
        </el-button-group>
        
        <el-button-group class="ml-3">
          <el-button 
            :type="orientation === 'portrait' ? 'primary' : ''"
            @click="changeOrientation('portrait')"
            size="small"
          >
            Portrait
          </el-button>
          <el-button 
            :type="orientation === 'landscape' ? 'primary' : ''"
            @click="changeOrientation('landscape')"
            size="small"
          >
            Landscape
          </el-button>
        </el-button-group>

        <el-button-group class="ml-3">
          <el-button 
            @click="showHeaderFooterDialog = true"
            size="small"
            icon="el-icon-document"
          >
            {{ $t('Header/Footer') }}
          </el-button>
        </el-button-group>
      </div>
      
      <div class="toolbar-right">
        <el-button @click="previewPdf" type="info" size="small" icon="el-icon-view">
          {{ $t('Preview') }}
        </el-button>
        <el-button @click="savePdf" type="primary" size="small" icon="el-icon-check">
          {{ $t('Save') }}
        </el-button>
      </div>
    </div>

    <div class="pdf-builder-content">
      <!-- Element Palette -->
      <div class="element-palette">
        <h4>{{ $t('Elements') }}</h4>
        <div class="palette-list">
          <div
            v-for="element in availableElements"
            :key="element.type"
            class="palette-item"
            :class="'palette-' + element.type"
            draggable="true"
            @dragstart="handleDragStart($event, element)"
          >
            <i :class="element.icon"></i>
            <span>{{ element.label }}</span>
          </div>
        </div>
      </div>

      <!-- Canvas Area -->
      <div class="canvas-container">
        <div class="canvas-wrapper">
          <div 
            class="pdf-canvas" 
            :class="'canvas-' + pageSize + ' canvas-' + orientation"
            ref="pdfCanvas"
            @drop="handleDrop"
            @dragover="handleDragOver"
            @dragenter="handleDragEnter"
            @dragleave="handleDragLeave"
          >
            <!-- Grid Background -->
            <div class="grid-background"></div>
            
            <!-- Canvas Elements -->
            <div
              v-for="item in pdfLayout"
              :key="item.i"
              class="canvas-element"
              :class="{ 
                'selected': selectedElement && selectedElement.i === item.i,
                'dragging': draggingElement === item.i 
              }"
              :style="getElementStyle(item)"
              @mousedown="startDrag($event, item)"
              @click.stop="selectElement(item)"
            >
              <!-- Resize Handles -->
              <div v-if="selectedElement && selectedElement.i === item.i" class="resize-handles">
                <div class="resize-handle nw" @mousedown.stop="startResize($event, item, 'nw')"></div>
                <div class="resize-handle ne" @mousedown.stop="startResize($event, item, 'ne')"></div>
                <div class="resize-handle sw" @mousedown.stop="startResize($event, item, 'sw')"></div>
                <div class="resize-handle se" @mousedown.stop="startResize($event, item, 'se')"></div>
                <div class="resize-handle n" @mousedown.stop="startResize($event, item, 'n')"></div>
                <div class="resize-handle s" @mousedown.stop="startResize($event, item, 's')"></div>
                <div class="resize-handle w" @mousedown.stop="startResize($event, item, 'w')"></div>
                <div class="resize-handle e" @mousedown.stop="startResize($event, item, 'e')"></div>
              </div>

              <!-- Element Content -->
              <pdf-element
                :element="item"
                :form-data="sampleFormData"
                :form-fields="formFields"
                @update="updateElement"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Properties Panel -->
      <div class="properties-panel">
        <div class="panel-header">
          <h3>{{ $t('Properties') }}</h3>
          <el-button 
            v-if="selectedElement" 
            @click="deleteElement(selectedElement.i)"
            type="danger" 
            size="mini"
            icon="el-icon-delete"
          >
            {{ $t('Delete') }}
          </el-button>
        </div>
        
        <div class="panel-content">
          <div v-if="!selectedElement" class="no-selection">
            {{ $t('Select an element to edit its properties') }}
          </div>
          
          <pdf-element-properties
            v-if="selectedElement"
            :element="selectedElement"
            :form-fields="formFields"
            :canvas-width="canvasWidth"
            :canvas-height="canvasHeight"
            :editor-shortcodes="editorShortcodes"
            @update="updateElement"
            @update-position="updateElementPosition"
            @update-size="updateElementSize"
          />
        </div>
      </div>
    </div>

    <!-- Header/Footer Dialog -->
    <el-dialog
      :title="$t('PDF Header and Footer')"
      :visible.sync="showHeaderFooterDialog"
      width="600px"
    >
      <el-form label-position="top">
        <el-form-item :label="$t('Header Content')">
          <el-input
            v-model="headerContent"
            type="textarea"
            :rows="3"
            :placeholder="$t('Enter header content (HTML allowed)')"
          />
          <div class="help-text">
            {{ $t('Available variables: {DATE}, {PAGENO}, {nbpg}') }}
          </div>
        </el-form-item>
        
        <el-form-item :label="$t('Footer Content')">
          <el-input
            v-model="footerContent"
            type="textarea"
            :rows="3"
            :placeholder="$t('Enter footer content (HTML allowed)')"
          />
          <div class="help-text">
            {{ $t('Available variables: {DATE}, {PAGENO}, {nbpg}') }}
          </div>
        </el-form-item>
      </el-form>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="showHeaderFooterDialog = false">{{ $t('Cancel') }}</el-button>
        <el-button type="primary" @click="saveHeaderFooter">{{ $t('Save') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import PdfElement from './PdfElement.vue';
import PdfElementProperties from './PdfElementProperties.vue';

export default {
  name: 'PdfBuilder',
  components: {
    PdfElement,
    PdfElementProperties
  },
  props: {
    templateData: {
      type: Object,
      default: () => ({})
    },
    formFields: {
      type: Array,
      default: () => []
    },
    editorShortcodes: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      pageSize: 'a4',
      orientation: 'portrait',
      gridSize: 10,
      selectedElement: null,
      draggingElement: null,
      dragStartPos: { x: 0, y: 0 },
      resizing: false,
      resizeHandle: null,
      elementCounter: 0,
      pdfLayout: [],
      showHeaderFooterDialog: false,
      showPagesDialog: false,
      headerContent: '',
      footerContent: '',
      pages: [{ id: 1, name: 'Page 1', layout: [] }],
      currentPageIndex: 0,
      availableElements: [
        {
          type: 'text',
          label: this.$t('Text'),
          icon: 'el-icon-edit-outline',
          defaultProps: {
            content: 'Sample Text',
            fontSize: 14,
            fontWeight: 'normal',
            color: '#000000'
          }
        },
        {
          type: 'field',
          label: this.$t('Form Field'),
          icon: 'el-icon-tickets',
          defaultProps: {
            fieldName: '',
            label: true,
            fontSize: 12
          }
        },
        {
          type: 'image',
          label: this.$t('Image'),
          icon: 'el-icon-picture-outline',
          defaultProps: {
            src: '',
            alt: 'Image'
          }
        },
        {
          type: 'table',
          label: this.$t('Table'),
          icon: 'el-icon-menu',
          defaultProps: {
            rows: 3,
            cols: 3,
            showHeaders: true
          }
        },
        {
          type: 'line',
          label: this.$t('Line'),
          icon: 'el-icon-minus',
          defaultProps: {
            thickness: 1,
            color: '#000000'
          }
        }
      ],
      sampleFormData: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        message: 'This is a sample message for preview purposes.'
      }
    };
  },
  computed: {
    canvasWidth() {
      return this.pageSize === 'a4' 
        ? (this.orientation === 'portrait' ? 595 : 842)
        : (this.orientation === 'portrait' ? 612 : 792);
    },
    canvasHeight() {
      return this.pageSize === 'a4'
        ? (this.orientation === 'portrait' ? 842 : 595)
        : (this.orientation === 'portrait' ? 792 : 612);
    }
  },
  methods: {
    // Drag and Drop Handlers
    handleDragStart(event, element) {
      event.dataTransfer.setData('text/plain', JSON.stringify(element));
      event.dataTransfer.effectAllowed = 'copy';
    },

    handleDragOver(event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    },

    handleDragEnter(event) {
      event.preventDefault();
      this.$refs.pdfCanvas.classList.add('drag-over');
    },

    handleDragLeave(event) {
      if (!this.$refs.pdfCanvas.contains(event.relatedTarget)) {
        this.$refs.pdfCanvas.classList.remove('drag-over');
      }
    },

    handleDrop(event) {
      event.preventDefault();
      this.$refs.pdfCanvas.classList.remove('drag-over');
      
      try {
        const elementData = JSON.parse(event.dataTransfer.getData('text/plain'));
        if (elementData) {
          this.addElementToCanvas(elementData, event);
        }
      } catch (e) {
        console.error('Error parsing dropped element data:', e);
      }
    },

    addElementToCanvas(elementData, event) {
      const canvasRect = this.$refs.pdfCanvas.getBoundingClientRect();
      const dropX = Math.round((event.clientX - canvasRect.left) / this.gridSize) * this.gridSize;
      const dropY = Math.round((event.clientY - canvasRect.top) / this.gridSize) * this.gridSize;

      const defaultWidth = this.getDefaultWidth(elementData.type);
      const defaultHeight = this.getDefaultHeight(elementData.type);

      // Find a non-overlapping position starting from drop location
      const position = this.findNonOverlappingPosition(dropX, dropY, defaultWidth, defaultHeight);

      const newElement = {
        ...elementData,
        i: 'element_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        x: position.x,
        y: position.y,
        w: defaultWidth,
        h: defaultHeight,
        props: { ...elementData.defaultProps }
      };

      this.pdfLayout.push(newElement);
      this.selectElement(newElement);
    },

    findNonOverlappingPosition(preferredX, preferredY, width, height) {
      // Ensure within canvas bounds first
      preferredX = Math.max(0, Math.min(preferredX, this.canvasWidth - width));
      preferredY = Math.max(0, Math.min(preferredY, this.canvasHeight - height));

      // Check if preferred position is free
      if (!this.isPositionOccupied(preferredX, preferredY, width, height)) {
        return { x: preferredX, y: preferredY };
      }

      // Search in expanding spiral pattern
      const step = this.gridSize;
      for (let radius = step; radius <= Math.max(this.canvasWidth, this.canvasHeight); radius += step) {
        // Check positions in a square pattern around the preferred position
        for (let angle = 0; angle < 8; angle++) {
          let testX, testY;
          
          switch (angle) {
            case 0: testX = preferredX + radius; testY = preferredY; break;
            case 1: testX = preferredX - radius; testY = preferredY; break;
            case 2: testX = preferredX; testY = preferredY + radius; break;
            case 3: testX = preferredX; testY = preferredY - radius; break;
            case 4: testX = preferredX + radius; testY = preferredY + radius; break;
            case 5: testX = preferredX - radius; testY = preferredY - radius; break;
            case 6: testX = preferredX + radius; testY = preferredY - radius; break;
            case 7: testX = preferredX - radius; testY = preferredY + radius; break;
          }

          // Ensure within bounds
          testX = Math.max(0, Math.min(testX, this.canvasWidth - width));
          testY = Math.max(0, Math.min(testY, this.canvasHeight - height));

          if (!this.isPositionOccupied(testX, testY, width, height)) {
            return { x: testX, y: testY };
          }
        }
      }

      // If no position found, try systematic grid search
      for (let y = 0; y <= this.canvasHeight - height; y += step) {
        for (let x = 0; x <= this.canvasWidth - width; x += step) {
          if (!this.isPositionOccupied(x, y, width, height)) {
            return { x, y };
          }
        }
      }

      // Last resort - return original position
      return { x: preferredX, y: preferredY };
    },

    isPositionOccupied(x, y, width, height) {
      return this.pdfLayout.some(element => {
        // Check if rectangles overlap
        return !(
          x >= element.x + element.w ||  // new element is to the right
          x + width <= element.x ||      // new element is to the left
          y >= element.y + element.h ||  // new element is below
          y + height <= element.y        // new element is above
        );
      });
    },

    // Element Management
    getDefaultWidth(type) {
      const widths = {
        text: 200,
        field: 150,
        image: 150,
        table: 300,
        line: 200
      };
      return widths[type] || 150;
    },

    getDefaultHeight(type) {
      const heights = {
        text: 30,
        field: 40,
        image: 100,
        table: 120,
        line: 2
      };
      return heights[type] || 40;
    },

    getElementStyle(item) {
      return {
        position: 'absolute',
        left: item.x + 'px',
        top: item.y + 'px',
        width: item.w + 'px',
        height: item.h + 'px',
        zIndex: item.z || 1
      };
    },

    selectElement(element) {
      this.selectedElement = element;
    },

    updateElement(elementId, updatedElement) {
      console.log('PdfBuilder: Updating element', elementId, updatedElement);
      const index = this.pdfLayout.findIndex(el => el.i === elementId);
      if (index !== -1) {
        this.$set(this.pdfLayout, index, { ...updatedElement });
        this.$forceUpdate();
      }
    },

    deleteElement(elementId) {
      this.$confirm(
        this.$t('Are you sure you want to delete this element?'),
        this.$t('Delete Element'),
        {
          confirmButtonText: this.$t('Delete'),
          cancelButtonText: this.$t('Cancel'),
          type: 'warning'
        }
      ).then(() => {
        const index = this.pdfLayout.findIndex(el => el.i === elementId);
        if (index > -1) {
          this.pdfLayout.splice(index, 1);
          if (this.selectedElement && this.selectedElement.i === elementId) {
            this.selectedElement = null;
          }
        }
      }).catch(() => {
        // User cancelled
      });
    },

    // Drag Movement with smooth animation
    startDrag(event, element) {
      if (event.target.classList.contains('resize-handle')) return;
      
      this.selectElement(element);
      this.draggingElement = element.i;
      
      const canvasRect = this.$refs.pdfCanvas.getBoundingClientRect();
      this.dragStartPos = {
        x: event.clientX - canvasRect.left - element.x,
        y: event.clientY - canvasRect.top - element.y
      };

      document.addEventListener('mousemove', this.handleDragMove);
      document.addEventListener('mouseup', this.handleDragEnd);
      event.preventDefault();
    },

    handleDragMove(event) {
      if (this.draggingElement && !this.resizing) {
        const element = this.pdfLayout.find(el => el.i === this.draggingElement);
        if (element) {
          const canvasRect = this.$refs.pdfCanvas.getBoundingClientRect();
          const newX = event.clientX - canvasRect.left - this.dragStartPos.x;
          const newY = event.clientY - canvasRect.top - this.dragStartPos.y;
          
          // Snap to grid and constrain to canvas bounds
          const snappedX = Math.round(newX / this.gridSize) * this.gridSize;
          const snappedY = Math.round(newY / this.gridSize) * this.gridSize;
          
          const constrainedX = Math.max(0, Math.min(snappedX, this.canvasWidth - element.w));
          const constrainedY = Math.max(0, Math.min(snappedY, this.canvasHeight - element.h));

          // Check for overlap with other elements (excluding self)
          const tempLayout = this.pdfLayout.filter(el => el.i !== this.draggingElement);
          const wouldOverlap = tempLayout.some(otherElement => {
            return !(
              constrainedX >= otherElement.x + otherElement.w ||
              constrainedX + element.w <= otherElement.x ||
              constrainedY >= otherElement.y + otherElement.h ||
              constrainedY + element.h <= otherElement.y
            );
          });

          // Only update position if no overlap
          if (!wouldOverlap) {
            element.x = constrainedX;
            element.y = constrainedY;
          }
        }
      }
    },

    handleDragEnd() {
      this.draggingElement = null;
      this.resizing = false;
      this.resizeHandle = null;
      document.removeEventListener('mousemove', this.handleDragMove);
      document.removeEventListener('mousemove', this.handleResize);
      document.removeEventListener('mouseup', this.handleDragEnd);
    },

    // Resize Functionality with boundary constraints
    startResize(event, element, handle) {
      this.resizing = true;
      this.resizeHandle = handle;
      this.selectedElement = element;
      this.dragStartPos = {
        x: event.clientX,
        y: event.clientY,
        elementX: element.x,
        elementY: element.y,
        elementW: element.w,
        elementH: element.h
      };

      document.addEventListener('mousemove', this.handleResize);
      document.addEventListener('mouseup', this.handleDragEnd);
      event.preventDefault();
    },

    handleResize(event) {
      if (!this.resizing || !this.selectedElement) return;

      const deltaX = event.clientX - this.dragStartPos.x;
      const deltaY = event.clientY - this.dragStartPos.y;
      const element = this.selectedElement;

      let newX = element.x;
      let newY = element.y;
      let newW = element.w;
      let newH = element.h;

      switch (this.resizeHandle) {
        case 'se':
          newW = Math.max(20, this.dragStartPos.elementW + deltaX);
          newH = Math.max(20, this.dragStartPos.elementH + deltaY);
          break;
        case 'sw':
          newW = Math.max(20, this.dragStartPos.elementW - deltaX);
          newH = Math.max(20, this.dragStartPos.elementH + deltaY);
          newX = this.dragStartPos.elementX + deltaX;
          break;
        case 'ne':
          newW = Math.max(20, this.dragStartPos.elementW + deltaX);
          newH = Math.max(20, this.dragStartPos.elementH - deltaY);
          newY = this.dragStartPos.elementY + deltaY;
          break;
        case 'nw':
          newW = Math.max(20, this.dragStartPos.elementW - deltaX);
          newH = Math.max(20, this.dragStartPos.elementH - deltaY);
          newX = this.dragStartPos.elementX + deltaX;
          newY = this.dragStartPos.elementY + deltaY;
          break;
        case 'n':
          newH = Math.max(20, this.dragStartPos.elementH - deltaY);
          newY = this.dragStartPos.elementY + deltaY;
          break;
        case 's':
          newH = Math.max(20, this.dragStartPos.elementH + deltaY);
          break;
        case 'w':
          newW = Math.max(20, this.dragStartPos.elementW - deltaX);
          newX = this.dragStartPos.elementX + deltaX;
          break;
        case 'e':
          newW = Math.max(20, this.dragStartPos.elementW + deltaX);
          break;
      }

      // Constrain to canvas bounds
      if (newX < 0) {
        newW += newX;
        newX = 0;
      }
      if (newY < 0) {
        newH += newY;
        newY = 0;
      }
      if (newX + newW > this.canvasWidth) {
        newW = this.canvasWidth - newX;
      }
      if (newY + newH > this.canvasHeight) {
        newH = this.canvasHeight - newY;
      }

      // Snap to grid
      element.x = Math.round(newX / this.gridSize) * this.gridSize;
      element.y = Math.round(newY / this.gridSize) * this.gridSize;
      element.w = Math.round(newW / this.gridSize) * this.gridSize;
      element.h = Math.round(newH / this.gridSize) * this.gridSize;
    },

    // Property Updates with boundary constraints
    updateElementPosition(elementId, field, value) {
      const element = this.pdfLayout.find(el => el.i === elementId);
      if (element) {
        const numValue = parseInt(value) || 0;
        if (field === 'x') {
          element.x = Math.max(0, Math.min(numValue, this.canvasWidth - element.w));
        } else if (field === 'y') {
          element.y = Math.max(0, Math.min(numValue, this.canvasHeight - element.h));
        }
        this.$forceUpdate();
      }
    },

    updateElementSize(elementId, field, value) {
      const element = this.pdfLayout.find(el => el.i === elementId);
      if (element) {
        const numValue = parseInt(value) || 10;
        if (field === 'w') {
          element.w = Math.max(10, Math.min(numValue, this.canvasWidth - element.x));
        } else if (field === 'h') {
          element.h = Math.max(10, Math.min(numValue, this.canvasHeight - element.y));
        }
        this.$forceUpdate();
      }
    },

    // Page Settings
    changePageSize(size) {
      this.pageSize = size;
      // Reposition elements that are now outside bounds
      this.pdfLayout.forEach(element => {
        if (element.x + element.w > this.canvasWidth) {
          element.x = Math.max(0, this.canvasWidth - element.w);
        }
        if (element.y + element.h > this.canvasHeight) {
          element.y = Math.max(0, this.canvasHeight - element.h);
        }
      });
    },

    changeOrientation(orientation) {
      this.orientation = orientation;
      // Reposition elements that are now outside bounds
      this.pdfLayout.forEach(element => {
        if (element.x + element.w > this.canvasWidth) {
          element.x = Math.max(0, this.canvasWidth - element.w);
        }
        if (element.y + element.h > this.canvasHeight) {
          element.y = Math.max(0, this.canvasHeight - element.h);
        }
      });
    },

    // Header/Footer methods
    saveHeaderFooter() {
      this.showHeaderFooterDialog = false;
      this.$message.success(this.$t('Header and footer saved'));
    },

    // Page management methods
    addNewPage() {
      const newPage = {
        id: Date.now(),
        name: `Page ${this.pages.length + 1}`,
        layout: []
      };
      this.pages.push(newPage);
    },

    switchToPage(pageIndex) {
      // Save current page layout
      this.pages[this.currentPageIndex].layout = [...this.pdfLayout];
      
      // Switch to new page
      this.currentPageIndex = pageIndex;
      this.pdfLayout = [...this.pages[pageIndex].layout];
      this.selectedElement = null;
      
      this.showPagesDialog = false;
      this.$message.success(this.$t('Switched to') + ' ' + this.pages[pageIndex].name);
    },

    duplicatePage(pageIndex) {
      const originalPage = this.pages[pageIndex];
      const duplicatedPage = {
        id: Date.now(),
        name: originalPage.name + ' (Copy)',
        layout: JSON.parse(JSON.stringify(originalPage.layout))
      };
      this.pages.splice(pageIndex + 1, 0, duplicatedPage);
    },

    deletePage(pageIndex) {
      this.$confirm(
        this.$t('Are you sure you want to delete this page?'),
        this.$t('Delete Page'),
        {
          confirmButtonText: this.$t('Delete'),
          cancelButtonText: this.$t('Cancel'),
          type: 'warning'
        }
      ).then(() => {
        this.pages.splice(pageIndex, 1);
        
        // Adjust current page index if necessary
        if (this.currentPageIndex >= pageIndex && this.currentPageIndex > 0) {
          this.currentPageIndex--;
        }
        
        // Load the current page layout
        this.pdfLayout = [...this.pages[this.currentPageIndex].layout];
        this.selectedElement = null;
      });
    },

    updatePageName(pageIndex, newName) {
      this.pages[pageIndex].name = newName;
    },

    // Updated save method to include all pages
    savePdf() {
      // Save current page layout
      this.pages[this.currentPageIndex].layout = [...this.pdfLayout];
      
      const templateData = {
        pages: this.pages,
        pageSize: this.pageSize,
        orientation: this.orientation,
        headerContent: this.headerContent,
        footerContent: this.footerContent
      };
      this.$emit('save', templateData);
    },

    // Updated preview method
    previewPdf() {
      // Save current page layout
      this.pages[this.currentPageIndex].layout = [...this.pdfLayout];
      
      const templateData = {
        pages: this.pages,
        pageSize: this.pageSize,
        orientation: this.orientation,
        headerContent: this.headerContent,
        footerContent: this.footerContent
      };
      this.$emit('preview', templateData);
    },

    getFormFieldOptions() {
      return this.formFields.map(field => ({
        value: field.name,
        label: field.label || field.name
      }));
    },

    updateAvailableElements() {
      this.availableElements = [
        {
          type: 'text',
          label: this.$t('Text'),
          icon: 'el-icon-edit-outline',
          defaultProps: {
            content: 'Sample Text',
            fontSize: 14,
            fontWeight: 'normal',
            color: '#000000'
          }
        },
        {
          type: 'field',
          label: this.$t('Form Field'),
          icon: 'el-icon-tickets',
          defaultProps: {
            fieldName: this.formFields.length > 0 ? this.formFields[0].name : '',
            label: true,
            fontSize: 12
          }
        },
        {
          type: 'image',
          label: this.$t('Image'),
          icon: 'el-icon-picture-outline',
          defaultProps: {
            src: '',
            alt: 'Image'
          }
        },
        {
          type: 'table',
          label: this.$t('Table'),
          icon: 'el-icon-menu',
          defaultProps: {
            rows: 3,
            cols: 3,
            showHeaders: true,
            headers: ['Header 1', 'Header 2', 'Header 3'],
            data: [
              ['Cell 1-1', 'Cell 1-2', 'Cell 1-3'],
              ['Cell 2-1', 'Cell 2-2', 'Cell 2-3'],
              ['Cell 3-1', 'Cell 3-2', 'Cell 3-3']
            ]
          }
        },
        {
          type: 'line',
          label: this.$t('Line'),
          icon: 'el-icon-minus',
          defaultProps: {
            thickness: 1,
            color: '#000000'
          }
        }
      ];
    }
  },

  watch: {
    formFields: {
      handler(newFields, oldFields) {
        this.updateAvailableElements();
      },
      immediate: true,
      deep: true
    }
  },

  mounted() {
    // Load existing template data
    if (this.templateData.layout) {
      this.pdfLayout = [...this.templateData.layout];
      this.pageSize = this.templateData.pageSize || 'a4';
      this.orientation = this.templateData.orientation || 'portrait';
      this.elementCounter = this.pdfLayout.length;
    }

    this.updateAvailableElements();

    // Handle clicks outside canvas to deselect
    document.addEventListener('click', (event) => {
      if (!this.$refs.pdfCanvas.contains(event.target) && 
          !event.target.closest('.properties-panel')) {
        this.selectedElement = null;
      }
    });

    // Handle keyboard delete
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (this.selectedElement && !event.target.matches('input, textarea')) {
          event.preventDefault();
          this.deleteElement(this.selectedElement.i);
        }
      }
    });
  },

  beforeDestroy() {
    // Clean up event listeners
    document.removeEventListener('mousemove', this.handleDragMove);
    document.removeEventListener('mousemove', this.handleResize);
    document.removeEventListener('mouseup', this.handleDragEnd);
  }
};
</script>

<style scoped>
.pdf-builder {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 600px;
}

.pdf-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #e4e7ed;
  background: #f8f9fa;
}

.pdf-builder-content {
  display: flex;
  flex: 1;
  min-height: 0;
}

.element-palette {
  width: 200px;
  border-right: 1px solid #e4e7ed;
  padding: 15px;
  background: #fafafa;
}

.element-palette h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #606266;
}

.palette-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.palette-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: white;
  cursor: grab;
  transition: all 0.2s ease;
  user-select: none;
}

.palette-item:hover {
  border-color: #409eff;
  background: #ecf5ff;
  transform: translateY(-1px);
}

.palette-item:active {
  cursor: grabbing;
  transform: translateY(0);
}

.palette-item i {
  margin-right: 8px;
  color: #409eff;
}

.canvas-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
  background: #f0f2f5;
  overflow: auto;
}

.canvas-wrapper {
  position: relative;
}

.pdf-canvas {
  position: relative;
  background: white;
  border: 1px solid #ddd;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.canvas-a4.canvas-portrait {
  width: 595px;
  height: 842px;
}

.canvas-a4.canvas-landscape {
  width: 842px;
  height: 595px;
}

.canvas-letter.canvas-portrait {
  width: 612px;
  height: 792px;
}

.canvas-letter.canvas-landscape {
  width: 792px;
  height: 612px;
}

.pdf-canvas.drag-over {
  border-color: #409eff;
  background: #ecf5ff;
}

.grid-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(to right, #f0f0f0 1px, transparent 1px),
    linear-gradient(to bottom, #f0f0f0 1px, transparent 1px);
  background-size: 10px 10px;
  pointer-events: none;
  opacity: 0.5;
}

.canvas-element {
  position: absolute;
  border: 1px solid transparent;
  cursor: move;
  transition: border-color 0.2s ease;
}

.canvas-element:hover {
  border-color: #409eff;
}

.canvas-element.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.canvas-element.dragging {
  opacity: 0.8;
  z-index: 1000;
  transition: none;
}

.resize-handles {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  background: #409eff;
  border: 1px solid white;
  pointer-events: all;
  z-index: 10;
  transition: all 0.2s ease;
}

.resize-handle:hover {
  background: #66b1ff;
  transform: scale(1.2);
}

.resize-handle.nw, .resize-handle.ne, .resize-handle.sw, .resize-handle.se {
  width: 8px;
  height: 8px;
}

.resize-handle.n, .resize-handle.s {
  width: 8px;
  height: 4px;
  left: 50%;
  transform: translateX(-50%);
}

.resize-handle.w, .resize-handle.e {
  width: 4px;
  height: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.resize-handle.nw { top: -4px; left: -4px; cursor: nw-resize; }
.resize-handle.ne { top: -4px; right: -4px; cursor: ne-resize; }
.resize-handle.sw { bottom: -4px; left: -4px; cursor: sw-resize; }
.resize-handle.se { bottom: -4px; right: -4px; cursor: se-resize; }
.resize-handle.n { top: -4px; cursor: n-resize; }
.resize-handle.s { bottom: -4px; cursor: s-resize; }
.resize-handle.w { left: -4px; cursor: w-resize; }
.resize-handle.e { right: -4px; cursor: e-resize; }

.properties-panel {
  width: 250px;
  border-left: 1px solid #e4e7ed;
  padding: 15px;
  background: #fafafa;
}

.properties-panel h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #606266;
}

.property-group {
  margin-bottom: 20px;
}

.property-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.property-group small {
  display: block;
  text-align: center;
  font-size: 10px;
  color: #909399;
  margin-top: 4px;
}
</style>
