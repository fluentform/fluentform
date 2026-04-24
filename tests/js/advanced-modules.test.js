const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

function loadDefaultExport(relativePath) {
    const source = fs.readFileSync(
        path.resolve(__dirname, '../../', relativePath),
        'utf8'
    );

    let transformedSource = source;

    if (transformedSource.includes('export default function')) {
        transformedSource = transformedSource.replace('export default function', 'function defaultExport');
        transformedSource += '\nmodule.exports = defaultExport;';
    } else {
        transformedSource = transformedSource.replace('export default initNetPromoter;', 'module.exports = initNetPromoter;');
    }

    const module = { exports: {} };
    const factory = new Function('window', 'document', 'module', 'exports', transformedSource);
    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
        runScripts: 'outside-only',
        url: 'https://example.test'
    });

    factory(dom.window, dom.window.document, module, module.exports);

    return module.exports;
}

function createDom(html) {
    return new JSDOM(html, {
        runScripts: 'outside-only',
        url: 'https://example.test'
    });
}

test('dom-rating keeps active state and rating text in sync without jQuery', async () => {
    const ratingModule = loadDefaultExport('resources/assets/public/Pro/dom-rating.js');
    const dom = createDom(`
        <!doctype html>
        <html>
            <body>
                <form id="test-form">
                    <div class="ff-el-input--content">
                        <div class="jss-ff-el-ratings">
                            <label id="label-1">
                                <input id="rating-1" type="radio" name="rating" value="1">
                                <span class="jss-ff-svg"></span>
                            </label>
                            <label id="label-2">
                                <input id="rating-2" type="radio" name="rating" value="2" checked>
                                <span class="jss-ff-svg"></span>
                            </label>
                            <label id="label-3">
                                <input id="rating-3" type="radio" name="rating" value="3">
                                <span class="jss-ff-svg"></span>
                            </label>
                        </div>
                        <span class="ff-el-rating-text" data-id="rating-1">Poor</span>
                        <span class="ff-el-rating-text" data-id="rating-2">Good</span>
                        <span class="ff-el-rating-text" data-id="rating-3">Great</span>
                    </div>
                </form>
            </body>
        </html>
    `);
    const { window } = dom;
    const formElement = window.document.querySelector('#test-form');

    ratingModule(formElement);

    const labels = Array.from(window.document.querySelectorAll('.jss-ff-el-ratings label'));
    assert.equal(labels[0].classList.contains('active'), true);
    assert.equal(labels[1].classList.contains('active'), true);
    assert.equal(labels[2].classList.contains('active'), false);

    labels[2].dispatchEvent(new window.MouseEvent('mouseover', { bubbles: true }));

    assert.equal(labels[0].classList.contains('active'), true);
    assert.equal(labels[1].classList.contains('active'), true);
    assert.equal(labels[2].classList.contains('active'), true);
    assert.equal(window.document.querySelector('[data-id="rating-3"]').style.display, 'inline-block');

    labels[2].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    const iconElement = labels[2].querySelector('.jss-ff-svg');
    assert.equal(iconElement.classList.contains('scale'), true);
    assert.equal(iconElement.classList.contains('scalling'), true);

    await new Promise((resolve) => window.setTimeout(resolve, 170));
    assert.equal(iconElement.classList.contains('scale'), false);
    assert.equal(iconElement.classList.contains('scalling'), false);

    window.document.querySelector('#rating-2').checked = true;
    window.document.querySelector('.jss-ff-el-ratings').dispatchEvent(new window.MouseEvent('mouseleave', { bubbles: true }));

    assert.equal(labels[0].classList.contains('active'), true);
    assert.equal(labels[1].classList.contains('active'), true);
    assert.equal(labels[2].classList.contains('active'), false);
    assert.equal(window.document.querySelector('[data-id="rating-2"]').style.display, 'inline-block');
});

test('dom-net-promoter toggles a single active label without jQuery', () => {
    const netPromoterModule = loadDefaultExport('resources/assets/public/Pro/dom-net-promoter.js');
    const dom = createDom(`
        <!doctype html>
        <html>
            <body>
                <form id="test-form">
                    <div class="jss-ff-el-net-promoter">
                        <label id="net-1"><input type="radio" name="net" value="1"></label>
                        <label id="net-2"><input type="radio" name="net" value="2"></label>
                        <label id="net-3"><input type="radio" name="net" value="3"></label>
                    </div>
                </form>
            </body>
        </html>
    `);
    const { window } = dom;
    const formElement = window.document.querySelector('#test-form');

    netPromoterModule(formElement);

    const labels = Array.from(window.document.querySelectorAll('.jss-ff-el-net-promoter label'));
    labels[1].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

    assert.equal(labels[0].classList.contains('active'), false);
    assert.equal(labels[1].classList.contains('active'), true);
    assert.equal(labels[2].classList.contains('active'), false);
});
