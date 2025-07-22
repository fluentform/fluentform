<template>
  <div class="pdf-builder">
    <!-- Toolbar -->
    <div class="pdf-toolbar">
      <div class="toolbar-left">
        <!-- Removed sidebar toggle button -->
      </div>
      <div class="toolbar-right">
        <el-button @click="savePdf" type="primary" size="small" icon="el-icon-check">
          {{ $t('Save') }}
        </el-button>
      </div>
    </div>

    <div class="pdf-builder-content">
      <!-- Element Palette -->
      <div class="element-palette ff_layout_section_sidebar">
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
        <div class="canvas-wrapper" :style="`width: ${canvasWidth}px; margin: 20px;`">
          <div
            ref="pdfCanvas"
            class="pdf-canvas"
            :class="{ 'drag-over': isDragOver }"
            :style="canvasStyle"
            @click="handleCanvasClick"
            @drop="handleDrop"
            @dragover.prevent
            @dragenter.prevent="isDragOver = true"
            @dragleave.prevent="isDragOver = false"
          >
            <!-- Grid background -->
            <div class="grid-background" :style="gridStyle"></div>
            
            <!-- PDF Elements -->
            <div
              v-for="element in pdfLayout"
              :key="element.i"
              class="canvas-element"
              :class="{ 
                'selected': selectedElement && selectedElement.i === element.i,
                'dragging': draggingElement === element.i 
              }"
              :style="getElementStyle(element)"
              @click.stop="selectElement(element)"
              @mousedown="startDrag($event, element)"
            >
              <!-- Element Content -->
              <div class="element-content" :style="getElementContentStyle(element)">
                <!-- Text Element -->
                <div v-if="element.type === 'text'" class="text-element" :style="textStyle(element)">
                  {{ element.props.content || 'Sample Text' }}
                </div>
                
                <!-- Image Element -->
                <div v-else-if="element.type === 'image'" class="image-element">
                  <div v-if="element.props.src" class="image-preview" :style="imagePreviewStyle(element)">
                    <img 
                      :src="element.props.src" 
                      :alt="element.props.alt" 
                      :style="imageElementStyle(element)"
                    />
                  </div>
                  <div v-else class="image-placeholder">
                    <i class="el-icon-picture"></i>
                    <span>No image selected</span>
                  </div>
                </div>
                
                <!-- Line Element -->
                <div v-else-if="element.type === 'line'" class="line-element" :style="lineStyle(element)">
                </div>
              </div>
              
              <!-- Resize handles -->
              <div 
                v-if="selectedElement && selectedElement.i === element.i" 
                class="resize-handles"
              >
                <div 
                  class="resize-handle resize-handle-nw"
                  @mousedown.stop="startResize($event, element, 'nw')"
                ></div>
                <div 
                  class="resize-handle resize-handle-ne"
                  @mousedown.stop="startResize($event, element, 'ne')"
                ></div>
                <div 
                  class="resize-handle resize-handle-sw"
                  @mousedown.stop="startResize($event, element, 'sw')"
                ></div>
                <div 
                  class="resize-handle resize-handle-se"
                  @mousedown.stop="startResize($event, element, 'se')"
                ></div>
              </div>
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
          
          <div v-if="selectedElement" class="element-properties">
            <el-form label-position="top" size="small">
              <el-form-item :label="$t('Position')">
                <el-row :gutter="10">
                  <el-col :span="12">
                    <el-input-number 
                      v-model="selectedElement.x" 
                      :min="0" 
                      :max="canvasWidth - selectedElement.w"
                      size="mini"
                      controls-position="right"
                      @change="updateElementPosition"
                    />
                    <label>X</label>
                  </el-col>
                  <el-col :span="12">
                    <el-input-number 
                      v-model="selectedElement.y" 
                      :min="0" 
                      :max="canvasHeight - selectedElement.h"
                      size="mini"
                      controls-position="right"
                      @change="updateElementPosition"
                    />
                    <label>Y</label>
                  </el-col>
                </el-row>
              </el-form-item>
              
              <el-form-item :label="$t('Size')">
                <el-row :gutter="10">
                  <el-col :span="12">
                    <el-input-number 
                      v-model="selectedElement.w" 
                      :min="20" 
                      :max="canvasWidth"
                      size="mini"
                      controls-position="right"
                      @change="updateElementSize"
                    />
                    <label>W</label>
                  </el-col>
                  <el-col :span="12">
                    <el-input-number 
                      v-model="selectedElement.h" 
                      :min="20" 
                      :max="canvasHeight"
                      size="mini"
                      controls-position="right"
                      @change="updateElementSize"
                    />
                    <label>H</label>
                  </el-col>
                </el-row>
              </el-form-item>

              <!-- Element-specific properties -->
              <template v-if="selectedElement.type === 'text'">
                <el-form-item :label="$t('Content')">
                  <input-popover 
                    v-model="selectedElement.props.content" 
                    fieldType="textarea"
                    :rows="3"
                    :data="editorShortcodes"
                    :placeholder="$t('Enter text or select field')"
                    @input="updateElementProps"
                  />
                </el-form-item>
                <el-form-item :label="$t('Font Size')">
                  <el-input-number 
                    v-model="selectedElement.props.fontSize" 
                    :min="8" 
                    :max="72"
                    @change="updateElementProps"
                  />
                </el-form-item>
                <el-form-item :label="$t('Font Weight')">
                  <el-select v-model="selectedElement.props.fontWeight" @change="updateElementProps">
                    <el-option label="Normal" value="normal"></el-option>
                    <el-option label="Bold" value="bold"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item :label="$t('Font Style')">
                  <el-select v-model="selectedElement.props.fontStyle" @change="updateElementProps">
                    <el-option label="Normal" value="normal"></el-option>
                    <el-option label="Italic" value="italic"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item :label="$t('Text Align')">
                  <el-select v-model="selectedElement.props.textAlign" @change="updateElementProps">
                    <el-option label="Left" value="left"></el-option>
                    <el-option label="Center" value="center"></el-option>
                    <el-option label="Right" value="right"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item :label="$t('Text Color')">
                  <el-color-picker v-model="selectedElement.props.color" @change="updateElementProps" />
                </el-form-item>
                <el-form-item :label="$t('Background Color')">
                  <el-color-picker 
                    v-model="selectedElement.props.backgroundColor" 
                    @change="updateElementProps"
                    show-alpha
                  />
                </el-form-item>
              </template>

              <template v-if="selectedElement.type === 'image'">
                <el-form-item :label="$t('Image')">
                  <div class="image-upload-section">
                    <el-button @click="openMediaLibrary" type="primary" size="small" icon="el-icon-upload">
                      {{ selectedElement.props.src ? $t('Change Image') : $t('Upload Image') }}
                    </el-button>
                    <el-button 
                      v-if="selectedElement.props.src" 
                      @click="removeImage" 
                      type="danger" 
                      size="small" 
                      icon="el-icon-delete"
                    >
                      {{ $t('Remove') }}
                    </el-button>
                  </div>
                  <div v-if="selectedElement.props.src" class="image-preview-small">
                    <img :src="selectedElement.props.src" style="max-width: 150px; max-height: 100px; object-fit: contain;" />
                  </div>
                </el-form-item>
                
                <el-form-item :label="$t('Alt Text')">
                  <el-input 
                    v-model="selectedElement.props.alt" 
                    :placeholder="$t('Image description')"
                    @input="updateElementProps"
                  />
                </el-form-item>
                
                <el-form-item :label="$t('Object Fit')">
                  <el-select v-model="selectedElement.props.objectFit" @change="updateElementProps">
                    <el-option label="Contain" value="contain"></el-option>
                    <el-option label="Cover" value="cover"></el-option>
                    <el-option label="Fill" value="fill"></el-option>
                    <el-option label="Scale Down" value="scale-down"></el-option>
                  </el-select>
                </el-form-item>
                
                <el-form-item :label="$t('Border Radius')">
                  <el-input-number 
                    v-model="selectedElement.props.borderRadius" 
                    :min="0" 
                    :max="50"
                    @change="updateElementProps"
                  />
                  <span style="margin-left: 5px;">px</span>
                </el-form-item>
                
                <el-form-item :label="$t('Border')">
                  <el-row :gutter="10">
                    <el-col :span="8">
                      <el-input-number 
                        v-model="selectedElement.props.borderWidth" 
                        :min="0" 
                        :max="10"
                        size="mini"
                        @change="updateElementProps"
                      />
                      <label>Width</label>
                    </el-col>
                    <el-col :span="8">
                      <el-select v-model="selectedElement.props.borderStyle" size="mini" @change="updateElementProps">
                        <el-option label="None" value="none"></el-option>
                        <el-option label="Solid" value="solid"></el-option>
                        <el-option label="Dashed" value="dashed"></el-option>
                        <el-option label="Dotted" value="dotted"></el-option>
                      </el-select>
                      <label>Style</label>
                    </el-col>
                    <el-col :span="8">
                      <el-color-picker v-model="selectedElement.props.borderColor" size="mini" @change="updateElementProps" />
                      <label>Color</label>
                    </el-col>
                  </el-row>
                </el-form-item>
              </template>
            </el-form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import inputPopover from '../input-popover.vue';

