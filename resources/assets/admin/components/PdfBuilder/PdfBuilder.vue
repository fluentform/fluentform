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

                <!-- Header/Footer Settings -->
                <div v-if="pages && pages.length > 0" class="header-footer-settings">
                    <h4>{{ $t('Page Layout') }}</h4>

                    <!-- Header Settings -->
                    <div class="setting-group">
                        <el-checkbox :value="headerEnabled" @input="updateGlobalHeaderEnabled">
                            {{ $t('Enable Header') }}
                        </el-checkbox>
                    </div>

                    <!-- Footer Settings -->
                    <div class="setting-group">
                        <el-checkbox :value="footerEnabled" @input="updateGlobalFooterEnabled">
                            {{ $t('Enable Footer') }}
                        </el-checkbox>
                    </div>

                    <!-- Page Actions -->
                    <div v-if="pages && pages.length > 0" class="page-actions">
                        <h4>{{ $t('Pages') }} ({{ pages.length }})</h4>

                        <!-- Page Navigation -->
                        <div class="page-navigation">
                            <el-select v-model="currentPageIndex" size="mini" @change="switchPage">
                                <el-option
                                    v-for="(page, index) in pages"
                                    :key="page.id"
                                    :label="`Page ${index + 1}`"
                                    :value="index"
                                />
                            </el-select>
                        </div>

                        <!-- Page Actions -->
                        <el-button
                            type="success"
                            size="mini"
                            icon="el-icon-plus"
                            @click="addNewPage"
                        >
                            {{ $t('Add Page') }}
                        </el-button>

                        <el-button
                            type="danger"
                            size="mini"
                            icon="el-icon-delete"
                            @click="confirmDeleteCurrentPage"
                            :disabled="pages.length <= 1"
                        >
                            {{ $t('Delete Page') }}
                        </el-button>

                        <el-button
                            type="primary"
                            size="mini"
                            icon="el-icon-refresh"
                            @click="clearCurrentPage"
                        >
                            {{ $t('Clear Page') }}
                        </el-button>
                    </div>
                </div>
            </div>

            <!-- Canvas Area -->
            <div class="canvas-container">
                <!-- Render Each Page Separately -->
                <div v-for="(page, pageIndex) in pages"
                     :key="page.id"
                     class="page-wrapper"
                     :class="{ 'active-page': pageIndex === currentPageIndex }"
                     :style="getPageWrapperStyle(pageIndex)">

                    <!-- Page Header -->
                    <div class="page-header">
                        <span class="page-number">Page {{ pageIndex + 1 }}</span>
                        <el-button v-if="pageIndex === currentPageIndex"
                                   size="mini"
                                   type="primary"
                                   @click="focusPage(pageIndex)">
                            Active
                        </el-button>
                        <el-button v-else
                                   size="mini"
                                   @click="focusPage(pageIndex)">
                            Edit
                        </el-button>
                    </div>

                    <div class="canvas-wrapper" :style="`width: ${canvasWidth}px; margin: 20px;`">
                        <!-- Global Header Section -->
                        <div v-if="globalHeaderSettings.enabled"
                             class="pdf-header no-drop-zone"
                             :class="{
                   selected: selectedElement && selectedElement.type === 'header' && pageIndex === currentPageIndex,
                   'other-page': pageIndex !== currentPageIndex
                 }"
                             :style="getGlobalHeaderStyle()"
                             @click.stop="selectHeaderFooter('header')"
                             @dragover.prevent.stop="handleHeaderFooterDragOver"
                             @drop.prevent.stop="handleHeaderFooterDrop">
                            <div class="header-content" :style="getGlobalHeaderContentStyle()">
                                {{ globalHeaderSettings.content || 'Click to edit header' }}
                            </div>
                        </div>

                        <!-- Table-based Canvas (Background Grid) for this page -->
                        <table
                            :ref="`pdfCanvas_${pageIndex}`"
                            class="pdf-canvas-table background-grid"
                            :class="{ 'active-canvas': pageIndex === currentPageIndex }"
                            :style="canvasTableStyle"
                            @click="handleCanvasClick($event, pageIndex)"
                        >
                            <tbody>
                            <tr v-for="row in canvasRows" :key="row" class="canvas-row">
                                <td v-for="col in canvasCols" :key="col"
                                    class="canvas-cell background-cell"
                                    :style="canvasCellStyle"
                                    :data-row="row"
                                    :data-col="col"
                                    :data-page="pageIndex">
                                    <!-- Background grid cell (no content, just visual grid) -->
                                </td>
                            </tr>
                            </tbody>
                        </table>

                        <!-- Interactive Layer for Elements and Drag/Drop for this page -->
                        <div
                            class="interactive-canvas-layer"
                            :class="{ 'active-layer': pageIndex === currentPageIndex }"
                            :style="interactiveLayerStyle"
                            @click="handleCanvasClickForPage($event, pageIndex)"
                            @drop="handleCanvasDropForPage($event, pageIndex)"
                            @dragover.prevent="handleCanvasDragOver"
                            @dragenter.prevent="handleCanvasDragEnter"
                            @dragleave.prevent="handleCanvasDragLeave"
                        >
                            <!-- Main Canvas Elements for this page -->
                            <div
                                v-for="element in getPageElements(pageIndex)"
                                :key="`${element.i}-page-${pageIndex}`"
                                class="canvas-element"
                                :class="{
                  'selected': selectedElement && selectedElement.i === element.i && pageIndex === currentPageIndex,
                  'dragging': draggingElement === element.i && pageIndex === currentPageIndex,
                  'other-page-element': pageIndex !== currentPageIndex
                }"
                                :style="getElementStyle(element)"
                                @click.stop="selectElementForPage(element, pageIndex)"
                            >
                                <!-- Element Content -->
                                <div class="element-content" :style="getElementContentStyle(element)">
                                    <!-- Text Element -->
                                    <div v-if="element.type === 'text'" class="text-element"
                                         :style="textStyle(element)">
                                        {{ element.props.content || 'Sample Text' }}
                                    </div>

                                    <!-- Field Element -->
                                    <div v-else-if="element.type === 'field'" class="field-element"
                                         :style="fieldStyle(element)">
                                        {{ getFieldLabel(element.props.fieldName) }}:
                                        {{ getFieldValue(element.props.fieldName) }}
                                    </div>

                                    <!-- Image Element -->
                                    <img v-else-if="element.type === 'image'"
                                         :src="element.props.src || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg=='"
                                         :alt="element.props.alt || 'Image'"
                                         :style="imageElementStyle(element)"/>

                                    <!-- Line Element -->
                                    <div v-else-if="element.type === 'line'" class="line-element"
                                         :style="lineStyle(element)"></div>

                                    <!-- Table Container Elements -->
                                    <table v-else-if="element.type === 'table'"
                                           class="nested-table-element interactive-table"
                                           :style="nestedTableStyle(element)"
                                           @click.stop>
                                        <thead v-if="element.props.showHeaders">
                                        <tr>
                                            <th v-for="col in element.props.cols" :key="'header-' + col"
                                                :style="nestedTableHeaderStyle(element)">
                                                Header {{ col }}
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        <tr v-for="row in element.props.rows" :key="'row-' + row">
                                            <td v-for="col in element.props.cols"
                                                :key="'cell-' + row + '-' + col"
                                                v-if="!isCellHidden(element, row, col)"
                                                :style="getTableCellStyle(element, row, col)"
                                                :colspan="getCellColspan(element, row, col)"
                                                :rowspan="getCellRowspan(element, row, col)"
                                                :data-cell="`${row}-${col}`"
                                                :data-table-id="element.i"
                                                class="table-cell-container table-cell-canvas interactive-cell"
                                                :class="{
                            'cell-drag-over': isDragOverCell === `${element.i}-${row}-${col}`,
                            'cell-selected': selectedTableCell === `${element.i}-${row}-${col}`
                          }"
                                                @click.stop="selectTableCell(element, row, col)"
                                                @dblclick.stop="editTableCell(element, row, col)"
                                                @drop.stop="handleTableCellDrop($event, element, row, col)"
                                                @dragover.stop.prevent="handleTableCellDragOver($event, element, row, col)"
                                                @dragenter.stop.prevent="handleTableCellDragEnter($event, element, row, col)"
                                                @dragleave.stop.prevent="handleTableCellDragLeave($event, element, row, col)">

                                                <!-- Cell Canvas Area (Container-like) -->
                                                <div class="cell-canvas-area cell-fields-list"
                                                     :style="getCellCanvasStyle(element)"
                                                     @click.stop="handleCellCanvasClick($event, element, row, col)">

                                                    <!-- Cell Elements in list format (like container fields) -->
                                                    <div
                                                        v-for="(cellElement, cellIndex) in getCellElements(element, row, col)"
                                                        :key="`${element.i}-${row}-${col}-${cellElement.i || cellElement.uniqElKey}`"
                                                        class="cell-element-item"
                                                        :class="{
                                 'selected': selectedElement && (selectedElement.i === cellElement.i || selectedElement.uniqElKey === cellElement.uniqElKey),
                                 'dragging': draggingElement === cellElement.i
                               }"
                                                        @click.stop="selectElement(cellElement)"
                                                        draggable="true"
                                                        @dragstart="handleCellElementDragStart($event, cellElement, element, row, col, cellIndex)"
                                                        @dragend="handleCellElementDragEnd">

                                                        <!-- Element Actions (like container fields) -->
                                                        <div class="cell-element-actions">
                                                            <div class="action-item drag-handle" title="Drag to move">
                                                                <i class="el-icon-rank"></i>
                                                            </div>
                                                            <div class="action-item edit-btn"
                                                                 @click.stop="selectElement(cellElement)" title="Edit">
                                                                <i class="el-icon-edit"></i>
                                                            </div>
                                                            <div class="action-item delete-btn"
                                                                 @click.stop="deleteCellElement(cellElement, element, row, col, cellIndex)"
                                                                 title="Delete">
                                                                <i class="el-icon-delete"></i>
                                                            </div>
                                                        </div>

                                                        <!-- Cell Element Content -->
                                                        <div class="cell-element-content">
                                                            <div v-if="cellElement.type === 'text'"
                                                                 class="text-element-preview">
                                                                <strong>Text:</strong>
                                                                {{ cellElement.props.content || 'Sample Text' }}
                                                            </div>
                                                            <div v-else-if="cellElement.type === 'field'"
                                                                 class="field-element-preview">
                                                                <strong>Field:</strong>
                                                                {{ getFieldLabel(cellElement.props.fieldName) }}
                                                            </div>
                                                            <div v-else-if="cellElement.type === 'image'"
                                                                 class="image-element-preview">
                                                                <strong>Image:</strong>
                                                                {{ cellElement.props.alt || 'Image Element' }}
                                                            </div>
                                                            <div v-else-if="cellElement.type === 'line'"
                                                                 class="line-element-preview">
                                                                <strong>Line:</strong> Horizontal Line
                                                            </div>
                                                            <div v-else class="element-preview">
                                                                <strong>{{ cellElement.type }}:</strong> Element
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <!-- Cell Placeholder when empty -->
                                                    <div v-if="getCellElements(element, row, col).length === 0"
                                                         class="cell-placeholder">
                                                        <i class="el-icon-plus"></i>
                                                        <span>Drop elements here</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <!-- Drag Handle Icon -->
                                <div
                                    class="element-drag-handle"
                                    @mousedown="startDrag($event, element)"
                                    title="Drag to move element"
                                >
                                    <i class="el-icon-rank"></i>
                                </div>

                                <!-- Resize handles for selected element -->
                                <div v-if="selectedElement && selectedElement.i === element.i" class="resize-handles">
                                    <div class="resize-handle resize-handle-nw"
                                         @mousedown.stop="startResize($event, element, 'nw')"></div>
                                    <div class="resize-handle resize-handle-ne"
                                         @mousedown.stop="startResize($event, element, 'ne')"></div>
                                    <div class="resize-handle resize-handle-sw"
                                         @mousedown.stop="startResize($event, element, 'sw')"></div>
                                    <div class="resize-handle resize-handle-se"
                                         @mousedown.stop="startResize($event, element, 'se')"></div>
                                    <div class="resize-handle resize-handle-n"
                                         @mousedown.stop="startResize($event, element, 'n')"></div>
                                    <div class="resize-handle resize-handle-s"
                                         @mousedown.stop="startResize($event, element, 's')"></div>
                                    <div class="resize-handle resize-handle-w"
                                         @mousedown.stop="startResize($event, element, 'w')"></div>
                                    <div class="resize-handle resize-handle-e"
                                         @mousedown.stop="startResize($event, element, 'e')"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Global Footer Section -->
                        <div v-if="globalFooterSettings.enabled"
                             class="pdf-footer no-drop-zone"
                             :class="{
                   selected: selectedElement && selectedElement.type === 'footer' && pageIndex === currentPageIndex,
                   'other-page': pageIndex !== currentPageIndex
                 }"
                             :style="getGlobalFooterStyle()"
                             @click.stop="selectHeaderFooter('footer')"
                             @dragover.prevent.stop="handleHeaderFooterDragOver"
                             @drop.prevent.stop="handleHeaderFooterDrop">
                            <div class="footer-content" :style="getGlobalFooterContentStyle()">
                                {{ globalFooterSettings.content || 'Click to edit footer' }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Properties Panel (only show when element selected) -->
            <div v-if="selectedElement" class="properties-panel">
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
                        <!-- Header/Footer Properties -->
                        <div v-if="selectedElement.isGlobal" class="header-footer-properties">
                            <h4>{{
                                    selectedElement.type === 'header' ? $t('Header Settings') : $t('Footer Settings')
                                }}</h4>

                            <el-form label-position="top" size="small">
                                <el-form-item :label="$t('Content')">
                                    <input-popover
                                        :value="getHeaderFooterProperty('content')"
                                        @input="updateHeaderFooterProperty('content', $event)"
                                        fieldType="textarea"
                                        :rows="3"
                                        :data="editorShortcodes"
                                        :placeholder="$t('Enter header/footer content or select field')"
                                    />
                                </el-form-item>

                                <el-form-item :label="$t('Height')">
                                    <el-input-number
                                        :value="getHeaderFooterProperty('height')"
                                        @input="updateHeaderFooterProperty('height', $event)"
                                        :min="20"
                                        :max="200"
                                        size="mini"
                                    />
                                </el-form-item>

                                <el-form-item :label="$t('Font Size')">
                                    <el-input-number
                                        :value="getHeaderFooterProperty('fontSize')"
                                        @input="updateHeaderFooterProperty('fontSize', $event)"
                                        :min="8"
                                        :max="24"
                                        size="mini"
                                    />
                                </el-form-item>

                                <el-form-item :label="$t('Text Align')">
                                    <el-select
                                        :value="getHeaderFooterProperty('textAlign')"
                                        @input="updateHeaderFooterProperty('textAlign', $event)"
                                        size="mini">
                                        <el-option label="Left" value="left"></el-option>
                                        <el-option label="Center" value="center"></el-option>
                                        <el-option label="Right" value="right"></el-option>
                                    </el-select>
                                </el-form-item>

                                <el-form-item :label="$t('Text Color')">
                                    <el-color-picker
                                        :value="getHeaderFooterProperty('color')"
                                        @change="updateHeaderFooterProperty('color', $event)"
                                    />
                                </el-form-item>

                                <el-form-item :label="$t('Background Color')">
                                    <el-color-picker
                                        :value="getHeaderFooterProperty('backgroundColor')"
                                        @change="updateHeaderFooterProperty('backgroundColor', $event)"
                                    />
                                </el-form-item>
                            </el-form>
                        </div>

                        <!-- Regular Element Properties -->
                        <el-form v-else label-position="top" size="small">
                            <el-form-item :label="$t('Position')">
                                <el-row :gutter="10">
                                    <el-col :span="12">
                                        <el-input-number
                                            v-model="selectedElement.x"
                                            :min="0"
                                            :max="maxElementX"
                                            :step="0.1"
                                            :precision="1"
                                            size="mini"
                                            controls-position="right"
                                            @change="updateElementPosition"
                                        />
                                        <label>X (%)</label>
                                    </el-col>
                                    <el-col :span="12">
                                        <el-input-number
                                            v-model="selectedElement.y"
                                            :min="0"
                                            :max="maxElementY"
                                            :step="0.1"
                                            :precision="1"
                                            size="mini"
                                            controls-position="right"
                                            @change="updateElementPosition"
                                        />
                                        <label>Y (%)</label>
                                    </el-col>
                                </el-row>
                            </el-form-item>

                            <el-form-item :label="$t('Size')">
                                <el-row :gutter="10">
                                    <el-col :span="12">
                                        <el-input-number
                                            v-model="selectedElement.w"
                                            :min="1"
                                            :max="maxElementWidth"
                                            :step="0.1"
                                            :precision="1"
                                            size="mini"
                                            controls-position="right"
                                            @change="updateElementSize"
                                        />
                                        <label>W (%)</label>
                                    </el-col>
                                    <el-col :span="12">
                                        <el-input-number
                                            v-model="selectedElement.h"
                                            :min="1"
                                            :max="maxElementHeight"
                                            :step="0.1"
                                            :precision="1"
                                            size="mini"
                                            controls-position="right"
                                            @change="updateElementSize"
                                        />
                                        <label>H (%)</label>
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
                                    <el-color-picker v-model="selectedElement.props.color"
                                                     @change="updateElementProps"/>
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
                                        <el-button @click="openMediaLibrary" type="primary" size="small"
                                                   icon="el-icon-upload">
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
                                        <img :src="selectedElement.props.src"
                                             style="max-width: 150px; max-height: 100px; object-fit: contain;"
                                             alt="image"/>
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
                                            <el-select v-model="selectedElement.props.borderStyle" size="mini"
                                                       @change="updateElementProps">
                                                <el-option label="None" value="none"></el-option>
                                                <el-option label="Solid" value="solid"></el-option>
                                                <el-option label="Dashed" value="dashed"></el-option>
                                                <el-option label="Dotted" value="dotted"></el-option>
                                            </el-select>
                                            <label>Style</label>
                                        </el-col>
                                        <el-col :span="8">
                                            <el-color-picker v-model="selectedElement.props.borderColor" size="mini"
                                                             @change="updateElementProps"/>
                                            <label>Color</label>
                                        </el-col>
                                    </el-row>
                                </el-form-item>
                            </template>

                            <!-- Add table row/column controls in properties panel -->
                            <template v-if="selectedElement && selectedElement.type === 'table'">
                                <el-form-item :label="$t('Table Structure')">
                                    <el-row :gutter="10">
                                        <el-col :span="12">
                                            <label>Rows</label>
                                            <el-input-number
                                                v-model="selectedElement.props.rows"
                                                :min="1"
                                                :max="20"
                                                size="mini"
                                                controls-position="right"
                                                @change="updateTableRows"
                                            />
                                        </el-col>
                                        <el-col :span="12">
                                            <label>Columns</label>
                                            <el-input-number
                                                v-model="selectedElement.props.cols"
                                                :min="1"
                                                :max="20"
                                                size="mini"
                                                controls-position="right"
                                                @change="updateTableCols"
                                            />
                                        </el-col>
                                    </el-row>
                                </el-form-item>

                                <el-form-item :label="$t('Show Headers')">
                                    <el-switch v-model="selectedElement.props.showHeaders"
                                               @change="updateElementProps"></el-switch>
                                </el-form-item>

                                <el-form-item :label="$t('Border Width')">
                                    <el-input-number
                                        v-model="selectedElement.props.borderWidth"
                                        :min="0"
                                        :max="10"
                                        @change="updateElementProps"
                                    />
                                </el-form-item>

                                <el-form-item :label="$t('Border Color')">
                                    <el-color-picker v-model="selectedElement.props.borderColor"
                                                     @change="updateElementProps"></el-color-picker>
                                </el-form-item>

                                <el-form-item :label="$t('Cell Padding')">
                                    <el-input-number
                                        v-model="selectedElement.props.cellPadding"
                                        :min="0"
                                        :max="20"
                                        @change="updateElementProps"
                                    />
                                </el-form-item>
                            </template>

                            <!-- Table Cell Controls (when a cell is selected) -->
                            <template v-if="selectedTableCell">
                                <el-divider>{{ $t('Cell Properties') }}</el-divider>

                                <el-form-item :label="$t('Cell Background Color')">
                                    <el-color-picker
                                        :value="getCellBackgroundColor()"
                                        @change="updateCellBackgroundColor"
                                        show-alpha
                                    ></el-color-picker>
                                </el-form-item>

                                <el-form-item :label="$t('Column Span')">
                                    <el-input-number
                                        :value="getCurrentCellColspan()"
                                        @change="updateCellColspan"
                                        :min="1"
                                        :max="getMaxColspan()"
                                        size="mini"
                                    />
                                </el-form-item>

                                <el-form-item :label="$t('Row Span')">
                                    <el-input-number
                                        :value="getCurrentCellRowspan()"
                                        @change="updateCellRowspan"
                                        :min="1"
                                        :max="getMaxRowspan()"
                                        size="mini"
                                    />
                                </el-form-item>

                                <el-form-item>
                                    <el-button
                                        size="mini"
                                        @click="resetCellSpan()"
                                        type="text"
                                    >
                                        {{ $t('Reset Cell Span') }}
                                    </el-button>
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
            pages: [
                {
                    id: 'page_1',
                    elements: []
                }
            ],
            // Global header and footer settings for all pages
            globalHeaderSettings: {
                enabled: false,
                height: 60,
                content: '',
                backgroundColor: 'transparent',
                fontSize: 12,
                textAlign: 'center',
                color: '#000000'
            },
            globalFooterSettings: {
                enabled: false,
                height: 60,
                content: '',
                backgroundColor: 'transparent',
                fontSize: 12,
                textAlign: 'center',
                color: '#000000'
            },
            currentPageIndex: 0,
            draggingElement: null,
            resizing: false,
            resizeHandle: null,
            elementCounter: 0,
            isDragOver: false,
            isDragOverCell: null,
            isDragOverTableCell: false,
            dragOverTimeout: null,
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
                },
                {
                    type: 'table',
                    label: 'Table',
                    icon: 'el-icon-s-grid',
                    defaultProps: {
                        rows: 2,
                        cols: 2,
                        borderColor: '#ddd',
                        borderWidth: 1,
                        cellPadding: 8,
                        backgroundColor: 'transparent',
                        headerBgColor: '#f5f5f5',
                        showHeaders: false,
                        // Container-like structure for cells
                        cellFields: {}, // Store fields for each cell like {row-col: [fields]}
                        // Cell styling and spanning options
                        cellStyles: {}, // Store cell-specific styles like {row-col: {backgroundColor: '#fff', colspan: 1, rowspan: 1}}
                        cellSpans: {} // Store colspan/rowspan data like {row-col: {colspan: 1, rowspan: 1}}
                    }
                }
            ],
            selectedTableCell: null,
            draggedElement: null,
            draggedFromCell: null
        };
    },
    computed: {
        formData() {
            // Use sample data for preview purposes
            return this.sampleFormData;
        },

        canvasWidth() {
            return this.calculateCanvasWidth();
        },

        canvasHeight() {
            return this.calculateCanvasHeight();
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
        canvasRows() {
            // Create grid based on canvas height and cell size
            return Math.ceil(this.canvasHeight / this.gridSize);
        },

        canvasCols() {
            // Create grid based on canvas width and cell size
            return Math.ceil(this.canvasWidth / this.gridSize);
        },

        canvasTableStyle() {
            return {
                width: Math.round(this.canvasWidth) + 'px',
                height: Math.round(this.canvasHeight) + 'px',
                backgroundColor: '#ffffff',
                border: '1px solid #ddd',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                position: 'relative'
            };
        },

        canvasCellStyle() {
            return {
                width: this.gridSize + 'px',
                height: this.gridSize + 'px',
                border: '1px solid #f0f0f0',
                padding: '0',
                margin: '0',
                verticalAlign: 'top',
                position: 'relative'
            };
        },

        // Interactive layer style (positioned over background grid)
        interactiveLayerStyle() {
            return {
                position: 'absolute',
                top: '0',
                left: '0',
                width: Math.round(this.canvasWidth) + 'px',
                height: Math.round(this.canvasHeight) + 'px',
                pointerEvents: 'auto',
                zIndex: 10
            };
        },

        // Filter elements for main canvas (non-cell elements)
        mainCanvasElements() {
            const mainElements = this.pdfLayout.filter(element =>
                !element.parentCell &&
                !element.cellKey &&
                !element.parentTable &&
                element.type !== 'cell_element' // Extra safety check
            );

            // Ensure no duplicates by ID
            const seenIds = new Set();
            return mainElements.filter(element => {
                if (seenIds.has(element.i)) {
                    return false; // Remove duplicate
                }
                seenIds.add(element.i);
                return true;
            });
        },

        // Canvas bounds for input validation
        maxElementWidth() {
            if (!this.selectedElement) return 100;
            return 100 - parseFloat(this.selectedElement.x || 0);
        },

        maxElementHeight() {
            if (!this.selectedElement) return 100;
            return 100 - parseFloat(this.selectedElement.y || 0);
        },

        maxElementX() {
            if (!this.selectedElement) return 100;
            return 100 - parseFloat(this.selectedElement.w || 0);
        },

        maxElementY() {
            if (!this.selectedElement) return 100;
            return 100 - parseFloat(this.selectedElement.h || 0);
        },

        // Check if page has any elements
        hasElements() {
            return this.pdfLayout && this.pdfLayout.length > 0;
        },

        // Current page data
        currentPage() {
            return this.pages[this.currentPageIndex] || this.pages[0] || null;
        },

        headerSettings() {
            return this.currentPage?.headerSettings || {
                enabled: false,
                height: 60,
                content: '',
                backgroundColor: 'transparent',
                fontSize: 12,
                textAlign: 'center',
                color: '#000000'
            };
        },

        footerSettings() {
            return this.currentPage?.footerSettings || {
                enabled: false,
                height: 60,
                content: '',
                backgroundColor: 'transparent',
                fontSize: 12,
                textAlign: 'center',
                color: '#000000'
            };
        },

        // Computed properties for checkbox states (better reactivity)
        headerEnabled() {
            return this.globalHeaderSettings.enabled;
        },

        footerEnabled() {
            return this.globalFooterSettings.enabled;
        }
    },
    watch: {
        // Watch for changes in pdfLayout and ensure no duplicates
        pdfLayout: {
            handler(newLayout) {
                // Update current page elements
                if (this.currentPage && newLayout) {
                    this.currentPage.elements = [...newLayout];
                }

                this.$nextTick(() => {
                    this.validateLayoutIntegrity();
                });
            },
            deep: true
        },

        value: {
            handler(newValue) {
                this.pdfLayout = newValue || [];
            },
            immediate: true
        },


    },
    mounted() {
        this.initializeFromTemplateData();
        this.ensurePagesInitialized();

        // Emit initial template data to ensure parent has the complete structure
        this.$nextTick(() => {
            this.emitTemplateData();
        });
    },
    methods: {
        // Helper method to convert string/boolean to proper boolean
        convertToBoolean(value) {
            if (typeof value === 'boolean') {
                return value;
            }
            if (typeof value === 'string') {
                return value.toLowerCase() === 'true';
            }
            return !!value;
        },

        // Initialize component with saved template data
        initializeFromTemplateData() {
            if (this.templateData && this.templateData.pages && this.templateData.pages.length > 0) {
                // Load pages data with clean structure
                this.pages = this.templateData.pages.map(page => this.createCleanPageStructure(page));
                this.currentPageIndex = 0;

                // Load global header/footer settings from template data
                if (this.templateData.globalHeaderSettings) {
                    // Convert saved string values to proper types
                    this.globalHeaderSettings = {
                        enabled: this.convertToBoolean(this.templateData.globalHeaderSettings.enabled),
                        height: parseInt(this.templateData.globalHeaderSettings.height) || 60,
                        content: this.templateData.globalHeaderSettings.content || '',
                        backgroundColor: this.templateData.globalHeaderSettings.backgroundColor || 'transparent',
                        fontSize: parseInt(this.templateData.globalHeaderSettings.fontSize) || 12,
                        textAlign: this.templateData.globalHeaderSettings.textAlign || 'center',
                        color: this.templateData.globalHeaderSettings.color || '#000000'
                    };

                } else {
                    // Migration: Check if any page has header settings to migrate to global
                    this.migratePageHeadersToGlobal();
                }

                if (this.templateData.globalFooterSettings) {
                    // Convert saved string values to proper types
                    this.globalFooterSettings = {
                        enabled: this.convertToBoolean(this.templateData.globalFooterSettings.enabled),
                        height: parseInt(this.templateData.globalFooterSettings.height) || 60,
                        content: this.templateData.globalFooterSettings.content || '',
                        backgroundColor: this.templateData.globalFooterSettings.backgroundColor || 'transparent',
                        fontSize: parseInt(this.templateData.globalFooterSettings.fontSize) || 12,
                        textAlign: this.templateData.globalFooterSettings.textAlign || 'center',
                        color: this.templateData.globalFooterSettings.color || '#000000'
                    };

                } else {
                    // Migration: Check if any page has footer settings to migrate to global
                    this.migratePageFootersToGlobal();
                }

                // Load the first page elements
                const firstPage = this.pages[0];
                if (firstPage && firstPage.elements && firstPage.elements.length > 0) {
                    this.pdfLayout = [...firstPage.elements];
                    this.cleanupDuplicateCellElements();
                    this.ensureTableCellFieldsStructure();
                } else {
                    this.pdfLayout = [];
                }
            } else {
                // No template data - create default page
                this.createDefaultPage();
            }
        },

        // Create clean page structure from existing data or defaults
        createCleanPageStructure(pageData = null) {
            if (pageData) {
                // Clean existing page data - only use elements, no header/footer settings per page
                return {
                    id: pageData.id || 'page_' + Date.now(),
                    elements: pageData.elements || pageData.layout || []
                };
            } else {
                // Create new page with defaults
                return {
                    id: 'page_' + Date.now(),
                    elements: []
                };
            }
        },

        // Create default page when no template data exists
        createDefaultPage() {
            this.pages = [this.createCleanPageStructure()];
            this.currentPageIndex = 0;
            this.pdfLayout = [];
        },

        // Migration methods to convert old page-specific headers/footers to global
        migratePageHeadersToGlobal() {
            // Check if any page in the original template data has header settings
            if (this.templateData && this.templateData.pages) {
                for (const page of this.templateData.pages) {
                    if (page.headerSettings && this.convertToBoolean(page.headerSettings.enabled)) {
                        // Found a page with header - migrate to global
                        this.globalHeaderSettings = {
                            enabled: this.convertToBoolean(page.headerSettings.enabled),
                            height: parseInt(page.headerSettings.height) || 60,
                            content: page.headerSettings.content || '',
                            backgroundColor: page.headerSettings.backgroundColor || 'transparent',
                            fontSize: parseInt(page.headerSettings.fontSize) || 12,
                            textAlign: page.headerSettings.textAlign || 'center',
                            color: page.headerSettings.color || '#000000'
                        };

                        break; // Use the first header found
                    }
                }
            }
        },

        migratePageFootersToGlobal() {
            // Check if any page in the original template data has footer settings
            if (this.templateData && this.templateData.pages) {
                for (const page of this.templateData.pages) {
                    if (page.footerSettings && this.convertToBoolean(page.footerSettings.enabled)) {
                        // Found a page with footer - migrate to global
                        this.globalFooterSettings = {
                            enabled: this.convertToBoolean(page.footerSettings.enabled),
                            height: parseInt(page.footerSettings.height) || 60,
                            content: page.footerSettings.content || '',
                            backgroundColor: page.footerSettings.backgroundColor || 'transparent',
                            fontSize: parseInt(page.footerSettings.fontSize) || 12,
                            textAlign: page.footerSettings.textAlign || 'center',
                            color: page.footerSettings.color || '#000000'
                        };

                        break; // Use the first footer found
                    }
                }
            }
        },

        // Emit complete template data including global header/footer settings
        emitTemplateData() {
            // Clean pages data - remove any layout duplicates
            const cleanPages = this.pages.map(page => ({
                id: page.id,
                elements: page.elements || []
            }));

            const templateData = {
                pages: cleanPages,
                globalHeaderSettings: this.globalHeaderSettings,
                globalFooterSettings: this.globalFooterSettings
            };


            this.$emit('update:pages', templateData);
        },

        // Global header/footer property getters and setters
        getHeaderFooterProperty(property) {
            if (this.headerFooterType === 'header') {
                return this.globalHeaderSettings[property] || '';
            } else {
                return this.globalFooterSettings[property] || '';
            }
        },

        updateHeaderFooterProperty(property, value) {
            if (this.headerFooterType === 'header') {
                this.globalHeaderSettings[property] = value;
            } else {
                this.globalFooterSettings[property] = value;
            }
            this.emitTemplateData();
        },

        // Global header/footer enabled methods
        updateGlobalHeaderEnabled(value) {
            this.globalHeaderSettings.enabled = value;
            this.emitTemplateData();
        },

        updateGlobalFooterEnabled(value) {
            this.globalFooterSettings.enabled = value;
            this.emitTemplateData();
        },

        // Global header/footer styling methods for canvas
        getGlobalHeaderStyle() {
            const settings = this.globalHeaderSettings;

            // Convert textAlign to justifyContent for flexbox
            let justifyContent = 'center';
            if (settings.textAlign === 'left') {
                justifyContent = 'flex-start';
            } else if (settings.textAlign === 'right') {
                justifyContent = 'flex-end';
            }

            return {
                height: `${settings.height}px`,
                backgroundColor: settings.backgroundColor,
                color: settings.color,
                fontSize: `${settings.fontSize}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: justifyContent,
                padding: '10px',
                boxSizing: 'border-box',
                borderBottom: '1px solid #ddd',
                marginBottom: '10px'
            };
        },

        getGlobalHeaderContentStyle() {
            const settings = this.globalHeaderSettings;
            return {
                fontSize: `${settings.fontSize}px`,
                color: settings.color,
                textAlign: settings.textAlign,
                width: '100%'
            };
        },

        getGlobalFooterStyle() {
            const settings = this.globalFooterSettings;

            // Convert textAlign to justifyContent for flexbox
            let justifyContent = 'center';
            if (settings.textAlign === 'left') {
                justifyContent = 'flex-start';
            } else if (settings.textAlign === 'right') {
                justifyContent = 'flex-end';
            }

            return {
                height: `${settings.height}px`,
                backgroundColor: settings.backgroundColor,
                color: settings.color,
                fontSize: `${settings.fontSize}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: justifyContent,
                padding: '10px',
                boxSizing: 'border-box',
                borderTop: '1px solid #ddd',
                marginTop: '10px'
            };
        },

        getGlobalFooterContentStyle() {
            const settings = this.globalFooterSettings;
            return {
                fontSize: `${settings.fontSize}px`,
                color: settings.color,
                textAlign: settings.textAlign,
                width: '100%'
            };
        },

        // Global header/footer selection method
        selectHeaderFooter(type) {
            this.selectedElement = {
                type: type,
                isGlobal: true
            };
            this.selectedTableCell = null;
            this.headerFooterType = type;
            this.showHeaderFooterSettings = true;
            this.showElementPalette = false;
            this.showPageSettings = false;
        },

        // Ensure pages array is properly initialized
        ensurePagesInitialized() {
            // If pages array is empty or doesn't exist, create default page
            if (!this.pages || this.pages.length === 0) {
                this.createDefaultPage();
                return;
            }

            // Ensure current page index is valid
            if (this.currentPageIndex >= this.pages.length) {
                this.currentPageIndex = 0;
            }

            // Clean up any pages that don't have proper structure
            this.pages = this.pages.map(page => this.createCleanPageStructure(page));
        },

        // Remove duplicate cell elements from main layout that are already in cellFields
        cleanupDuplicateCellElements() {
            // More aggressive cleanup: remove ALL elements that have cell-related properties
            this.pdfLayout = this.pdfLayout.filter(element => {
                // Keep only main elements (tables and non-cell elements)
                const isMainElement = element.type === 'table' ||
                    (!element.parentCell && !element.cellKey && !element.parentTable);
                return isMainElement;
            });

            // Also clean up any remaining duplicates by ID
            const seenIds = new Set();
            this.pdfLayout = this.pdfLayout.filter(element => {
                if (seenIds.has(element.i)) {
                    return false; // Remove duplicate
                }
                seenIds.add(element.i);
                return true;
            });
        },

        // Ensure all table elements have proper cellFields structure
        ensureTableCellFieldsStructure() {
            this.pdfLayout.forEach(element => {
                if (element.type === 'table') {
                    // Initialize cellFields if not exists
                    if (!element.props.cellFields) {
                        this.$set(element.props, 'cellFields', {});
                    }

                    // Convert string numbers to integers for rows/cols
                    if (typeof element.props.rows === 'string') {
                        element.props.rows = parseInt(element.props.rows);
                    }
                    if (typeof element.props.cols === 'string') {
                        element.props.cols = parseInt(element.props.cols);
                    }

                    // Convert string numbers to floats for percentage-based position/size
                    if (typeof element.x === 'string') element.x = parseFloat(element.x);
                    if (typeof element.y === 'string') element.y = parseFloat(element.y);
                    if (typeof element.w === 'string') element.w = parseFloat(element.w);
                    if (typeof element.h === 'string') element.h = parseFloat(element.h);
                    if (typeof element.z === 'string') element.z = parseInt(element.z);
                }
            });
        },
        calculateCanvasWidth() {
            // Calculate based on paper size and orientation
            const paperSize = this.appearance.paper_size || 'A4';
            const orientation = this.appearance.orientation || 'P';

            // A4 dimensions in pixels (at 96 DPI) - increased for better table support
            if (paperSize === 'A4') {
                return orientation === 'P' ? 800 : 1200; // Increased width to support more columns
            }
            return 800; // Default increased width
        },

        calculateCanvasHeight() {
            const paperSize = this.appearance.paper_size || 'A4';
            const orientation = this.appearance.orientation || 'P';

            if (paperSize === 'A4') {
                return orientation === 'P' ? 842 : 595;
            }
            return 842; // Default A4 portrait
        },
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
            const currentCanvas = this.getCurrentCanvas();
            if (currentCanvas && !currentCanvas.contains(event.relatedTarget)) {
                this.isDragOver = false;
            }
        },

        handleCanvasDrop(event) {
            event.preventDefault();

            // Check if the drop target is actually within a table cell
            const dropTarget = event.target;
            const tableCellContainer = dropTarget.closest('.table-cell-canvas');
            const interactiveTable = dropTarget.closest('.interactive-table');

            // Only let table cell handle the drop if we're actually dropping ON a table cell
            if (tableCellContainer && interactiveTable) {
                // This is a table cell drop - let the table cell handler deal with it
                return;
            }

            // This is a canvas drop (outside any table cells)
            this.isDragOver = false;
            this.clearTableDragStates();

            try {
                const elementData = JSON.parse(event.dataTransfer.getData('text/plain'));
                if (elementData) {
                    this.addElementToCanvas(elementData, event);
                }
            } catch (e) {
                console.error('Error parsing dropped element data:', e);
            }
        },

        addElementToCanvas(elementData, event, pageIndex = null) {
            // Use the specified page index or current page
            const targetPageIndex = pageIndex !== null ? pageIndex : this.currentPageIndex;
            const canvasRef = `pdfCanvas_${targetPageIndex}`;

            // Get the canvas element - it might be an array due to v-for
            let canvasElement = this.$refs[canvasRef];
            if (Array.isArray(canvasElement)) {
                canvasElement = canvasElement[0];
            }

            if (!canvasElement || typeof canvasElement.getBoundingClientRect !== 'function') {
                console.error(`Canvas element not found or invalid for page ${targetPageIndex}`, canvasElement);
                return;
            }

            const canvasRect = canvasElement.getBoundingClientRect();

            // Calculate drop position as percentage of canvas
            const dropXPercent = ((event.clientX - canvasRect.left) / canvasRect.width) * 100;
            const dropYPercent = ((event.clientY - canvasRect.top) / canvasRect.height) * 100;

            // Snap to percentage grid (0.5% increments)
            const dropX = Math.round(dropXPercent * 2) / 2;
            const dropY = Math.round(dropYPercent * 2) / 2;

            const defaultWidth = this.getDefaultWidthPercent(elementData.type);
            const defaultHeight = this.getDefaultHeightPercent(elementData.type);

            // Ensure the position is within canvas bounds (percentage)
            const constrainedX = Math.max(0, Math.min(dropX, 100 - defaultWidth));
            const constrainedY = Math.max(0, Math.min(dropY, 100 - defaultHeight));

            this.addElement(elementData, constrainedX, constrainedY, targetPageIndex);
        },

        addElement(elementData, x, y, pageIndex = null) {
            // Use the specified page index or current page
            const targetPageIndex = pageIndex !== null ? pageIndex : this.currentPageIndex;
            const newElement = {
                i: `element_${++this.elementCounter}`,
                x: x,
                y: y,
                w: elementData.w || this.getDefaultWidthPercent(elementData.type),
                h: elementData.h || this.getDefaultHeightPercent(elementData.type),
                type: elementData.type,
                z: 1,
                props: {...elementData.defaultProps}
            };

            // Get the target page
            const targetPage = this.pages[targetPageIndex];
            if (!targetPage) {
                console.error(`Target page ${targetPageIndex} not found`);
                return;
            }

            // Ensure no duplicate IDs before adding
            const existingIndex = targetPage.elements.findIndex(el => el.i === newElement.i);
            if (existingIndex === -1) {
                targetPage.elements.push(newElement);

                // If adding to current page, update pdfLayout and select element
                if (targetPageIndex === this.currentPageIndex) {
                    this.pdfLayout.push(newElement);
                    this.selectedElement = newElement;
                    this.$emit('input', this.pdfLayout);
                }

                // Always emit pages update with global header/footer settings
                this.emitTemplateData();
            } else {
                console.warn('Attempted to add duplicate element ID:', newElement.i);
                // Generate a new unique ID and try again
                newElement.i = `element_${++this.elementCounter}_${Date.now()}`;
                targetPage.elements.push(newElement);

                if (targetPageIndex === this.currentPageIndex) {
                    this.pdfLayout.push(newElement);
                    this.selectedElement = newElement;
                    this.$emit('input', this.pdfLayout);
                }

                this.emitTemplateData();
            }
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
            this.selectedTableCell = null;

            // If it's a cell element, also highlight the parent table
            if (element.parentTable) {
                const parentTable = this.pdfLayout.find(el => el.i === element.parentTable);
                if (parentTable) {
                    // Could add visual indication of parent table
                }
            }
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
            const currentCanvas = this.getCurrentCanvas();
            if (event.target === currentCanvas || event.target.classList.contains('grid-background')) {
                this.selectedElement = null;
            }
        },

        // Drag Movement
        startDrag(event, element) {
            event.preventDefault();
            event.stopPropagation();

            this.selectElement(element);
            this.draggingElement = element.i;

            const currentCanvas = this.getCurrentCanvas();
            if (!currentCanvas) {
                console.error('Canvas ref not found');
                return;
            }

            const canvasRect = currentCanvas.getBoundingClientRect();
            const mouseScreenX = event.clientX - canvasRect.left;
            const mouseScreenY = event.clientY - canvasRect.top;

            // Convert element percentage position to pixels for drag offset calculation
            const elementPixelX = (element.x / 100) * canvasRect.width;
            const elementPixelY = (element.y / 100) * canvasRect.height;

            this._dragStartPos = {
                x: mouseScreenX - elementPixelX,
                y: mouseScreenY - elementPixelY
            };

            const boundHandleDragMove = this.handleDragMove.bind(this);
            const boundHandleDragEnd = this.handleDragEnd.bind(this);

            document.addEventListener('mousemove', boundHandleDragMove);
            document.addEventListener('mouseup', boundHandleDragEnd);

            this._boundHandleDragMove = boundHandleDragMove;
            this._boundHandleDragEnd = boundHandleDragEnd;
        },

        handleDragMove(event) {
            const currentCanvas = this.getCurrentCanvas();
            if (this.draggingElement !== null && currentCanvas) {
                const elementIndex = this.pdfLayout.findIndex(el => el.i === this.draggingElement);

                if (elementIndex !== -1) {
                    const element = this.pdfLayout[elementIndex];
                    const canvasRect = currentCanvas.getBoundingClientRect();

                    const mouseScreenX = event.clientX - canvasRect.left;
                    const mouseScreenY = event.clientY - canvasRect.top;

                    // Check if the mouse is over a header or footer area
                    if (this.isMouseOverHeaderFooter(event)) {
                        // Don't update position if over header/footer
                        return;
                    }

                    // Convert pixel position to percentage
                    let newX = ((mouseScreenX - this._dragStartPos.x) / canvasRect.width) * 100;
                    let newY = ((mouseScreenY - this._dragStartPos.y) / canvasRect.height) * 100;

                    // Snap to percentage grid (0.5% increments)
                    newX = Math.round(newX * 2) / 2;
                    newY = Math.round(newY * 2) / 2;

                    // Constrain to canvas bounds (percentage)
                    newX = Math.max(0, Math.min(newX, 100 - element.w));
                    newY = Math.max(0, Math.min(newY, 100 - element.h));

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
            this.isDragOverTableCell = false;
            this.isDragOverCell = null;

            if (this._boundHandleDragMove) {
                document.removeEventListener('mousemove', this._boundHandleDragMove);
                this._boundHandleDragMove = null;
            }
            if (this._boundHandleDragEnd) {
                document.removeEventListener('mouseup', this._boundHandleDragEnd);
                this._boundHandleDragEnd = null;
            }
        },

        // Helper methods
        getElementStyle(item) {
            return {
                position: 'absolute',
                left: item.x + '%',
                top: item.y + '%',
                width: item.w + '%',
                height: item.h + '%',
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
            if (event.target === event.currentTarget || event.target.classList.contains('canvas-cell')) {
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
                line: 5
            };
            return heights[type] || 30;
        },

        // Percentage-based default sizes
        getDefaultWidthPercent(type) {
            const widths = {
                text: 25,    // 25% of canvas width
                field: 20,   // 20% of canvas width
                image: 20,   // 20% of canvas width
                table: 40,   // 40% of canvas width
                line: 25     // 25% of canvas width
            };
            return widths[type] || 20;
        },

        getDefaultHeightPercent(type) {
            const heights = {
                text: 4,     // 4% of canvas height
                field: 5,    // 5% of canvas height
                image: 12,   // 12% of canvas height
                table: 15,   // 15% of canvas height
                line: 0.5    // 0.5% of canvas height
            };
            return heights[type] || 4;
        },

        findNonOverlappingPosition(preferredX, preferredY, width, height) {
            // Ensure the position is within canvas bounds
            preferredX = Math.max(0, Math.min(preferredX, this.canvasWidth - width));
            preferredY = Math.max(0, Math.min(preferredY, this.canvasHeight - height));

            if (!this.isPositionOccupied(preferredX, preferredY, width, height)) {
                return {x: preferredX, y: preferredY};
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
                        return {x: testX, y: testY};
                    }
                }
            }

            return {x: preferredX, y: preferredY};
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
            // Create a clean layout without duplicating cell elements
            const cleanLayout = [];

            this.pdfLayout.forEach(element => {
                // Always include main elements (non-cell elements)
                if (!element.parentCell && !element.cellKey) {
                    const normalizedElement = {
                        ...element,
                        x: parseFloat(element.x) || 0,
                        y: parseFloat(element.y) || 0,
                        w: parseFloat(element.w) || 20,
                        h: parseFloat(element.h) || 4,
                        z: parseInt(element.z) || 1,
                        props: {
                            ...element.props
                        }
                    };

                    // Normalize table element properties
                    if (element.type === 'table') {
                        normalizedElement.props.rows = parseInt(element.props.rows) || 2;
                        normalizedElement.props.cols = parseInt(element.props.cols) || 2;
                        normalizedElement.props.borderWidth = parseInt(element.props.borderWidth) ?? 1;
                        normalizedElement.props.cellPadding = parseInt(element.props.cellPadding) || 8;

                        // Ensure cellFields structure is preserved
                        if (element.props.cellFields) {
                            normalizedElement.props.cellFields = {};
                            Object.keys(element.props.cellFields).forEach(cellKey => {
                                normalizedElement.props.cellFields[cellKey] = element.props.cellFields[cellKey].map(cellElement => ({
                                    ...cellElement,
                                    props: {
                                        ...cellElement.props,
                                        fontSize: parseInt(cellElement.props.fontSize) || 14
                                    }
                                }));
                            });
                        }
                    } else {
                        // Normalize other element properties
                        if (element.props.fontSize) {
                            normalizedElement.props.fontSize = parseInt(element.props.fontSize) || 14;
                        }
                    }

                    cleanLayout.push(normalizedElement);
                }
            });

            this.pages[this.currentPageIndex].layout = cleanLayout;

            // Clean pages data - remove any layout duplicates for save
            const cleanPages = this.pages.map(page => ({
                id: page.id,
                elements: page.elements || []
            }));

            const templateData = {
                pages: cleanPages,
                globalHeaderSettings: this.globalHeaderSettings,
                globalFooterSettings: this.globalFooterSettings,
                appearance: this.appearance
            };


            this.$emit('save', templateData);
        },

        // Manual save trigger for testing
        manualSave() {
            this.savePdf();
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
                    this.$set(this.pdfLayout, elementIndex, {...this.selectedElement});
                }
            }
            this.$forceUpdate();
        },

        // Header/Footer methods
        getHeaderStyle() {
            const settings = (this.currentPage && this.currentPage.headerSettings) || {};
            return {
                width: '100%',
                height: (settings.height || 60) + 'px',
                backgroundColor: settings.backgroundColor || 'transparent',
                borderBottom: '1px solid #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: settings.textAlign || 'center',
                cursor: 'pointer',
                boxSizing: 'border-box'
            };
        },

        getHeaderContentStyle() {
            const settings = (this.currentPage && this.currentPage.headerSettings) || {};
            return {
                fontSize: (settings.fontSize || 12) + 'px',
                color: settings.color || '#000000',
                textAlign: settings.textAlign || 'center',
                width: '100%',
                padding: '0 10px'
            };
        },

        getFooterStyle() {
            const settings = (this.currentPage && this.currentPage.footerSettings) || {};
            return {
                width: '100%',
                height: (settings.height || 60) + 'px',
                backgroundColor: settings.backgroundColor || 'transparent',
                borderTop: '1px solid #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: settings.textAlign || 'center',
                cursor: 'pointer',
                boxSizing: 'border-box'
            };
        },

        getFooterContentStyle() {
            const settings = (this.currentPage && this.currentPage.footerSettings) || {};
            return {
                fontSize: (settings.fontSize || 12) + 'px',
                color: settings.color || '#000000',
                textAlign: settings.textAlign || 'center',
                width: '100%',
                padding: '0 10px'
            };
        },


        updateHeaderFooter() {
            // Update current page's header/footer settings
            if (this.currentPage && this.headerSettings && this.footerSettings) {
                this.currentPage.headerSettings = {...this.headerSettings};
                this.currentPage.footerSettings = {...this.footerSettings};

                // Emit changes to parent component
                this.emitTemplateData();
            }
        },


        // Helper method to get current canvas element
        getCurrentCanvas() {
            const canvasRef = `pdfCanvas_${this.currentPageIndex}`;
            let canvasElement = this.$refs[canvasRef];

            if (Array.isArray(canvasElement)) {
                canvasElement = canvasElement[0];
            }

            return canvasElement;
        },

        // Page-specific methods
        getPageElements(pageIndex) {
            const page = this.pages[pageIndex];
            return page ? page.elements || [] : [];
        },

        getPageWrapperStyle(pageIndex) {
            return {
                marginBottom: '40px',
                border: pageIndex === this.currentPageIndex ? '2px solid #409EFF' : '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: pageIndex === this.currentPageIndex ? '#f9f9f9' : '#ffffff',
                opacity: pageIndex === this.currentPageIndex ? 1 : 0.8
            };
        },

        focusPage(pageIndex) {
            // Save current page elements
            if (this.currentPage && this.pdfLayout) {
                this.currentPage.elements = [...this.pdfLayout];
            }

            // Switch to new page
            this.currentPageIndex = pageIndex;
            const newPage = this.pages[pageIndex];
            this.pdfLayout = newPage ? [...(newPage.elements || [])] : [];

            // Clear selections
            this.selectedElement = null;
            this.selectedTableCell = null;

            // Force reactivity update for header/footer checkboxes
            this.$forceUpdate();

            this.$emit('input', this.pdfLayout);
            this.emitTemplateData();
        },

        selectElementForPage(element, pageIndex) {
            if (pageIndex !== this.currentPageIndex) {
                this.focusPage(pageIndex);
            }
            this.selectElement(element);
        },

        selectHeaderFooterForPage(type, pageIndex) {
            if (pageIndex !== this.currentPageIndex) {
                this.focusPage(pageIndex);
            }
            this.selectHeaderFooter(type);
        },

        handleCanvasClickForPage(event, pageIndex) {
            if (pageIndex !== this.currentPageIndex) {
                this.focusPage(pageIndex);
            }
            this.handleCanvasClick(event);
        },

        handleCanvasDropForPage(event, pageIndex) {
            if (pageIndex !== this.currentPageIndex) {
                this.focusPage(pageIndex);
            }

            // Handle drop specifically for this page
            this.isDragOver = false;
            this.clearTableDragStates();

            try {
                const elementData = JSON.parse(event.dataTransfer.getData('text/plain'));
                if (elementData) {
                    this.addElementToCanvas(elementData, event, pageIndex);
                }
            } catch (e) {
                console.error('Error parsing dropped element data:', e);
            }
        },

        startDragForPage(event, element, pageIndex) {
            if (pageIndex !== this.currentPageIndex) {
                this.focusPage(pageIndex);
            }
            this.startDrag(event, element);
        },

        // Page-specific header/footer style methods
        getHeaderStyleForPage(page) {
            const settings = (page && page.headerSettings) || {};
            return {
                width: '100%',
                height: (settings.height || 60) + 'px',
                backgroundColor: settings.backgroundColor || 'transparent',
                borderBottom: '1px solid #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: settings.textAlign || 'center',
                cursor: 'pointer',
                boxSizing: 'border-box'
            };
        },

        getHeaderContentStyleForPage(page) {
            const settings = (page && page.headerSettings) || {};
            return {
                fontSize: (settings.fontSize || 12) + 'px',
                color: settings.color || '#000000',
                textAlign: settings.textAlign || 'center',
                width: '100%',
                padding: '0 10px'
            };
        },

        getFooterStyleForPage(page) {
            const settings = (page && page.footerSettings) || {};
            return {
                width: '100%',
                height: (settings.height || 60) + 'px',
                backgroundColor: settings.backgroundColor || 'transparent',
                borderTop: '1px solid #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: settings.textAlign || 'center',
                cursor: 'pointer',
                boxSizing: 'border-box'
            };
        },

        getFooterContentStyleForPage(page) {
            const settings = (page && page.footerSettings) || {};
            return {
                fontSize: (settings.fontSize || 12) + 'px',
                color: settings.color || '#000000',
                textAlign: settings.textAlign || 'center',
                width: '100%',
                padding: '0 10px'
            };
        },

        // Helper method to check if mouse is over header/footer area
        isMouseOverHeaderFooter(event) {
            const headerElements = document.querySelectorAll('.pdf-header');
            const footerElements = document.querySelectorAll('.pdf-footer');

            // Check if mouse is over any header
            for (let header of headerElements) {
                const rect = header.getBoundingClientRect();
                if (event.clientX >= rect.left && event.clientX <= rect.right &&
                    event.clientY >= rect.top && event.clientY <= rect.bottom) {
                    return true;
                }
            }

            // Check if mouse is over any footer
            for (let footer of footerElements) {
                const rect = footer.getBoundingClientRect();
                if (event.clientX >= rect.left && event.clientX <= rect.right &&
                    event.clientY >= rect.top && event.clientY <= rect.bottom) {
                    return true;
                }
            }

            return false;
        },

        // Header/Footer drag prevention methods
        handleHeaderFooterDragOver(event) {
            // Prevent default to show "not allowed" cursor
            event.preventDefault();
            event.stopPropagation();

            // Add visual feedback that dropping is not allowed
            event.dataTransfer.dropEffect = 'none';

            // Add visual class for styling
            event.currentTarget.classList.add('dragging-over-invalid');

            return false;
        },

        handleHeaderFooterDrop(event) {
            // Prevent drop and show message
            event.preventDefault();
            event.stopPropagation();

            // Remove visual class
            event.currentTarget.classList.remove('dragging-over-invalid');

            this.$message.warning(this.$t('Cannot drop elements in header or footer area. Please drop in the main canvas area.'));

            return false;
        },


        // Multi-page management methods
        addNewPage() {
            // Save current page elements before adding new page
            if (this.currentPage && this.pdfLayout) {
                this.currentPage.elements = [...this.pdfLayout];
            }

            // Create new page with clean structure
            const newPage = this.createCleanPageStructure();
            this.pages.push(newPage);
            this.currentPageIndex = this.pages.length - 1;

            // Clear selections and reset layout
            this.selectedElement = null;
            this.selectedTableCell = null;
            this.pdfLayout = [];

            // Emit updates
            this.$nextTick(() => {
                this.$emit('input', this.pdfLayout);
                this.emitTemplateData();
                this.$message.success(this.$t('New page added successfully'));
            });
        },

        switchPage(pageIndex) {
            // Validate page index
            if (pageIndex < 0 || pageIndex >= this.pages.length) {
                console.warn('Invalid page index:', pageIndex);
                return;
            }

            // Save current page elements if current page exists
            if (this.currentPage && this.pdfLayout) {
                this.currentPage.elements = [...this.pdfLayout];
            }

            // Switch to new page
            this.currentPageIndex = pageIndex;

            // Load new page elements safely
            const newPage = this.pages[pageIndex];
            if (newPage && newPage.elements) {
                this.pdfLayout = [...newPage.elements];
            } else {
                this.pdfLayout = [];
            }

            // Clear selections to prevent form injection errors
            this.selectedElement = null;
            this.selectedTableCell = null;

            // Force Vue to re-render components including header/footer checkboxes
            this.$forceUpdate();

            // Force Vue to re-render components
            this.$nextTick(() => {
                this.$emit('input', this.pdfLayout);
                this.emitTemplateData();
            });
        },

        confirmDeleteCurrentPage() {
            if (this.pages.length <= 1) {
                this.$message.warning(this.$t('Cannot delete the last page'));
                return;
            }

            this.$confirm(
                this.$t('This will permanently delete the current page and all its content. Continue?'),
                this.$t('Delete Page'),
                {
                    confirmButtonText: this.$t('Delete'),
                    cancelButtonText: this.$t('Cancel'),
                    type: 'warning'
                }
            ).then(() => {
                this.deleteCurrentPage();
            }).catch(() => {
                // User cancelled
            });
        },

        deleteCurrentPage() {
            if (this.pages.length <= 1) return;

            // Remove current page
            this.pages.splice(this.currentPageIndex, 1);

            // Adjust current page index
            if (this.currentPageIndex >= this.pages.length) {
                this.currentPageIndex = this.pages.length - 1;
            }

            // Load new current page
            this.pdfLayout = [...this.currentPage.elements];
            this.selectedElement = null;
            this.selectedTableCell = null;

            this.$emit('input', this.pdfLayout);
            this.emitTemplateData();
            this.$message.success(this.$t('Page deleted successfully'));
        },

        clearCurrentPage() {
            this.$confirm(
                this.$t('This will clear all elements but keep header/footer settings. Continue?'),
                this.$t('Clear Page'),
                {
                    confirmButtonText: this.$t('Clear'),
                    cancelButtonText: this.$t('Cancel'),
                    type: 'warning'
                }
            ).then(() => {
                // Clear only elements, keep header/footer
                this.pdfLayout = [];
                this.currentPage.elements = [];
                this.selectedElement = null;
                this.selectedTableCell = null;

                this.$emit('input', this.pdfLayout);
                this.emitTemplateData();
                this.$message.success(this.$t('Page cleared successfully'));
            }).catch(() => {
                // User cancelled
            });
        },

        // Methods for direct property panel updates with validation
        updateElementPosition() {
            if (this.selectedElement) {
                // Ensure position doesn't go out of canvas bounds
                const maxX = 100 - parseFloat(this.selectedElement.w || 0);
                const maxY = 100 - parseFloat(this.selectedElement.h || 0);

                this.selectedElement.x = Math.max(0, Math.min(maxX, parseFloat(this.selectedElement.x || 0)));
                this.selectedElement.y = Math.max(0, Math.min(maxY, parseFloat(this.selectedElement.y || 0)));
            }
            this.updateElementProps();
        },

        updateElementSize() {
            if (this.selectedElement) {
                // Ensure size doesn't make element go out of canvas bounds
                const maxW = 100 - parseFloat(this.selectedElement.x || 0);
                const maxH = 100 - parseFloat(this.selectedElement.y || 0);

                this.selectedElement.w = Math.max(1, Math.min(maxW, parseFloat(this.selectedElement.w || 0)));
                this.selectedElement.h = Math.max(1, Math.min(maxH, parseFloat(this.selectedElement.h || 0)));
            }
            this.updateElementProps();
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
        },
        getElementsInCell(row, col) {
            // Calculate which elements belong to this cell
            const cellX = (col - 1) * this.gridSize;
            const cellY = (row - 1) * this.gridSize;

            return this.pdfLayout.filter(element => {
                const elementCellX = Math.floor(element.x / this.gridSize) * this.gridSize;
                const elementCellY = Math.floor(element.y / this.gridSize) * this.gridSize;
                return elementCellX === cellX && elementCellY === cellY;
            });
        },
        getTableElementStyle(element) {
            // Position element within its cell
            const cellX = Math.floor(element.x / this.gridSize) * this.gridSize;
            const cellY = Math.floor(element.y / this.gridSize) * this.gridSize;
            const offsetX = element.x - cellX;
            const offsetY = element.y - cellY;

            return {
                position: 'absolute',
                left: offsetX + 'px',
                top: offsetY + 'px',
                width: element.w + 'px',
                height: element.h + 'px',
                zIndex: element.z || 1,
                cursor: 'move',
                border: this.selectedElement && this.selectedElement.i === element.i ? '2px solid #409EFF' : '1px dashed transparent',
                boxSizing: 'border-box'
            };
        },
        nestedTableStyle(element) {
            // Handle borderWidth: 0 case for table border collapse
            const borderWidth = element.props.borderWidth ?? 1;
            const borderCollapse = borderWidth > 0 ? 'collapse' : 'separate';

            return {
                width: '100%',
                height: '100%',
                borderCollapse: borderCollapse,
                backgroundColor: element.props.backgroundColor || 'transparent',
                tableLayout: 'fixed', // Fixed layout for consistent column widths
                minWidth: '100%' // Ensure table takes full width
            };
        },
        nestedTableCellStyle(element) {
            // Calculate responsive cell width based on number of columns
            const cellWidth = `${100 / element.props.cols}%`;

            // Handle borderWidth: 0 case
            const borderWidth = element.props.borderWidth ?? 0;
            const borderStyle = borderWidth > 0
                ? `${borderWidth}px solid ${element.props.borderColor || '#ddd'}`
                : 'none';

            return {
                border: borderStyle,
                padding: `${element.props.cellPadding || 4}px`,
                verticalAlign: 'top',
                fontSize: '12px',
                width: cellWidth,
                maxWidth: cellWidth,
                minWidth: '50px', // Minimum width to prevent too narrow cells
                wordWrap: 'break-word',
                overflow: 'hidden'
            };
        },
        nestedTableHeaderStyle(element) {
            // Handle borderWidth: 0 case for headers too
            const borderWidth = element.props.borderWidth ?? 1;
            const borderStyle = borderWidth > 0
                ? `${borderWidth}px solid ${element.props.borderColor || '#ddd'}`
                : 'none';

            return {
                border: borderStyle,
                padding: `${element.props.cellPadding || 8}px`,
                backgroundColor: element.props.headerBgColor || '#f5f5f5',
                fontWeight: 'bold',
                textAlign: 'center',
                fontSize: '12px'
            };
        },
        selectTableCell(element, row, col) {
            this.selectedTableCell = `${element.i}-${row}-${col}`;
            this.selectedElement = element;
        },
        editTableCell(element, row, col) {
            const cellKey = `${row}-${col}`;
            const currentContent = element.props.cellData[cellKey] || '';

            this.$prompt('Edit cell content:', 'Cell Editor', {
                inputValue: currentContent,
                inputType: 'textarea'
            }).then(({value}) => {
                if (!element.props.cellData) {
                    this.$set(element.props, 'cellData', {});
                }
                this.$set(element.props.cellData, cellKey, value);
            }).catch(() => {
                // User cancelled
            });
        },
        getCellContent(element, row, col) {
            const cellKey = `${row}-${col}`;
            return element.props.cellData && element.props.cellData[cellKey] || '';
        },


        // Container-like methods for table cells (adapted from NestedHandler)
        getCellFieldsList(tableElement, row, col) {
            const cellKey = `${row}-${col}`;

            // Initialize cell fields if not exists
            if (!tableElement.props.cellFields) {
                this.$set(tableElement.props, 'cellFields', {});
            }

            if (!tableElement.props.cellFields[cellKey]) {
                this.$set(tableElement.props.cellFields, cellKey, []);
            }

            return tableElement.props.cellFields[cellKey];
        },

        // Handle drop into table cell (container-like)
        handleCellDropElement(droppedItem, targetCellFields, tableElement, row, col) {
            // Check if element can be dropped in cell (prevent table nesting)
            if (!this.canDropInCell(droppedItem, tableElement)) {
                return;
            }

            // Create a new element for the cell
            const newElement = this.createCellElement(droppedItem, tableElement, row, col);

            // Add to cell fields list only (container-like approach)
            targetCellFields.push(newElement);

            this.selectedElement = newElement;
            this.updateElementProps();
        },

        // Handle moving element from one cell to another
        handleCellElementMoved(movedData, tableElement) {
            const {index, list, element} = movedData;

            // Remove from source list only (container-like approach)
            if (list && index > -1) {
                list.splice(index, 1);
            }
        },

        // Create element for cell (similar to container fields)
        createCellElement(elementData, tableElement, row, col) {
            const cellKey = `${row}-${col}`;

            const newElement = {
                i: `cell_element_${++this.elementCounter}`,
                type: elementData.type,
                parentCell: `${tableElement.i}-${row}-${col}`, // For compatibility
                parentTable: tableElement.i,
                cellRow: row,
                cellCol: col,
                cellKey: cellKey,
                // Container-like properties
                uniqElKey: `cell_element_${this.elementCounter}_${Date.now()}`,
                element: elementData.type,
                // Position within cell (list-based, not absolute)
                cellPosition: 'relative',
                // Default dimensions
                w: this.getDefaultWidth(elementData.type),
                h: this.getDefaultHeight(elementData.type),
                x: 0, // Not used in container mode
                y: 0, // Not used in container mode
                z: 1,
                props: {...elementData.defaultProps},
                // Editor options for compatibility
                editor_options: {
                    template: elementData.type
                },
                attributes: {
                    name: `${elementData.type}_${this.elementCounter}`,
                    class: ''
                },
                settings: {}
            };

            return newElement;
        },
        getCellElementStyle(element) {
            return {
                position: 'relative',
                margin: '2px 0',
                padding: '2px',
                border: '1px dashed #ccc',
                borderRadius: '2px'
            };
        },
        getCellElementComponent(element) {
            // Return appropriate component for rendering cell elements
            const componentMap = {
                text: 'div',
                field: 'div',
                image: 'img',
                line: 'hr'
            };
            return componentMap[element.type] || 'div';
        },

        addElementToTableCell(elementData, tableElement, row, col, dropX = 10, dropY = 10) {
            const cellKey = `${tableElement.i}-${row}-${col}`;

            // Get cell dimensions for constraint checking
            const cellWidth = Math.floor((tableElement.w - (tableElement.props.cols * 2)) / tableElement.props.cols);
            const cellHeight = Math.floor((tableElement.h - (tableElement.props.rows * 2)) / tableElement.props.rows);

            // Default element sizes for cells
            const defaultWidth = Math.min(this.getDefaultWidth(elementData.type) * 0.6, cellWidth - 20);
            const defaultHeight = Math.min(this.getDefaultHeight(elementData.type), cellHeight - 20);

            // Constrain drop position within cell bounds
            const constrainedX = Math.max(5, Math.min(dropX, cellWidth - defaultWidth - 5));
            const constrainedY = Math.max(5, Math.min(dropY, cellHeight - defaultHeight - 5));

            const newElement = {
                i: `cell_element_${++this.elementCounter}`,
                type: elementData.type,
                parentCell: cellKey,
                parentTable: tableElement.i,
                cellRow: row,
                cellCol: col,
                // Cell-relative positioning
                cellX: constrainedX,
                cellY: constrainedY,
                cellW: defaultWidth,
                cellH: defaultHeight,
                // Keep main canvas positioning for compatibility
                x: 0,
                y: 0,
                w: defaultWidth,
                h: defaultHeight,
                z: 1,
                props: {...elementData.defaultProps}
            };

            this.pdfLayout.push(newElement);
            this.selectedElement = newElement;
            this.selectedTableCell = cellKey;
            this.updateElementProps();
        },
        // Enhanced table creation with container-like functionality
        createTableContainer(rows = 2, cols = 2) {
            const tableElement = {
                i: `table_${++this.elementCounter}`,
                type: 'table',
                x: 50,
                y: 50,
                w: 400,
                h: 200,
                z: 1,
                props: {
                    rows: rows,
                    cols: cols,
                    borderColor: '#ddd',
                    borderWidth: 1,
                    cellPadding: 8,
                    backgroundColor: 'transparent',
                    showHeaders: false,
                    cellData: {},
                    // Container-like properties
                    allowNestedElements: true,
                    cellMinHeight: 50
                }
            };

            this.pdfLayout.push(tableElement);
            this.selectedElement = tableElement;
            return tableElement;
        },
        // Method to convert table to container-like structure
        getTableAsContainer(element) {
            if (element.type !== 'table') return null;

            const container = {
                element: 'container',
                columns: []
            };

            // Create columns based on table structure
            for (let col = 1; col <= element.props.cols; col++) {
                const column = {
                    width: Math.round(100 / element.props.cols),
                    fields: []
                };

                // Get all elements in this column across all rows
                for (let row = 1; row <= element.props.rows; row++) {
                    const cellElements = this.getCellElements(element, row, col);
                    column.fields.push(...cellElements);
                }

                container.columns.push(column);
            }

            return container;
        },
        // Update table dimensions
        updateTableDimensions(element, rows, cols) {
            if (element.type !== 'table') return;

            element.props.rows = rows;
            element.props.cols = cols;

            // Redistribute existing cell elements if needed
            this.redistributeTableElements(element);
        },
        redistributeTableElements(tableElement) {
            const cellElements = this.pdfLayout.filter(el =>
                el.parentTable === tableElement.i
            );

            // Remove elements that are outside new table bounds
            cellElements.forEach(el => {
                if (el.cellRow > tableElement.props.rows || el.cellCol > tableElement.props.cols) {
                    const index = this.pdfLayout.indexOf(el);
                    if (index > -1) {
                        this.pdfLayout.splice(index, 1);
                    }
                }
            });
        },
        // Fix cell drop handling
        handleCellDragOver(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
        },

        handleCellDragEnter(event) {
            event.preventDefault();
            const cell = event.currentTarget;
            const cellId = cell.dataset.cell;
            const tableId = this.selectedElement ? this.selectedElement.i : null;
            this.isDragOverCell = `${tableId}-${cellId}`;
        },

        handleCellDragLeave(event) {
            event.preventDefault();
            event.stopPropagation();

            if (this.dragOverTimeout) {
                clearTimeout(this.dragOverTimeout);
            }

            this.dragOverTimeout = setTimeout(() => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    this.isDragOverCell = null;
                    this.isDragOverTableCell = false;
                }
            }, 50);
        },
        // Fix resize functionality
        startResize(event, element, handle) {
            event.preventDefault();
            event.stopPropagation();

            this.resizing = true;
            this.resizeHandle = handle;
            this.selectElement(element);

            const currentCanvas = this.getCurrentCanvas();
            if (!currentCanvas) {
                console.error('Canvas ref not found for resize');
                return;
            }

            this._resizeStartPos = {
                x: event.clientX,
                y: event.clientY,
                elementX: element.x,
                elementY: element.y,
                elementW: element.w,
                elementH: element.h
            };

            const boundHandleResize = this.handleResize.bind(this);
            const boundHandleResizeEnd = this.handleResizeEnd.bind(this);

            document.addEventListener('mousemove', boundHandleResize);
            document.addEventListener('mouseup', boundHandleResizeEnd);

            this._boundHandleResize = boundHandleResize;
            this._boundHandleResizeEnd = boundHandleResizeEnd;
        },

        handleResize(event) {
            if (!this.resizing || !this.selectedElement) return;

            const element = this.selectedElement;
            const currentCanvas = this.getCurrentCanvas();
            if (!currentCanvas) return;

            const canvasRect = currentCanvas.getBoundingClientRect();

            // Convert pixel deltas to percentage deltas
            const deltaX = ((event.clientX - this._resizeStartPos.x) / canvasRect.width) * 100;
            const deltaY = ((event.clientY - this._resizeStartPos.y) / canvasRect.height) * 100;

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

            // Constrain to minimum size (percentage)
            newW = Math.max(1, newW); // 1% minimum width
            newH = Math.max(1, newH); // 1% minimum height

            // Check if this is a cell element or main canvas element
            if (element.parentCell) {
                // This is a cell element - use cell bounds
                const tableElement = this.pdfLayout.find(el => el.i === element.parentTable);
                if (tableElement) {
                    // For cell elements, we still use the existing logic since they're in a different coordinate system
                    // This would need more complex conversion, keeping existing for now
                    const cellWidth = Math.floor((tableElement.w - (tableElement.props.cols * 2)) / tableElement.props.cols) - 10;
                    const cellHeight = Math.floor((tableElement.h - (tableElement.props.rows * 2)) / tableElement.props.rows) - 10;

                    // Convert back to pixels for cell elements (they use pixel-based positioning within cells)
                    const pixelDeltaX = (deltaX / 100) * canvasRect.width;
                    const pixelDeltaY = (deltaY / 100) * canvasRect.height;

                    let cellNewX = this._resizeStartPos.elementX;
                    let cellNewY = this._resizeStartPos.elementY;
                    let cellNewW = this._resizeStartPos.elementW;
                    let cellNewH = this._resizeStartPos.elementH;

                    if (this.resizeHandle.includes('n')) {
                        cellNewY = this._resizeStartPos.elementY + pixelDeltaY;
                        cellNewH = this._resizeStartPos.elementH - pixelDeltaY;
                    }
                    if (this.resizeHandle.includes('s')) {
                        cellNewH = this._resizeStartPos.elementH + pixelDeltaY;
                    }
                    if (this.resizeHandle.includes('w')) {
                        cellNewX = this._resizeStartPos.elementX + pixelDeltaX;
                        cellNewW = this._resizeStartPos.elementW - pixelDeltaX;
                    }
                    if (this.resizeHandle.includes('e')) {
                        cellNewW = this._resizeStartPos.elementW + pixelDeltaX;
                    }

                    // Constrain to minimum size for cell elements
                    cellNewW = Math.max(1, cellNewW); // 1px minimum width
                    cellNewH = Math.max(1, cellNewH); // 1px minimum height

                    // Constrain to cell bounds
                    cellNewX = Math.max(2, Math.min(cellNewX, cellWidth - cellNewW));
                    cellNewY = Math.max(2, Math.min(cellNewY, cellHeight - cellNewH));
                    cellNewW = Math.min(cellNewW, cellWidth - cellNewX);
                    cellNewH = Math.min(cellNewH, cellHeight - cellNewY);

                    element.cellX = cellNewX;
                    element.cellY = cellNewY;
                    element.cellW = cellNewW;
                    element.cellH = cellNewH;
                }
            } else {
                // Ensure position doesn't go negative
                newX = Math.max(0, newX);
                newY = Math.max(0, newY);

                // Ensure element doesn't go outside canvas bounds
                // But don't artificially limit the size - only adjust position if needed
                if (newX + newW > 100) {
                    if (this.resizeHandle.includes('w')) {
                        // When resizing from west, adjust position to keep element in bounds
                        newX = 100 - newW;
                    } else {
                        // When resizing from east, limit width to stay in bounds
                        newW = 100 - newX;
                    }
                }

                if (newY + newH > 100) {
                    if (this.resizeHandle.includes('n')) {
                        // When resizing from north, adjust position to keep element in bounds
                        newY = 100 - newH;
                    } else {
                        // When resizing from south, limit height to stay in bounds
                        newH = 100 - newY;
                    }
                }

                // Snap to percentage grid (0.5% increments)
                newX = Math.round(newX * 2) / 2;
                newY = Math.round(newY * 2) / 2;
                newW = Math.round(newW * 2) / 2;
                newH = Math.round(newH * 2) / 2;

                element.x = newX;
                element.y = newY;
                element.w = newW;
                element.h = newH;
            }
        },

        handleCellElementDragEnd() {
            this.draggingElement = null;
            this._cellDragStartPos = null;

            if (this._boundHandleCellDragMove) {
                document.removeEventListener('mousemove', this._boundHandleCellDragMove);
                this._boundHandleCellDragMove = null;
            }
            if (this._boundHandleCellDragEnd) {
                document.removeEventListener('mouseup', this._boundHandleCellDragEnd);
                this._boundHandleCellDragEnd = null;
            }
        },

        // Cell element resize handling
        startCellElementResize(event, cellElement, tableElement, handle) {
            event.preventDefault();
            event.stopPropagation();

            this.resizing = true;
            this.resizeHandle = handle;
            this.selectElement(cellElement);

            this._cellResizeStartPos = {
                x: event.clientX,
                y: event.clientY,
                elementX: cellElement.cellX || 0,
                elementY: cellElement.cellY || 0,
                elementW: cellElement.cellW || 80,
                elementH: cellElement.cellH || 30,
                tableElement: tableElement
            };

            const boundHandleCellResize = this.handleCellElementResize.bind(this);
            const boundHandleCellResizeEnd = this.handleCellElementResizeEnd.bind(this);

            document.addEventListener('mousemove', boundHandleCellResize);
            document.addEventListener('mouseup', boundHandleCellResizeEnd);

            this._boundHandleCellResize = boundHandleCellResize;
            this._boundHandleCellResizeEnd = boundHandleCellResizeEnd;
        },

        handleCellElementResize(event) {
            if (!this.resizing || !this.selectedElement || !this._cellResizeStartPos) return;

            const element = this.selectedElement;
            const deltaX = event.clientX - this._cellResizeStartPos.x;
            const deltaY = event.clientY - this._cellResizeStartPos.y;

            let newX = this._cellResizeStartPos.elementX;
            let newY = this._cellResizeStartPos.elementY;
            let newW = this._cellResizeStartPos.elementW;
            let newH = this._cellResizeStartPos.elementH;

            // Handle different resize handles
            if (this.resizeHandle.includes('n')) {
                newY = this._cellResizeStartPos.elementY + deltaY;
                newH = this._cellResizeStartPos.elementH - deltaY;
            }
            if (this.resizeHandle.includes('s')) {
                newH = this._cellResizeStartPos.elementH + deltaY;
            }
            if (this.resizeHandle.includes('w')) {
                newX = this._cellResizeStartPos.elementX + deltaX;
                newW = this._cellResizeStartPos.elementW - deltaX;
            }
            if (this.resizeHandle.includes('e')) {
                newW = this._cellResizeStartPos.elementW + deltaX;
            }

            // Constrain to minimum size
            newW = Math.max(1, newW);
            newH = Math.max(1, newH);

            // Get cell bounds (approximate)
            const tableElement = this._cellResizeStartPos.tableElement;
            const cellWidth = Math.floor((tableElement.w - (tableElement.props.cols * 2)) / tableElement.props.cols) - 10;
            const cellHeight = Math.floor((tableElement.h - (tableElement.props.rows * 2)) / tableElement.props.rows) - 10;

            // Constrain to cell bounds
            newX = Math.max(2, Math.min(newX, cellWidth - newW));
            newY = Math.max(2, Math.min(newY, cellHeight - newH));
            newW = Math.min(newW, cellWidth - newX);
            newH = Math.min(newH, cellHeight - newY);

            // Snap to mini-grid
            const cellGridSize = 5;
            newX = Math.round(newX / cellGridSize) * cellGridSize;
            newY = Math.round(newY / cellGridSize) * cellGridSize;
            newW = Math.round(newW / cellGridSize) * cellGridSize;
            newH = Math.round(newH / cellGridSize) * cellGridSize;

            element.cellX = newX;
            element.cellY = newY;
            element.cellW = newW;
            element.cellH = newH;
        },

        handleCellElementResizeEnd() {
            this.resizing = false;
            this.resizeHandle = null;
            this._cellResizeStartPos = null;

            if (this._boundHandleCellResize) {
                document.removeEventListener('mousemove', this._boundHandleCellResize);
                this._boundHandleCellResize = null;
            }
            if (this._boundHandleCellResizeEnd) {
                document.removeEventListener('mouseup', this._boundHandleCellResizeEnd);
                this._boundHandleCellResizeEnd = null;
            }
        },

        // Main canvas drag handlers
        handleCanvasDragOver(event) {
            // Check if we're actually over a table cell
            const dropTarget = event.target;
            const tableCellContainer = dropTarget.closest('.table-cell-canvas');
            const interactiveTable = dropTarget.closest('.interactive-table');

            // Only skip if we're actually over a table cell
            if (tableCellContainer && interactiveTable) {
                return;
            }

            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
            this.isDragOver = true;
            // Clear table cell drag states when dragging over main canvas
            this.clearTableDragStates();
        },

        handleCanvasDragEnter(event) {
            // Check if we're actually over a table cell
            const dropTarget = event.target;
            const tableCellContainer = dropTarget.closest('.table-cell-canvas');
            const interactiveTable = dropTarget.closest('.interactive-table');

            // Only skip if we're actually over a table cell
            if (tableCellContainer && interactiveTable) {
                return;
            }

            event.preventDefault();
            this.isDragOver = true;
            // Clear table cell drag states when entering main canvas
            this.clearTableDragStates();
        },

        // Helper method to clear all table-related drag states
        clearTableDragStates() {
            this.isDragOverTableCell = false;
            this.isDragOverCell = null;
        },

        handleCanvasDragLeave(event) {
            // Only clear if we're actually leaving the canvas and not entering a table cell
            // Add null checks to prevent errors
            if (this.$refs.pdfCanvas && event.relatedTarget && !this.$refs.pdfCanvas.contains(event.relatedTarget)) {
                this.isDragOver = false;
                this.isDragOverTableCell = false;
            } else if (!event.relatedTarget) {
                // If relatedTarget is null, we're leaving the canvas entirely
                this.isDragOver = false;
                this.isDragOverTableCell = false;
            }
        },

        // Main resize end handler
        handleResizeEnd() {
            this.resizing = false;
            this.resizeHandle = null;
            this._resizeStartPos = null;

            if (this._boundHandleResize) {
                document.removeEventListener('mousemove', this._boundHandleResize);
                this._boundHandleResize = null;
            }
            if (this._boundHandleResizeEnd) {
                document.removeEventListener('mouseup', this._boundHandleResizeEnd);
                this._boundHandleResizeEnd = null;
            }
        },

        // Table cell drag and drop handlers (container-like)
        handleTableCellDrop(event, tableElement, row, col) {
            event.preventDefault();
            event.stopPropagation();

            // Clear dragover states
            this.isDragOverCell = null;
            this.isDragOverTableCell = false;
            this.isDragOver = false;

            try {
                const elementData = JSON.parse(event.dataTransfer.getData('text/plain'));
                if (elementData) {
                    // Get target cell fields list
                    const targetCellFields = this.getCellFieldsList(tableElement, row, col);

                    // Handle drop using container-like approach
                    this.handleCellDropElement(elementData, targetCellFields, tableElement, row, col);
                }
            } catch (error) {
                console.error('Error parsing dropped element data:', error);
            }
        },

        handleTableCellDragOver(event, tableElement, row, col) {
            event.preventDefault();
            event.stopPropagation();
            event.dataTransfer.dropEffect = 'copy';

            // Set table cell drag states
            this.isDragOverTableCell = true;
            this.isDragOverCell = `${tableElement.i}-${row}-${col}`;

            // Clear main canvas drag state
            this.isDragOver = false;
        },

        handleTableCellDragEnter(event, tableElement, row, col) {
            event.preventDefault();
            event.stopPropagation();

            // Set table cell drag states
            this.isDragOverTableCell = true;
            this.isDragOverCell = `${tableElement.i}-${row}-${col}`;

            // Clear main canvas drag state
            this.isDragOver = false;
        },

        handleTableCellDragLeave(event, tableElement, row, col) {
            event.preventDefault();
            event.stopPropagation();

            // Clear any existing timeout
            if (this.dragOverTimeout) {
                clearTimeout(this.dragOverTimeout);
            }

            // Use timeout to prevent flickering when moving between child elements
            this.dragOverTimeout = setTimeout(() => {
                const currentTarget = event.currentTarget;
                const relatedTarget = event.relatedTarget;

                // Only clear if we're actually leaving the cell (not moving to a child element)
                // Add null checks to prevent errors
                if (currentTarget && relatedTarget && !currentTarget.contains(relatedTarget)) {
                    this.isDragOverCell = null;
                    this.isDragOverTableCell = false;
                } else if (!relatedTarget) {
                    // If relatedTarget is null, we're leaving the element entirely
                    this.isDragOverCell = null;
                    this.isDragOverTableCell = false;
                }
            }, 50);
        },

        // Cell element drag handling
        startCellElementDrag(event, cellElement, tableElement, row, col) {
            event.preventDefault();
            event.stopPropagation();

            this.selectElement(cellElement);
            this.draggingElement = cellElement.i;

            const cellRect = event.currentTarget.getBoundingClientRect();
            const mouseX = event.clientX - cellRect.left;
            const mouseY = event.clientY - cellRect.top;

            this._cellDragStartPos = {
                x: mouseX - (cellElement.cellX || 0),
                y: mouseY - (cellElement.cellY || 0),
                tableElement: tableElement,
                row: row,
                col: col
            };

            const boundHandleCellDragMove = this.handleCellElementDragMove.bind(this);
            const boundHandleCellDragEnd = this.handleCellElementDragEnd.bind(this);

            document.addEventListener('mousemove', boundHandleCellDragMove);
            document.addEventListener('mouseup', boundHandleCellDragEnd);

            this._boundHandleCellDragMove = boundHandleCellDragMove;
            this._boundHandleCellDragEnd = boundHandleCellDragEnd;
        },

        handleCellElementDragMove(event) {
            if (this.draggingElement !== null && this._cellDragStartPos) {
                const elementIndex = this.pdfLayout.findIndex(el => el.i === this.draggingElement);

                if (elementIndex !== -1) {
                    const element = this.pdfLayout[elementIndex];
                    const tableElement = this._cellDragStartPos.tableElement;

                    // Get the actual cell element to calculate relative position
                    const cellElement = document.querySelector(`[data-table-id="${tableElement.i}"][data-cell="${this._cellDragStartPos.row}-${this._cellDragStartPos.col}"] .cell-canvas-area`);

                    if (cellElement) {
                        const cellRect = cellElement.getBoundingClientRect();

                        // Calculate new position relative to cell canvas
                        let newX = event.clientX - cellRect.left - this._cellDragStartPos.x;
                        let newY = event.clientY - cellRect.top - this._cellDragStartPos.y;

                        // Get cell dimensions
                        const cellWidth = cellRect.width - 8; // Account for padding
                        const cellHeight = cellRect.height - 8;

                        // Constrain to cell bounds
                        newX = Math.max(2, Math.min(newX, cellWidth - (element.cellW || 80) - 2));
                        newY = Math.max(2, Math.min(newY, cellHeight - (element.cellH || 30) - 2));

                        // Snap to mini-grid
                        const cellGridSize = 5;
                        newX = Math.round(newX / cellGridSize) * cellGridSize;
                        newY = Math.round(newY / cellGridSize) * cellGridSize;

                        element.cellX = newX;
                        element.cellY = newY;
                    }
                }
            }
        },

        // Cell canvas click handler
        handleCellCanvasClick(event, tableElement, row, col) {
            event.stopPropagation();
            this.selectedTableCell = `${tableElement.i}-${row}-${col}`;
        },

        // Cell styling helpers

        getCellGridStyle() {
            return {
                backgroundImage: `
          linear-gradient(to right, #f0f0f0 1px, transparent 1px),
          linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)
        `,
                backgroundSize: '5px 5px',
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none'
            };
        },

        getCellElementAbsoluteStyle(cellElement, tableElement) {
            return {
                position: 'absolute',
                left: (cellElement.cellX || 0) + 'px',
                top: (cellElement.cellY || 0) + 'px',
                width: (cellElement.cellW || 80) + 'px',
                height: (cellElement.cellH || 30) + 'px',
                zIndex: cellElement.z || 1,
                cursor: 'move',
                border: this.selectedElement && this.selectedElement.i === cellElement.i ? '2px solid #67c23a' : '1px solid transparent',
                boxSizing: 'border-box',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '2px'
            };
        },

        // Table structure management with input numbers
        updateTableRows(newRows) {
            if (!this.selectedElement || this.selectedElement.type !== 'table') return;

            const tableElement = this.selectedElement;
            const oldRows = tableElement.props.rows;

            // Ensure valid range
            newRows = Math.max(1, Math.min(20, parseInt(newRows) || 1));

            if (newRows < oldRows) {
                // Removing rows - check if any elements would be lost
                const elementsInRemovedRows = [];

                // Check cellFields for elements in removed rows
                if (tableElement.props.cellFields) {
                    for (let row = newRows + 1; row <= oldRows; row++) {
                        for (let col = 1; col <= tableElement.props.cols; col++) {
                            const cellKey = `${row}-${col}`;
                            if (tableElement.props.cellFields[cellKey] && tableElement.props.cellFields[cellKey].length > 0) {
                                elementsInRemovedRows.push(...tableElement.props.cellFields[cellKey]);
                            }
                        }
                    }
                }

                if (elementsInRemovedRows.length > 0) {
                    this.$confirm(
                        `This will remove ${elementsInRemovedRows.length} elements in the deleted rows. Continue?`,
                        'Remove Table Rows',
                        {
                            confirmButtonText: 'Remove',
                            cancelButtonText: 'Cancel',
                            type: 'warning'
                        }
                    ).then(() => {
                        // Remove elements in deleted rows from cellFields
                        for (let row = newRows + 1; row <= oldRows; row++) {
                            for (let col = 1; col <= tableElement.props.cols; col++) {
                                const cellKey = `${row}-${col}`;
                                if (tableElement.props.cellFields[cellKey]) {
                                    delete tableElement.props.cellFields[cellKey];
                                }
                            }
                        }

                        tableElement.props.rows = newRows;
                        this.updateElementProps();
                    }).catch(() => {
                        // User cancelled - revert the input value
                        this.$nextTick(() => {
                            tableElement.props.rows = oldRows;
                        });
                    });
                } else {
                    tableElement.props.rows = newRows;
                    this.updateElementProps();
                }
            } else {
                // Adding rows
                tableElement.props.rows = newRows;
                this.updateElementProps();
            }
        },

        updateTableCols(newCols) {
            if (!this.selectedElement || this.selectedElement.type !== 'table') return;

            const tableElement = this.selectedElement;
            const oldCols = tableElement.props.cols;

            // Ensure valid range
            newCols = Math.max(1, Math.min(20, parseInt(newCols) || 1));

            if (newCols < oldCols) {
                // Removing columns - check if any elements would be lost
                const elementsInRemovedCols = [];

                // Check cellFields for elements in removed columns
                if (tableElement.props.cellFields) {
                    for (let row = 1; row <= tableElement.props.rows; row++) {
                        for (let col = newCols + 1; col <= oldCols; col++) {
                            const cellKey = `${row}-${col}`;
                            if (tableElement.props.cellFields[cellKey] && tableElement.props.cellFields[cellKey].length > 0) {
                                elementsInRemovedCols.push(...tableElement.props.cellFields[cellKey]);
                            }
                        }
                    }
                }

                if (elementsInRemovedCols.length > 0) {
                    this.$confirm(
                        `This will remove ${elementsInRemovedCols.length} elements in the deleted columns. Continue?`,
                        'Remove Table Columns',
                        {
                            confirmButtonText: 'Remove',
                            cancelButtonText: 'Cancel',
                            type: 'warning'
                        }
                    ).then(() => {
                        // Remove elements in deleted columns from cellFields
                        for (let row = 1; row <= tableElement.props.rows; row++) {
                            for (let col = newCols + 1; col <= oldCols; col++) {
                                const cellKey = `${row}-${col}`;
                                if (tableElement.props.cellFields[cellKey]) {
                                    delete tableElement.props.cellFields[cellKey];
                                }
                            }
                        }

                        tableElement.props.cols = newCols;
                        this.updateElementProps();
                    }).catch(() => {
                        // User cancelled - revert the input value
                        this.$nextTick(() => {
                            tableElement.props.cols = oldCols;
                        });
                    });
                } else {
                    tableElement.props.cols = newCols;
                    this.updateElementProps();
                }
            } else {
                // Adding columns
                tableElement.props.cols = newCols;
                this.updateElementProps();
            }
        },

        // Table structure management (legacy button methods - keeping for compatibility)
        changeTableRows(tableElement, delta) {
            const newRows = Math.max(1, tableElement.props.rows + delta);

            if (delta < 0) {
                // Removing rows - check if any elements would be lost
                const elementsInRemovedRows = this.pdfLayout.filter(el =>
                    el.parentTable === tableElement.i && el.cellRow > newRows
                );

                if (elementsInRemovedRows.length > 0) {
                    this.$confirm(
                        `This will remove ${elementsInRemovedRows.length} elements in the deleted rows. Continue?`,
                        'Remove Table Rows',
                        {
                            confirmButtonText: 'Remove',
                            cancelButtonText: 'Cancel',
                            type: 'warning'
                        }
                    ).then(() => {
                        // Remove elements in deleted rows
                        elementsInRemovedRows.forEach(el => {
                            const index = this.pdfLayout.indexOf(el);
                            if (index > -1) {
                                this.pdfLayout.splice(index, 1);
                            }
                        });

                        tableElement.props.rows = newRows;
                        this.updateElementProps();
                    }).catch(() => {
                        // User cancelled
                    });
                } else {
                    tableElement.props.rows = newRows;
                    this.updateElementProps();
                }
            } else {
                // Adding rows
                tableElement.props.rows = newRows;
                this.updateElementProps();
            }
        },

        changeTableCols(tableElement, delta) {
            const newCols = Math.max(1, tableElement.props.cols + delta);

            if (delta < 0) {
                // Removing columns - check if any elements would be lost
                const elementsInRemovedCols = this.pdfLayout.filter(el =>
                    el.parentTable === tableElement.i && el.cellCol > newCols
                );

                if (elementsInRemovedCols.length > 0) {
                    this.$confirm(
                        `This will remove ${elementsInRemovedCols.length} elements in the deleted columns. Continue?`,
                        'Remove Table Columns',
                        {
                            confirmButtonText: 'Remove',
                            cancelButtonText: 'Cancel',
                            type: 'warning'
                        }
                    ).then(() => {
                        // Remove elements in deleted columns
                        elementsInRemovedCols.forEach(el => {
                            const index = this.pdfLayout.indexOf(el);
                            if (index > -1) {
                                this.pdfLayout.splice(index, 1);
                            }
                        });

                        tableElement.props.cols = newCols;
                        this.updateElementProps();
                    }).catch(() => {
                        // User cancelled
                    });
                } else {
                    tableElement.props.cols = newCols;
                    this.updateElementProps();
                }
            } else {
                // Adding columns
                tableElement.props.cols = newCols;
                this.updateElementProps();
            }
        },

        // Container-like drag handlers for cell elements
        handleCellElementDragStart(event, cellElement, tableElement, row, col, cellIndex) {
            event.stopPropagation();

            this.draggedElement = cellElement;
            this.draggedFromCell = {tableElement, row, col, cellIndex};

            // Set drag data
            event.dataTransfer.setData('text/plain', JSON.stringify({
                type: 'existing-cell-element',
                element: cellElement,
                sourceCell: {tableElement: tableElement.i, row, col, cellIndex}
            }));
            event.dataTransfer.effectAllowed = 'move';
        },

        // Delete cell element
        deleteCellElement(cellElement, tableElement, row, col, cellIndex) {
            this.$confirm(
                'Are you sure you want to delete this element?',
                'Delete Element',
                {
                    confirmButtonText: 'Delete',
                    cancelButtonText: 'Cancel',
                    type: 'warning'
                }
            ).then(() => {
                // Remove from cell fields list only (container-like approach)
                const cellFields = this.getCellFieldsList(tableElement, row, col);
                if (cellIndex > -1 && cellIndex < cellFields.length) {
                    cellFields.splice(cellIndex, 1);
                }

                // Clear selection if this element was selected
                if (this.selectedElement &&
                    (this.selectedElement.i === cellElement.i || this.selectedElement.uniqElKey === cellElement.uniqElKey)) {
                    this.selectedElement = null;
                }

                this.updateElementProps();
            }).catch(() => {
                // User cancelled
            });
        },

        // Enhanced cell canvas style for list-based layout
        getCellCanvasStyle(tableElement) {
            return {
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: '80px',
                padding: '8px',
                backgroundColor: '#fafafa',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                overflow: 'auto'
            };
        },

        // Get cell elements using table-based approach only
        getCellElements(element, row, col) {
            const cellKey = `${row}-${col}`;

            // Initialize cellFields if not exists
            if (!element.props.cellFields) {
                this.$set(element.props, 'cellFields', {});
            }

            if (!element.props.cellFields[cellKey]) {
                this.$set(element.props.cellFields, cellKey, []);
            }

            // Return elements with proper structure
            return element.props.cellFields[cellKey].map(cellElement => {
                // Convert string numbers to integers if needed
                if (typeof cellElement.props?.fontSize === 'string') {
                    cellElement.props.fontSize = parseInt(cellElement.props.fontSize);
                }
                return cellElement;
            });
        },

        // Table cell styling and spanning methods
        getTableCellStyle(tableElement, row, col) {
            const cellKey = `${row}-${col}`;
            const baseStyleObj = this.nestedTableCellStyle(tableElement);

            // Get cell-specific styles
            const cellStyles = tableElement.props.cellStyles || {};
            const cellStyle = cellStyles[cellKey] || {};

            // Convert style object to CSS string
            let cssString = Object.entries(baseStyleObj).map(([key, value]) => {
                // Convert camelCase to kebab-case
                const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                return `${cssKey}: ${value}`;
            }).join('; ');

            // Apply cell background color if set
            if (cellStyle.backgroundColor) {
                cssString += `; background-color: ${cellStyle.backgroundColor}`;
            }

            return cssString;
        },

        getCellColspan(tableElement, row, col) {
            const cellKey = `${row}-${col}`;
            const cellSpans = tableElement.props.cellSpans || {};
            return cellSpans[cellKey]?.colspan || 1;
        },

        getCellRowspan(tableElement, row, col) {
            const cellKey = `${row}-${col}`;
            const cellSpans = tableElement.props.cellSpans || {};
            return cellSpans[cellKey]?.rowspan || 1;
        },

        isCellHidden(tableElement, row, col) {
            // Check if this cell is hidden due to being covered by a colspan/rowspan
            const cellSpans = tableElement.props.cellSpans || {};

            for (let r = 1; r <= tableElement.props.rows; r++) {
                for (let c = 1; c <= tableElement.props.cols; c++) {
                    const spanKey = `${r}-${c}`;
                    const span = cellSpans[spanKey];

                    if (span && (span.colspan > 1 || span.rowspan > 1)) {
                        // Check if current cell is within the span range
                        if (r <= row && row < r + (span.rowspan || 1) &&
                            c <= col && col < c + (span.colspan || 1) &&
                            !(r === row && c === col)) {
                            return true;
                        }
                    }
                }
            }

            return false;
        },

        setCellColspan(tableElement, row, col, colspan) {
            const cellKey = `${row}-${col}`;

            if (!tableElement.props.cellSpans) {
                this.$set(tableElement.props, 'cellSpans', {});
            }

            if (!tableElement.props.cellSpans[cellKey]) {
                this.$set(tableElement.props.cellSpans, cellKey, {});
            }

            this.$set(tableElement.props.cellSpans[cellKey], 'colspan', Math.max(1, Math.min(colspan, tableElement.props.cols - col + 1)));
            this.updateElementProps();
        },

        setCellRowspan(tableElement, row, col, rowspan) {
            const cellKey = `${row}-${col}`;

            if (!tableElement.props.cellSpans) {
                this.$set(tableElement.props, 'cellSpans', {});
            }

            if (!tableElement.props.cellSpans[cellKey]) {
                this.$set(tableElement.props.cellSpans, cellKey, {});
            }

            this.$set(tableElement.props.cellSpans[cellKey], 'rowspan', Math.max(1, Math.min(rowspan, tableElement.props.rows - row + 1)));
            this.updateElementProps();
        },

        setCellBackgroundColor(tableElement, row, col, backgroundColor) {
            const cellKey = `${row}-${col}`;

            if (!tableElement.props.cellStyles) {
                this.$set(tableElement.props, 'cellStyles', {});
            }

            if (!tableElement.props.cellStyles[cellKey]) {
                this.$set(tableElement.props.cellStyles, cellKey, {});
            }

            this.$set(tableElement.props.cellStyles[cellKey], 'backgroundColor', backgroundColor);
            this.updateElementProps();
        },

        // Prevent table nesting
        canDropInCell(elementData, tableElement) {
            // Prevent dropping table elements inside table cells
            if (elementData.type === 'table') {
                this.$message.warning('Tables cannot be nested inside other tables');
                return false;
            }
            return true;
        },

        // Cell property management methods
        getCellBackgroundColor() {
            if (!this.selectedTableCell || typeof this.selectedTableCell !== 'string') return '';

            const parts = this.selectedTableCell.split('-');
            if (parts.length !== 3) return '';

            const [tableId, row, col] = parts;
            const tableElement = this.pdfLayout.find(el => el.i === tableId);

            if (tableElement) {
                const cellKey = `${row}-${col}`;
                const cellStyles = tableElement.props.cellStyles || {};
                return cellStyles[cellKey]?.backgroundColor || '';
            }

            return '';
        },

        updateCellBackgroundColor(color) {
            if (!this.selectedTableCell || typeof this.selectedTableCell !== 'string') return;

            const parts = this.selectedTableCell.split('-');
            if (parts.length !== 3) return;

            const [tableId, row, col] = parts;
            const tableElement = this.pdfLayout.find(el => el.i === tableId);

            if (tableElement) {
                this.setCellBackgroundColor(tableElement, parseInt(row), parseInt(col), color);
            }
        },

        getCurrentCellColspan() {
            if (!this.selectedTableCell || typeof this.selectedTableCell !== 'string') return 1;

            const parts = this.selectedTableCell.split('-');
            if (parts.length !== 3) return 1;

            const [tableId, row, col] = parts;
            const tableElement = this.pdfLayout.find(el => el.i === tableId);

            if (tableElement) {
                return this.getCellColspan(tableElement, parseInt(row), parseInt(col));
            }

            return 1;
        },

        getCurrentCellRowspan() {
            if (!this.selectedTableCell || typeof this.selectedTableCell !== 'string') return 1;

            const parts = this.selectedTableCell.split('-');
            if (parts.length !== 3) return 1;

            const [tableId, row, col] = parts;
            const tableElement = this.pdfLayout.find(el => el.i === tableId);

            if (tableElement) {
                return this.getCellRowspan(tableElement, parseInt(row), parseInt(col));
            }

            return 1;
        },

        updateCellColspan(colspan) {
            if (!this.selectedTableCell || typeof this.selectedTableCell !== 'string') return;

            const parts = this.selectedTableCell.split('-');
            if (parts.length !== 3) return;

            const [tableId, row, col] = parts;
            const tableElement = this.pdfLayout.find(el => el.i === tableId);

            if (tableElement) {
                this.setCellColspan(tableElement, parseInt(row), parseInt(col), colspan);
            }
        },

        updateCellRowspan(rowspan) {
            if (!this.selectedTableCell || typeof this.selectedTableCell !== 'string') return;

            const parts = this.selectedTableCell.split('-');
            if (parts.length !== 3) return;

            const [tableId, row, col] = parts;
            const tableElement = this.pdfLayout.find(el => el.i === tableId);

            if (tableElement) {
                this.setCellRowspan(tableElement, parseInt(row), parseInt(col), rowspan);
            }
        },

        getMaxColspan() {
            if (!this.selectedTableCell || typeof this.selectedTableCell !== 'string') return 1;

            const parts = this.selectedTableCell.split('-');
            if (parts.length !== 3) return 1;

            const [tableId, row, col] = parts;
            const tableElement = this.pdfLayout.find(el => el.i === tableId);

            if (tableElement) {
                return tableElement.props.cols - parseInt(col) + 1;
            }

            return 1;
        },

        getMaxRowspan() {
            if (!this.selectedTableCell || typeof this.selectedTableCell !== 'string') return 1;

            const parts = this.selectedTableCell.split('-');
            if (parts.length !== 3) return 1;

            const [tableId, row, col] = parts;
            const tableElement = this.pdfLayout.find(el => el.i === tableId);

            if (tableElement) {
                return tableElement.props.rows - parseInt(row) + 1;
            }

            return 1;
        },

        resetCellSpan() {
            if (!this.selectedTableCell || typeof this.selectedTableCell !== 'string') return;

            const parts = this.selectedTableCell.split('-');
            if (parts.length !== 3) return;

            const [tableId, row, col] = parts;
            const tableElement = this.pdfLayout.find(el => el.i === tableId);

            if (tableElement) {
                this.setCellColspan(tableElement, parseInt(row), parseInt(col), 1);
                this.setCellRowspan(tableElement, parseInt(row), parseInt(col), 1);
            }
        },

        // Validate layout integrity to prevent duplicate keys
        validateLayoutIntegrity() {
            const seenIds = new Set();
            const duplicateIds = [];

            // Check for duplicate IDs in main layout
            this.pdfLayout.forEach((element, index) => {
                if (seenIds.has(element.i)) {
                    duplicateIds.push(element.i);
                } else {
                    seenIds.add(element.i);
                }
            });

            // If duplicates found, clean them up
            if (duplicateIds.length > 0) {
                console.warn('Duplicate element IDs detected:', duplicateIds);
                this.cleanupDuplicateCellElements();
            }
        },


    }
}
</script>


