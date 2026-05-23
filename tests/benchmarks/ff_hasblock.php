<?php
$cases = [
    '<!-- wp:fluentfom/guten-block /-->',
    '<!-- wp:fluentfom/guten-block --><!-- /wp:fluentfom/guten-block -->',
    '<!-- wp:fluentfom/guten-block {"formId":1} /-->',
    '[fluentform id="1"]',
];
foreach ($cases as $c) {
    $hb = has_block('fluentfom/guten-block', $c);
    $hs = has_shortcode($c, 'fluentform');
    echo 'block=' . ($hb ? 'Y' : 'n') . ' sc=' . ($hs ? 'Y' : 'n') . '  content=' . $c . PHP_EOL;
}
