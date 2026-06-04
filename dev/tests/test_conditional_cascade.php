<?php
/**
 * Server-side conditional visibility must CASCADE like the client
 * (resources/assets/public/Pro/_ConditionClass.js): a field is visible only
 * when its own condition matches AND every conditional controller it references
 * is itself visible. This distinguishes the two reasons a referenced field is
 * absent from a submission:
 *   - a HIDDEN controller -> the dependent is hidden too (so a chained-hidden
 *     required field is not wrongly required); and
 *   - an empty SCALAR controller (text/select/hidden/radio) -> the dependent is
 *     hidden too, because the client coerces ''/missing to null and null fails
 *     every operator except "= ''" and regex; while
 *   - an unselected ARRAY controller (checkbox/multiselect) -> the dependent is
 *     kept, because [] != value is true on the client (#814 preserved).
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

/* Empty SCALAR controller, browser parity (_ConditionClass.js coerces ''/missing
 * to null, and null fails every operator except "= ''" and regex), so the
 * browser hides "!=" dependents of an empty text/select/hidden/radio control. */
$mapVisible = [
    'dependent' => ['status'=>true,'type'=>'all','conditions'=>[['field'=>'choice','operator'=>'!=','value'=>'Option 1']]],
];
check($vis('dependent',$mapVisible,['choice'=>'']) === false, 'dependent HIDDEN when scalar controller is present but empty (browser parity)');
check($vis('dependent',$mapVisible,[]) === false, 'dependent HIDDEN when scalar controller is missing (unselected radio, browser parity)');
check($vis('dependent',$mapVisible,['choice'=>'Option 1']) === false, 'dependent hidden when choice = Option 1');
check($vis('dependent',$mapVisible,['choice'=>'Option 2']) === true, 'dependent visible when choice has a non-matching value');
check($vis('choice',$mapVisible,['x'=>'y']) === true, 'non-conditional field always visible');

/* Form 483 reproduction: hidden input controller submitted as "" must hide its
 * "!=" dependents exactly like the browser did. */
$map483 = [
    'Abstellort' => ['status'=>true,'type'=>'any','conditions'=>[['field'=>'KdKlasse','operator'=>'!=','value'=>'3']]],
];
check($vis('Abstellort',$map483,['KdKlasse'=>'']) === false, 'form 483: required dependent hidden when hidden-input controller is empty');
check($vis('Abstellort',$map483,['KdKlasse'=>'1']) === true, 'form 483: dependent visible when controller is 1 (!= 3)');
check($vis('Abstellort',$map483,['KdKlasse'=>'3']) === false, 'form 483: dependent hidden when controller is 3');

/* Empty "=" still matches like the browser: "= ''" is satisfied by an empty controller. */
$mapEq = [
    'dependent' => ['status'=>true,'type'=>'any','conditions'=>[['field'=>'choice','operator'=>'=','value'=>'']]],
];
check($vis('dependent',$mapEq,['choice'=>'']) === true, 'dependent visible when "= empty" matches an empty controller');
check($vis('dependent',$mapEq,['choice'=>'x']) === false, 'dependent hidden when "= empty" sees a value');

/* Empty ARRAY controller (unselected checkbox/multiselect, the #814 case): the
 * browser keeps "!=" dependents because [] != value is true. The server is told
 * which controllers are array-typed via the arrayControllers argument. */
$arrayControllers = ['boxes' => true];
$mapArray = [
    'dependent' => ['status'=>true,'type'=>'all','conditions'=>[['field'=>'boxes','operator'=>'!=','value'=>'Option 1']]],
];
$emptyIn = [];
check(ConditionAssesor::isConditionallyVisible('dependent',$mapArray,$emptyIn,null,[],$arrayControllers) === true, 'dependent KEPT when an array controller (checkbox/multiselect) is unselected (#814 preserved)');
$pickedIn = ['boxes'=>['Option 1']];
check(ConditionAssesor::isConditionallyVisible('dependent',$mapArray,$pickedIn,null,[],$arrayControllers) === false, 'dependent hidden when the array controller picked the matching value');
$otherIn = ['boxes'=>['Option 2']];
check(ConditionAssesor::isConditionallyVisible('dependent',$mapArray,$otherIn,null,[],$arrayControllers) === true, 'dependent visible when the array controller picked another value');

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
