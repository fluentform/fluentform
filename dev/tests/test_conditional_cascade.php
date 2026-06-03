<?php
/**
 * Server-side conditional visibility must CASCADE like the client
 * (resources/assets/public/Pro/_ConditionClass.js): a field is visible only
 * when its own condition matches AND every conditional controller it references
 * is itself visible. This distinguishes the two reasons a referenced field is
 * absent from a submission:
 *   - a HIDDEN controller -> the dependent is hidden too (so a chained-hidden
 *     required field is not wrongly required); and
 *   - a VISIBLE-but-empty controller (e.g. an untouched select) -> the
 *     dependent is kept (because "" != X is true, matching the frontend).
 *
 * assess() is untouched, so notification/confirmation/ff_if gating is unchanged.
 *
 * Run: php dev/tests/test_conditional_cascade.php
 */
error_reporting(E_ALL & ~E_DEPRECATED);
$r = ['pass'=>0,'fail'=>0];
function check($c,$l){ global $r; if($c){$r['pass']++;echo "  PASS  $l\n";}else{$r['fail']++;echo "  FAIL  $l\n";} }

if (!class_exists('FluentForm\Framework\Helpers\ArrayHelper')) require_once __DIR__.'/stubs/CascadeArrayHelper.php';
require_once __DIR__.'/../../app/Services/ConditionAssesor.php';
use FluentForm\App\Services\ConditionAssesor;

$vis = function($n,$map,$in){ return ConditionAssesor::isConditionallyVisible($n,$map,$in); };

/* Chained conditional: a controller hidden by its own conditional hides the dependent. */
$mapHidden = [
    'gate'      => ['status'=>true,'type'=>'any','conditions'=>[['field'=>'toggle','operator'=>'=','value'=>'yes']]],
    'dependent' => ['status'=>true,'type'=>'any','conditions'=>[['field'=>'gate','operator'=>'!=','value'=>'no']]],
];
check($vis('gate',$mapHidden,['toggle'=>'no']) === false, 'gate hidden when toggle != yes');
check($vis('dependent',$mapHidden,['toggle'=>'no']) === false, 'dependent HIDDEN because its controller (gate) is hidden');
check($vis('dependent',$mapHidden,['toggle'=>'yes','gate'=>'yes']) === true, 'dependent visible when controller visible and gate != no');
check($vis('dependent',$mapHidden,['toggle'=>'yes','gate'=>'no']) === false, 'dependent hidden when gate = no');

/* Visible-but-empty controller: a non-conditional control left untouched keeps its dependents. */
$mapVisible = [
    'dependent' => ['status'=>true,'type'=>'all','conditions'=>[['field'=>'choice','operator'=>'!=','value'=>'Option 1']]],
];
check($vis('dependent',$mapVisible,[]) === true, 'dependent KEPT when a visible controller (choice) is empty/untouched');
check($vis('dependent',$mapVisible,['choice'=>'Option 1']) === false, 'dependent hidden when choice = Option 1');
check($vis('choice',$mapVisible,['x'=>'y']) === true, 'non-conditional field always visible');

/* Circular dependency must resolve to hidden without looping. */
$circ = [
    'a'=>['status'=>true,'type'=>'any','conditions'=>[['field'=>'b','operator'=>'!=','value'=>'x']]],
    'b'=>['status'=>true,'type'=>'any','conditions'=>[['field'=>'a','operator'=>'!=','value'=>'x']]],
];
$empty=[];
check(ConditionAssesor::isConditionallyVisible('a',$circ,$empty) === false, 'circular dependency resolves to hidden without infinite loop');

/* assess()/evaluate() untouched: the flat gating path still treats missing as empty. */
$flat = ['conditionals'=>$mapHidden['dependent']];
$in = ['toggle'=>'no'];
check(ConditionAssesor::evaluate($flat,$in) === true, 'evaluate() default (gating) unchanged: missing treated as empty');

echo "\n  ".$r['pass']." passed, ".$r['fail']." failed\n";
exit($r['fail']>0?1:0);