export default {
  name: 'PdfBuilder',
  components: {
    inputPopover
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
    },
    appearance: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      pdfLayout: [],
      selectedElement: null,
      draggingElement: null,
      resizing: false,
      resizeHandle: null,
      elementCounter: 0,
      isDragOver: false,
      pages: [
        {
          id: 1,
          name: 'Page 1',
          layout: []
        }
      ],
      currentPageIndex: 0,
      sampleFormData: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '123-456-7890'
      },
      gridSize: 10,
      availableElements: [
        {
          type: 'text',
          label: 'Text',
          icon: 'el-icon-edit-outline',
          defaultProps: {
            content: 'Sample Text',
            fontSize: 14,
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: 'left',
            verticalAlign: 'middle',
            color: '#000000',
            backgroundColor: 'transparent'
          }
        },
        {
          type: 'image',
          label: 'Image',
          icon: 'el-icon-picture',
          defaultProps: {
            src: '',
            alt: 'Image',
            objectFit: 'contain',
            borderRadius: 0,
            borderWidth: 0,
            borderStyle: 'none',
            borderColor: '#000000'
          }
        },
        {
          type: 'line',
          label: 'Line',
          icon: 'el-icon-minus',
          defaultProps: {
            color: '#000000',
            thickness: 1,
            style: 'solid'
          }
        }
      ],
    };
  },
  computed: {
    formData() {
      // Use sample data for preview purposes
      return this.sampleFormData;
    },
    
    canvasWidth() {
      const paperSize = this.appearance?.paper_size || 'A4';
      const orientation = this.appearance?.orientation || 'P';
      
      // Convert mm to pixels at 96 DPI (1mm = 3.78 pixels)
      const mmToPx = (mm) => Math.round(mm * 3.78);
      
      const paperSizes = {
        // A Series
        'A0': { w: mmToPx(841), h: mmToPx(1189) },
        'A1': { w: mmToPx(594), h: mmToPx(841) },
        'A2': { w: mmToPx(420), h: mmToPx(594) },
        'A3': { w: mmToPx(297), h: mmToPx(420) },
        'A4': { w: mmToPx(210), h: mmToPx(297) },
        'A5': { w: mmToPx(148), h: mmToPx(210) },
        'A6': { w: mmToPx(105), h: mmToPx(148) },
        'A7': { w: mmToPx(74), h: mmToPx(105) },
        'A8': { w: mmToPx(52), h: mmToPx(74) },
        'A9': { w: mmToPx(37), h: mmToPx(52) },
        'A10': { w: mmToPx(26), h: mmToPx(37) },
        
        // B Series
        'B0': { w: mmToPx(1414), h: mmToPx(1000) },
        'B1': { w: mmToPx(1000), h: mmToPx(707) },
        'B2': { w: mmToPx(707), h: mmToPx(500) },
        'B3': { w: mmToPx(500), h: mmToPx(353) },
        'B4': { w: mmToPx(353), h: mmToPx(250) },
        'B5': { w: mmToPx(250), h: mmToPx(176) },
        'B6': { w: mmToPx(176), h: mmToPx(125) },
        'B7': { w: mmToPx(125), h: mmToPx(88) },
        'B8': { w: mmToPx(88), h: mmToPx(62) },
        'B9': { w: mmToPx(62), h: mmToPx(44) },
        'B10': { w: mmToPx(44), h: mmToPx(31) },
        
        // C Series
        'C0': { w: mmToPx(1297), h: mmToPx(917) },
        'C1': { w: mmToPx(917), h: mmToPx(648) },
        'C2': { w: mmToPx(648), h: mmToPx(458) },
        'C3': { w: mmToPx(458), h: mmToPx(324) },
        'C4': { w: mmToPx(324), h: mmToPx(229) },
        'C5': { w: mmToPx(229), h: mmToPx(162) },
        'C6': { w: mmToPx(162), h: mmToPx(114) },
        'C7': { w: mmToPx(114), h: mmToPx(81) },
        'C8': { w: mmToPx(81), h: mmToPx(57) },
        'C9': { w: mmToPx(57), h: mmToPx(40) },
        'C10': { w: mmToPx(40), h: mmToPx(28) },
        
        // RA Series
        'RA0': { w: mmToPx(860), h: mmToPx(1220) },
        'RA1': { w: mmToPx(610), h: mmToPx(860) },
        'RA2': { w: mmToPx(430), h: mmToPx(610) },
        'RA3': { w: mmToPx(305), h: mmToPx(430) },
        'RA4': { w: mmToPx(215), h: mmToPx(305) },
        
        // SRA Series
        'SRA0': { w: mmToPx(900), h: mmToPx(1280) },
        'SRA1': { w: mmToPx(640), h: mmToPx(900) },
        'SRA2': { w: mmToPx(450), h: mmToPx(640) },
        'SRA3': { w: mmToPx(320), h: mmToPx(450) },
        'SRA4': { w: mmToPx(225), h: mmToPx(320) },
        
        // US/Imperial sizes (convert inches to pixels at 96 DPI)
        'Letter': { w: 816, h: 1056 }, // 8.5 x 11 inches
        'Legal': { w: 816, h: 1344 }, // 8.5 x 14 inches
        'ledger': { w: 1056, h: 1632 }, // 11 x 17 inches (Tabloid)
        'Executive': { w: 672, h: 960 }, // 7 x 10 inches
        
        // Other formats
        'B': { w: mmToPx(128), h: mmToPx(198) },
        'A': { w: mmToPx(111), h: mmToPx(178) },
        'DEMY': { w: mmToPx(135), h: mmToPx(216) },
        'ROYAL': { w: mmToPx(135), h: mmToPx(216) }
      };
      
      const size = paperSizes[paperSize] || paperSizes['A4'];
      return orientation === 'L' ? size.h : size.w;
    },
    
    canvasHeight() {
      const paperSize = this.appearance?.paper_size || 'A4';
      const orientation = this.appearance?.orientation || 'P';
      
      // Convert mm to pixels at 96 DPI (1mm = 3.78 pixels)
      const mmToPx = (mm) => Math.round(mm * 3.78);
      
      const paperSizes = {
        // A Series
        'A0': { w: mmToPx(841), h: mmToPx(1189) },
        'A1': { w: mmToPx(594), h: mmToPx(841) },
        'A2': { w: mmToPx(420), h: mmToPx(594) },
        'A3': { w: mmToPx(297), h: mmToPx(420) },
        'A4': { w: mmToPx(210), h: mmToPx(297) },
        'A5': { w: mmToPx(148), h: mmToPx(210) },
        'A6': { w: mmToPx(105), h: mmToPx(148) },
        'A7': { w: mmToPx(74), h: mmToPx(105) },
        'A8': { w: mmToPx(52), h: mmToPx(74) },
        'A9': { w: mmToPx(37), h: mmToPx(52) },
        'A10': { w: mmToPx(26), h: mmToPx(37) },
        
        // B Series
        'B0': { w: mmToPx(1414), h: mmToPx(1000) },
        'B1': { w: mmToPx(1000), h: mmToPx(707) },
        'B2': { w: mmToPx(707), h: mmToPx(500) },
        'B3': { w: mmToPx(500), h: mmToPx(353) },
        'B4': { w: mmToPx(353), h: mmToPx(250) },
        'B5': { w: mmToPx(250), h: mmToPx(176) },
        'B6': { w: mmToPx(176), h: mmToPx(125) },
        'B7': { w: mmToPx(125), h: mmToPx(88) },
        'B8': { w: mmToPx(88), h: mmToPx(62) },
        'B9': { w: mmToPx(62), h: mmToPx(44) },
        'B10': { w: mmToPx(44), h: mmToPx(31) },
        
        // C Series
        'C0': { w: mmToPx(1297), h: mmToPx(917) },
        'C1': { w: mmToPx(917), h: mmToPx(648) },
        'C2': { w: mmToPx(648), h: mmToPx(458) },
        'C3': { w: mmToPx(458), h: mmToPx(324) },
        'C4': { w: mmToPx(324), h: mmToPx(229) },
        'C5': { w: mmToPx(229), h: mmToPx(162) },
        'C6': { w: mmToPx(162), h: mmToPx(114) },
        'C7': { w: mmToPx(114), h: mmToPx(81) },
        'C8': { w: mmToPx(81), h: mmToPx(57) },
        'C9': { w: mmToPx(57), h: mmToPx(40) },
        'C10': { w: mmToPx(40), h: mmToPx(28) },
        
        // RA Series
        'RA0': { w: mmToPx(860), h: mmToPx(1220) },
        'RA1': { w: mmToPx(610), h: mmToPx(860) },
        'RA2': { w: mmToPx(430), h: mmToPx(610) },
        'RA3': { w: mmToPx(305), h: mmToPx(430) },
        'RA4': { w: mmToPx(215), h: mmToPx(305) },
        
        // SRA Series
        'SRA0': { w: mmToPx(900), h: mmToPx(1280) },
        'SRA1': { w: mmToPx(640), h: mmToPx(900) },
        'SRA2': { w: mmToPx(450), h: mmToPx(640) },
        'SRA3': { w: mmToPx(320), h: mmToPx(450) },
        'SRA4': { w: mmToPx(225), h: mmToPx(320) },
        
        // US/Imperial sizes
        'Letter': { w: 816, h: 1056 },
        'Legal': { w: 816, h: 1344 },
        'ledger': { w: 1056, h: 1632 },
        'Executive': { w: 672, h: 960 },
        
        // Other formats
        'B': { w: mmToPx(128), h: mmToPx(198) },
        'A': { w: mmToPx(111), h: mmToPx(178) },
        'DEMY': { w: mmToPx(135), h: mmToPx(216) },
        'ROYAL': { w: mmToPx(135), h: mmToPx(216) }
      };
      
      const size = paperSizes[paperSize] || paperSizes['A4'];
      return orientation === 'L' ? size.w : size.h;
    },

    canvasStyle() {
      return {
        width: Math.round(this.canvasWidth) + 'px',
        height: Math.round(this.canvasHeight) + 'px',
        position: 'relative', // This is crucial for absolute positioning of children
        backgroundColor: '#ffffff',
        border: '1px solid #ddd',
        margin: '20px auto',
        minHeight: '400px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden' // Prevent elements from going outside canvas
      };
    },

    canvasScale() {
      return 1; // No scaling for now
    },
    
    gridStyle() {
      return {
        backgroundImage: `
          linear-gradient(to right, #f0f0f0 1px, transparent 1px),
          linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)
        `,
        backgroundSize: `${this.gridSize}px ${this.gridSize}px`,
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none'
      };
    },
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
      this.isDragOver = true;
    },

    handleDragLeave(event) {
      if (this.$refs.pdfCanvas && !this.$refs.pdfCanvas.contains(event.relatedTarget)) {
        this.isDragOver = false;
      }
    },

    handleDrop(event) {
      event.preventDefault();
      this.isDragOver = false;
      
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
      if (!this.$refs.pdfCanvas) {
        console.error('Canvas element not found');
        return;
      }
      
      const canvasRect = this.$refs.pdfCanvas.getBoundingClientRect();
      
      // Calculate drop position relative to canvas
      const dropX = Math.round((event.clientX - canvasRect.left) / this.gridSize) * this.gridSize;
      const dropY = Math.round((event.clientY - canvasRect.top) / this.gridSize) * this.gridSize;

      const defaultWidth = this.getDefaultWidth(elementData.type);
      const defaultHeight = this.getDefaultHeight(elementData.type);

      // Ensure the position is within canvas bounds
      const constrainedX = Math.max(0, Math.min(dropX, this.canvasWidth - defaultWidth));
      const constrainedY = Math.max(0, Math.min(dropY, this.canvasHeight - defaultHeight));

      this.addElement(elementData, constrainedX, constrainedY);
    },

    addElement(elementData, x, y) {
      const newElement = {
        i: `element_${++this.elementCounter}`,
        x: x,
        y: y,
        w: elementData.w || this.getDefaultWidth(elementData.type),
        h: elementData.h || this.getDefaultHeight(elementData.type),
        type: elementData.type,
        z: 1,
        props: { ...elementData.defaultProps }
      };

      this.pdfLayout.push(newElement);
      this.selectedElement = newElement;
    },

    // Page Settings
    changePageSize(size) {
      this.pageSize = size;
      if (size === 'a4') {
        this.canvasWidth = this.orientation === 'portrait' ? 794 : 1123;
        this.canvasHeight = this.orientation === 'portrait' ? 1123 : 794;
      } else if (size === 'letter') {
        this.canvasWidth = this.orientation === 'portrait' ? 816 : 1056;
        this.canvasHeight = this.orientation === 'portrait' ? 1056 : 816;
      }
      
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
      const tempWidth = this.canvasWidth;
      this.canvasWidth = this.canvasHeight;
      this.canvasHeight = tempWidth;
      
      this.pdfLayout.forEach(element => {
        if (element.x + element.w > this.canvasWidth) {
          element.x = Math.max(0, this.canvasWidth - element.w);
        }
        if (element.y + element.h > this.canvasHeight) {
          element.y = Math.max(0, this.canvasHeight - element.h);
        }
      });
    },

    // Element Management
    selectElement(element) {
      this.selectedElement = element;
    },

    updateElement(elementId, updatedProps) {
      const element = this.pdfLayout.find(el => el.i === elementId);
      if (element) {
        Object.assign(element.props, updatedProps);
      }
    },

    deleteElement(elementId) {
      this.$confirm(
        'Are you sure you want to delete this element?',
        'Delete Element',
        {
          confirmButtonText: 'Delete',
          cancelButtonText: 'Cancel',
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

    deselectElement(event) {
      if (event.target === this.$refs.pdfCanvas || event.target.classList.contains('grid-background')) {
        this.selectedElement = null;
      }
    },

    // Drag Movement
    startDrag(event, element) {
      if (event.target.classList.contains('resize-handle')) {
        return;
      }
      
      this.selectElement(element);
      this.draggingElement = element.i;
      
      if (!this.$refs.pdfCanvas) {
        console.error('Canvas ref not found');
        return;
      }
      
      const canvasRect = this.$refs.pdfCanvas.getBoundingClientRect();
      
      const mouseScreenX = event.clientX - canvasRect.left;
      const mouseScreenY = event.clientY - canvasRect.top;
      
      this._dragStartPos = {
        x: mouseScreenX - element.x,
        y: mouseScreenY - element.y
      };

      const boundHandleDragMove = this.handleDragMove.bind(this);
      const boundHandleDragEnd = this.handleDragEnd.bind(this);
      
      document.addEventListener('mousemove', boundHandleDragMove);
      document.addEventListener('mouseup', boundHandleDragEnd);
      
      this._boundHandleDragMove = boundHandleDragMove;
      this._boundHandleDragEnd = boundHandleDragEnd;
      
      event.preventDefault();
    },

    handleDragMove(event) {
      if (this.draggingElement !== null && this.$refs.pdfCanvas) {
        const elementIndex = this.pdfLayout.findIndex(el => el.i === this.draggingElement);
        
        if (elementIndex !== -1) {
          const element = this.pdfLayout[elementIndex];
          const canvasRect = this.$refs.pdfCanvas.getBoundingClientRect();
          
          const mouseScreenX = event.clientX - canvasRect.left;
          const mouseScreenY = event.clientY - canvasRect.top;
          
          let newX = (mouseScreenX - this._dragStartPos.x);
          let newY = (mouseScreenY - this._dragStartPos.y);
          
          newX = Math.round(newX / this.gridSize) * this.gridSize;
          newY = Math.round(newY / this.gridSize) * this.gridSize;
          
          newX = Math.max(0, Math.min(newX, this.canvasWidth - element.w));
          newY = Math.max(0, Math.min(newY, this.canvasHeight - element.h));
          
          // Check for overlap before updating position
          const testPosition = {
            x: newX,
            y: newY,
            w: element.w,
            h: element.h
          };

          if (!this.wouldOverlap(testPosition, element.i)) {
            element.x = newX;
            element.y = newY;
          }
        }
      }
    },

    handleDragEnd() {
      this.draggingElement = null;
      this.resizing = false;
      this.resizeHandle = null;
      
      if (this._boundHandleDragMove) {
        document.removeEventListener('mousemove', this._boundHandleDragMove);
        this._boundHandleDragMove = null;
      }
      if (this._boundHandleDragEnd) {
        document.removeEventListener('mouseup', this._boundHandleDragEnd);
        this._boundHandleDragEnd = null;
      }
    },

    // Resize handlers
    startResize(event, element, handle) {
      this.resizing = true;
      this.resizeHandle = handle;
      this.selectElement(element);
      
      if (!this.$refs.pdfCanvas) {
        console.error('Canvas ref not found for resize');
        return;
      }
      
      const canvasRect = this.$refs.pdfCanvas.getBoundingClientRect();
      
      this._resizeStartPos = {
        x: event.clientX,
        y: event.clientY,
        elementX: element.x,
        elementY: element.y,
        elementW: element.w,
        elementH: element.h
      };

      const boundHandleResize = this.handleResize.bind(this);
      const boundHandleDragEnd = this.handleDragEnd.bind(this);
      
      document.addEventListener('mousemove', boundHandleResize);
      document.addEventListener('mouseup', boundHandleDragEnd);
      
      this._boundHandleResize = boundHandleResize;
      this._boundHandleDragEnd = boundHandleDragEnd;
      
      event.preventDefault();
      event.stopPropagation();
    },

    handleResize(event) {
      if (!this.resizing || !this.selectedElement) return;

      const element = this.selectedElement;
      
      const deltaX = event.clientX - this._resizeStartPos.x;
      const deltaY = event.clientY - this._resizeStartPos.y;

      let newX = this._resizeStartPos.elementX;
      let newY = this._resizeStartPos.elementY;
      let newW = this._resizeStartPos.elementW;
      let newH = this._resizeStartPos.elementH;

      // Handle different resize handles
      if (this.resizeHandle.includes('n')) {
        newY = this._resizeStartPos.elementY + deltaY;
        newH = this._resizeStartPos.elementH - deltaY;
      }
      if (this.resizeHandle.includes('s')) {
        newH = this._resizeStartPos.elementH + deltaY;
      }
      if (this.resizeHandle.includes('w')) {
        newX = this._resizeStartPos.elementX + deltaX;
        newW = this._resizeStartPos.elementW - deltaX;
      }
      if (this.resizeHandle.includes('e')) {
        newW = this._resizeStartPos.elementW + deltaX;
      }

      // Constrain to minimum size
      newW = Math.max(20, newW);
      newH = Math.max(20, newH);

      // Constrain to canvas bounds
      newX = Math.max(0, Math.min(newX, this.canvasWidth - newW));
      newY = Math.max(0, Math.min(newY, this.canvasHeight - newH));
      newW = Math.min(newW, this.canvasWidth - newX);
      newH = Math.min(newH, this.canvasHeight - newY);

      // Snap to grid
      newX = Math.round(newX / this.gridSize) * this.gridSize;
      newY = Math.round(newY / this.gridSize) * this.gridSize;
      newW = Math.round(newW / this.gridSize) * this.gridSize;
      newH = Math.round(newH / this.gridSize) * this.gridSize;

      // Check for overlap with other elements
      const testPosition = {
        x: newX,
        y: newY,
        w: newW,
        h: newH
      };
      
      // Only update if no overlap with other elements
      if (!this.wouldOverlap(testPosition, element.i)) {
        element.x = newX;
        element.y = newY;
        element.w = newW;
        element.h = newH;
      }
    },

    // Helper methods
    getElementStyle(item) {
      return {
        position: 'absolute',
        left: item.x + 'px',
        top: item.y + 'px',
        width: item.w + 'px',
        height: item.h + 'px',
        zIndex: item.z || 1,
        cursor: 'move',
        border: this.selectedElement && this.selectedElement.i === item.i ? '2px solid #409EFF' : '1px dashed transparent',
        boxSizing: 'border-box'
      };
    },

    getElementContentStyle(element) {
      return {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none'
      };
    },

    textStyle(element) {
      const textAlign = element.props.textAlign || 'left';
      const verticalAlign = element.props.verticalAlign || 'middle';
      
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
        fontSize: (element.props.fontSize || 14) + 'px',
        fontWeight: element.props.fontWeight || 'normal',
        fontStyle: element.props.fontStyle || 'normal',
        color: element.props.color || '#000000',
        backgroundColor: element.props.backgroundColor || 'transparent',
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

    imagePreviewStyle(element) {
      return {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      };
    },

    imageElementStyle(element) {
      const styles = [
        'width: 100%',
        'height: 100%',
        'max-width: 100%',
        'max-height: 100%',
        `object-fit: ${element.props.objectFit || 'contain'}`,
        'display: block'
      ];
      
      if (element.props.borderRadius > 0) {
        styles.push(`border-radius: ${element.props.borderRadius}px`);
      }
      
      if (element.props.borderWidth > 0 && element.props.borderStyle !== 'none') {
        styles.push(`border: ${element.props.borderWidth}px ${element.props.borderStyle} ${element.props.borderColor}`);
        styles.push('box-sizing: border-box');
      }
      
      return styles.join('; ');
    },

    fieldStyle(element) {
      return {
        fontSize: (element.props.fontSize || 12) + 'px',
        lineHeight: '1.2',
        wordWrap: 'break-word',
        padding: '4px'
      };
    },

    lineStyle(element) {
      return {
        height: (element.props.thickness || 1) + 'px',
        backgroundColor: element.props.color || '#000000',
        width: '100%'
      };
    },

    getFieldLabel(fieldName) {
      const field = this.formFields.find(f => f.name === fieldName);
      return field ? (field.label || field.name) : fieldName;
    },

    getFieldValue(fieldName) {
      return this.formData[fieldName] || '';
    },

    handleCanvasClick(event) {
      if (event.target === event.currentTarget || event.target.classList.contains('grid-background')) {
        this.selectedElement = null;
      }
    },

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

    findNonOverlappingPosition(preferredX, preferredY, width, height) {
      // Ensure the position is within canvas bounds
      preferredX = Math.max(0, Math.min(preferredX, this.canvasWidth - width));
      preferredY = Math.max(0, Math.min(preferredY, this.canvasHeight - height));

      if (!this.isPositionOccupied(preferredX, preferredY, width, height)) {
        return { x: preferredX, y: preferredY };
      }

      // Try to find a non-overlapping position by spiraling outward
      const maxAttempts = 100;
      const step = this.gridSize;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const radius = attempt * step;
        
        // Try positions in a spiral pattern
        for (let angle = 0; angle < 360; angle += 45) {
          const radians = angle * Math.PI / 180;
          let testX = preferredX + Math.round(radius * Math.cos(radians) / step) * step;
          let testY = preferredY + Math.round(radius * Math.sin(radians) / step) * step;
          
          // Ensure the position is within canvas bounds
          testX = Math.max(0, Math.min(testX, this.canvasWidth - width));
          testY = Math.max(0, Math.min(testY, this.canvasHeight - height));

          if (!this.isPositionOccupied(testX, testY, width, height)) {
            return { x: testX, y: testY };
          }
        }
      }

      return { x: preferredX, y: preferredY };
    },

    isPositionOccupied(x, y, width, height) {
      return this.pdfLayout.some(element => {
        return !(x >= element.x + element.w || 
                 x + width <= element.x || 
                 y >= element.y + element.h || 
                 y + height <= element.y);
      });
    },

    savePdf() {
      // Normalize data before saving
      const normalizedLayout = this.pdfLayout.map(element => ({
        ...element,
        x: parseInt(element.x) || 0,
        y: parseInt(element.y) || 0,
        w: parseInt(element.w) || 150,
        h: parseInt(element.h) || 40,
        z: parseInt(element.z) || 1,
        props: {
          ...element.props,
          fontSize: parseInt(element.props.fontSize) || 14
        }
      }));
      
      this.pages[this.currentPageIndex].layout = normalizedLayout;
      
      const templateData = {
        pages: this.pages,
        appearance: this.appearance
      };
      
      this.$emit('save', templateData);
    },

    getElementPreview(item) {
      switch (item.type) {
        case 'text':
          return item.props.content || 'Text Element';
        case 'image':
          return '[Image]';
        case 'line':
          return '—————';
        default:
          return item.type;
      }
    },

    updateElementProps() {
      // Force reactivity by updating the element reference
      if (this.selectedElement) {
        const elementIndex = this.pdfLayout.findIndex(el => el.i === this.selectedElement.i);
        if (elementIndex !== -1) {
          // Trigger reactivity by replacing the element
          this.$set(this.pdfLayout, elementIndex, { ...this.selectedElement });
        }
      }
      this.$forceUpdate();
    },

    updateElementPosition(elementId, field, value) {
      console.log('PdfBuilder: Updating element position:', elementId, field, value);
      const element = this.pdfLayout.find(el => el.i === elementId);
      if (element) {
        const oldValue = element[field];
        element[field] = parseInt(value);
        console.log('Position updated from', oldValue, 'to', element[field]);
        this.$forceUpdate(); // Force reactivity update
      }
    },

    updateElementSize(elementId, field, value) {
      console.log('PdfBuilder: Updating element size:', elementId, field, value);
      const element = this.pdfLayout.find(el => el.i === elementId);
      if (element) {
        const oldValue = element[field];
        element[field] = parseInt(value);
        console.log('Size updated from', oldValue, 'to', element[field]);
        this.$forceUpdate(); // Force reactivity update
      }
    },

    adjustElementsToCanvas() {
      // Adjust elements that are outside the new canvas bounds
      this.pdfLayout.forEach(element => {
        if (element.x + element.w > this.canvasWidth) {
          element.x = Math.max(0, this.canvasWidth - element.w);
        }
        if (element.y + element.h > this.canvasHeight) {
          element.y = Math.max(0, this.canvasHeight - element.h);
        }
        
        // Ensure elements don't exceed canvas bounds
        if (element.w > this.canvasWidth) {
          element.w = this.canvasWidth - 20;
        }
        if (element.h > this.canvasHeight) {
          element.h = this.canvasHeight - 20;
        }
      });
    },

    // Helper method to check if a position would overlap with other elements
    wouldOverlap(position, currentElementId) {
      return this.pdfLayout.some(element => {
        // Skip checking against itself
        if (element.i === currentElementId) {
          return false;
        }
        
        // Check for overlap using proper boundary detection
        return !(
          position.x >= element.x + element.w || 
          position.x + position.w <= element.x || 
          position.y >= element.y + element.h || 
          position.y + position.h <= element.y
        );
      });
    },

    // Ensure elements stay within canvas bounds
    constrainElementsToCanvas() {
      this.pdfLayout.forEach(element => {
        // Ensure element is within canvas bounds
        if (element.x + element.w > this.canvasWidth) {
          if (element.w > this.canvasWidth) {
            element.w = this.canvasWidth - 20;
            element.x = 0;
          } else {
            element.x = this.canvasWidth - element.w;
          }
        }
        
        if (element.y + element.h > this.canvasHeight) {
          if (element.h > this.canvasHeight) {
            element.h = this.canvasHeight - 20;
            element.y = 0;
          } else {
            element.y = this.canvasHeight - element.h;
          }
        }
        
        // Ensure element is not negative
        element.x = Math.max(0, element.x);
        element.y = Math.max(0, element.y);
      });
    },
    toggleSettingsSidebar() {
      this.settingsSidebarVisible = !this.settingsSidebarVisible;
      
      // Toggle the settings sidebar with class ff_settings_sidebar ff_layout_section_sidebar
      const settingsSidebar = document.querySelector('.ff_settings_sidebar.ff_layout_section_sidebar');
      if (settingsSidebar) {
        if (this.settingsSidebarVisible) {
          settingsSidebar.style.display = 'block';
        } else {
          settingsSidebar.style.display = 'none';
        }
      }
      
      // Also toggle the sidebar wrapper if it exists
      const sidebarWrapper = document.querySelector('.ff_settings_sidebar_wrap');
      if (sidebarWrapper) {
        if (this.settingsSidebarVisible) {
          sidebarWrapper.style.display = 'block';
        } else {
          sidebarWrapper.style.display = 'none';
        }
      }
    },
    openMediaLibrary() {
      if (!this.selectedElement || this.selectedElement.type !== 'image') {
        return;
      }
      
      const that = this;
      const send_attachment_bkp = wp.media.editor.send.attachment;
      
      wp.media.editor.send.attachment = function (props, attachment) {
        that.selectedElement.props.src = attachment.url;
        if (!that.selectedElement.props.alt) {
          that.selectedElement.props.alt = attachment.alt || attachment.filename || 'Image';
        }
        that.updateElementProps();
        wp.media.editor.send.attachment = send_attachment_bkp;
      };
      
      wp.media.editor.open();
    },
    removeImage() {
      if (this.selectedElement && this.selectedElement.type === 'image') {
        this.selectedElement.props.src = '';
        this.selectedElement.props.alt = 'Image';
        this.updateElementProps();
      }
    }
  },
  watch: {
    templateData: {
      handler(newTemplateData) {
        console.log('Loading template data:', newTemplateData);
        
        if (newTemplateData && newTemplateData.pages && newTemplateData.pages.length > 0) {
          this.pages = JSON.parse(JSON.stringify(newTemplateData.pages));
          
          const layout = newTemplateData.pages[0].layout || [];
          console.log('Raw layout from template:', layout);
          
          this.pdfLayout = layout.map(element => {
            const normalized = {
              ...element,
              x: parseInt(element.x) || 0,
              y: parseInt(element.y) || 0,
              w: parseInt(element.w) || 150,
              h: parseInt(element.h) || 40,
              z: parseInt(element.z) || 1,
              props: {
                ...element.props,
                fontSize: parseInt(element.props.fontSize) || 14
              }
            };
            console.log('Normalized element:', normalized);
            return normalized;
          });
          
          console.log('Final pdfLayout:', this.pdfLayout);
          
          if (this.pdfLayout.length > 0) {
            const maxId = Math.max(...this.pdfLayout.map(el => {
              const match = el.i.match(/element_(\d+)/);
              return match ? parseInt(match[1]) : 0;
            }));
            this.elementCounter = maxId;
          }
        }
      },
      immediate: true,
      deep: true
    },
    
    appearance: {
      handler(newAppearance, oldAppearance) {
        this.$nextTick(() => {
          this.constrainElementsToCanvas();
          this.$forceUpdate();
        });
      },
      deep: true,
      immediate: true
    },
    
    canvasWidth() {
      this.$nextTick(() => {
        this.constrainElementsToCanvas();
      });
    },
    
    canvasHeight() {
      this.$nextTick(() => {
        this.constrainElementsToCanvas();
      });
    }
  },
  mounted() {
    // Load template data on mount if available
    // if (this.templateData && this.templateData.pages && this.templateData.pages.length > 0) {
    //   this.pages = JSON.parse(JSON.stringify(this.templateData.pages));
    //   this.pdfLayout = JSON.parse(JSON.stringify(this.templateData.pages[0].layout || []));
    //  
    //   // Update element counter
    //   if (this.pdfLayout.length > 0) {
    //     const maxId = Math.max(...this.pdfLayout.map(el => {
    //       const match = el.i.match(/element_(\d+)/);
    //       return match ? parseInt(match[1]) : 0;
    //     }));
    //     this.elementCounter = maxId;
    //   }
    // }
      console.log(this.pdfLayout)
    
    this.handleKeyboardDelete = (event) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (this.selectedElement && !event.target.matches('input, textarea')) {
          event.preventDefault();
          this.deleteElement(this.selectedElement.i);
        }
      }
    };

    document.addEventListener('keydown', this.handleKeyboardDelete);
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeyboardDelete);
    if (this._boundHandleDragMove) {
      document.removeEventListener('mousemove', this._boundHandleDragMove);
    }
    if (this._boundHandleDragEnd) {
      document.removeEventListener('mouseup', this._boundHandleDragEnd);
    }
  }
};
</script>

<style scoped>
.pdf-builder {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.pdf-toolbar {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.pdf-builder-content {
  display: flex;
  flex: 1;
  height: calc(100vh - 120px);
  overflow: hidden;
}

.pdf-builder-content.sidebar-hidden .canvas-container {
  width: 100%;
}

.element-palette {
  width: 250px;
  border-right: 1px solid #e4e7ed;
  padding: 15px;
  overflow-y: auto;
  transition: width 0.3s ease;
}

.element-palette.hidden {
  width: 0;
  padding: 0;
  overflow: hidden;
  border: none;
}

.canvas-container {
  flex: 1;
  overflow: auto;
  padding: 20px;
  display: flex;
  justify-content: flex-start; /* Allow scrolling to leftmost */
  align-items: flex-start;
  min-height: 0;
}

.canvas-wrapper {
  display: block; /* Change from flex to block */
  width: 100%;
  min-width: max-content; /* Ensure wrapper is at least as wide as canvas */
  text-align: center; /* Center the canvas horizontally */
}

.pdf-canvas {
  display: table;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #ffffff;
  border: 1px solid #ddd;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.pdf-canvas.drag-over {
  border-color: #409eff;
  background: #ecf5ff;
}

.grid-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  /* The background will be set by the gridStyle computed property */
}

.canvas-element {
  display: table-cell;
  position: absolute !important;
  border: 1px solid transparent;
  cursor: move;
  transition: border-color 0.2s ease;
  z-index: 1;
  vertical-align: top;
  text-align: left;
}

.canvas-element:hover {
  border-color: #409eff;
}

.canvas-element.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
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
  width: 8px;
  height: 8px;
  background: #409eff;
  border: 1px solid #fff;
  pointer-events: all;
  border-radius: 1px;
}

.resize-handle-nw {
  top: 0;
  left: 0;
  cursor: nw-resize;
}

.resize-handle-ne {
  top: 0;
  right: 0;
  cursor: ne-resize;
}

.resize-handle-sw {
  bottom: 0;
  left: 0;
  cursor: sw-resize;
}

.resize-handle-se {
  bottom: 0;
  right: 0;
  cursor: se-resize;
}

.resize-handle-n {
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  cursor: n-resize;
}

.resize-handle-s {
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  cursor: s-resize;
}

.resize-handle-w {
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  cursor: w-resize;
}

.resize-handle-e {
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  cursor: e-resize;
}

.properties-panel {
  width: 300px;
  border-left: 1px solid #e4e7ed;
  background: #fafafa;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #e4e7ed;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.panel-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
}

.no-selection {
  text-align: center;
  color: #909399;
  font-style: italic;
  margin-top: 50px;
}

.canvas-info {
  font-size: 12px;
  color: #666;
}

.element-content {
  display: table;
  width: 100%;
  height: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}

.text-element {
  display: table-cell;
  vertical-align: middle;
  text-align: left;
  padding: 4px;
  word-wrap: break-word;
  overflow: hidden;
}

.field-element {
  display: table-cell;
  vertical-align: top;
  padding: 4px;
  word-wrap: break-word;
  overflow: hidden;
}

.field-label {
  font-weight: bold;
  margin-bottom: 2px;
}

.field-value {
  color: #666;
}

.image-element {
  display: table-cell;
  vertical-align: middle;
  text-align: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.image-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-style: italic;
  background-color: #f9f9f9;
  border: 1px dashed #ccc;
}

.image-placeholder i {
  font-size: 24px;
  margin-bottom: 8px;
}

.image-upload-section {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.image-preview-small {
  margin-top: 10px;
  text-align: center;
}

.image-preview-small img {
  border: 1px solid #ddd;
  border-radius: 4px;
}

.line-element {
  display: table-cell;
  vertical-align: middle;
  width: 100%;
}

.element-properties .el-form-item {
  margin-bottom: 15px;
}

.element-properties label {
  font-size: 10px;
  color: #999;
  display: block;
  text-align: center;
  margin-top: 2px;
}
</style>
